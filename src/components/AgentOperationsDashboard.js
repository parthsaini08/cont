import { useEffect, useMemo, useRef, useState } from "react";
import { BASE_URL } from "../config";

/* =========================================================
   SAFE UTC PARSER
========================================================= */
function parseUTC(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr.replace(" ", "T") + "Z");
}

/* =========================================================
   FORMATTERS
========================================================= */
function formatClock(dateStr) {
  const d = parseUTC(dateStr);
  if (!d) return "--";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(d);
}

function formatDuration(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${h.toString().padStart(2, "0")}h ${m
    .toString()
    .padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
}

/* =========================================================
   STATUS META
========================================================= */
const STATUS_META = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500"
  },
  busy: {
    label: "On Call",
    dot: "bg-rose-500",
    bar: "bg-rose-500"
  },
  dnd: {
    label: "DND",
    dot: "bg-orange-400",
    bar: "bg-orange-400"
  },
  queue_off: {
    label: "Queue Off",
    dot: "bg-yellow-400",
    bar: "bg-yellow-400"
  },
  offline: {
    label: "Offline",
    dot: "bg-gray-600",
    bar: "bg-gray-600"
  }
};

/* =========================================================
   MAIN DASHBOARD
========================================================= */
export default function AgentOperationsDashboard() {
  const [agents, setAgents] = useState([]);
  const ticker = useRef(null);

  /* ---------------- Fetch Both APIs ---------------- */
  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}get_agent_current_status.php`).then(res => res.json()),
      fetch(`${BASE_URL}get_agent_dashboard_timeline.php`).then(res => res.json())
    ])
      .then(([statusData, timelineData]) => {
        const merged = statusData.agents.map(agent => {
          const timelineAgent = timelineData.find(
            t => t.id === agent.id
          );

          return {
            ...agent,
            timeline: timelineAgent?.timeline || [],
            liveSeconds: agent.productive_seconds_today || 0
          };
        });

        setAgents(merged);
      })
      .catch(() => setAgents([]));
  }, []);

  /* ---------------- Live Timer ---------------- */
  useEffect(() => {
    ticker.current = setInterval(() => {
      setAgents(prev =>
        prev.map(a =>
          ["available", "busy"].includes(a.status)
            ? { ...a, liveSeconds: a.liveSeconds + 1 }
            : a
        )
      );
    }, 1000);

    return () => clearInterval(ticker.current);
  }, []);

  /* ---------------- KPI ---------------- */
  const kpis = useMemo(() => {
    return {
      available: agents.filter(a => a.status === "available").length,
      busy: agents.filter(a => a.status === "busy").length,
      dnd: agents.filter(a => a.status === "dnd").length
    };
  }, [agents]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#111827] text-gray-200 p-10 space-y-10">

      {/* ================= HEADER ================= */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">
          Real-Time Agent Operations
        </h1>
        <p className="text-gray-400">
          Live visibility of agent activity and daily performance timeline
        </p>
      </div>

      {/* ================= KPI SECTION ================= */}
      <div className="grid grid-cols-3 gap-6">
        <KpiCard label="Available Agents" value={kpis.available} color="emerald" />
        <KpiCard label="Agents On Call" value={kpis.busy} color="rose" />
        <KpiCard label="DND Agents" value={kpis.dnd} color="orange" />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-[#0f172a] border border-gray-700 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-sm">
          <thead className="bg-[#111827] text-gray-400">
            <tr>
              <th className="px-6 py-4 text-left">Agent</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Active Time</th>
              <th className="px-6 py-4 text-left">Timeline (Today)</th>
            </tr>
          </thead>

          <tbody>
            {agents.map(agent => (
              <tr
                key={agent.id}
                className="border-b border-gray-800 hover:bg-white/5 transition"
              >
                {/* Agent Name */}
                <td className="px-6 py-5 font-medium">
                  {agent.name}
                </td>

                {/* Status */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${STATUS_META[agent.status]?.dot}`} />
                    {STATUS_META[agent.status]?.label}
                  </div>
                </td>

                {/* Active Duration (FIXED) */}
                <td className="px-6 py-5 text-emerald-400 font-semibold">
                  {formatDuration(agent.liveSeconds)}
                </td>

                {/* Timeline */}
                <td className="px-6 py-5 w-[720px]">
                  <Timeline timeline={agent.timeline} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   KPI CARD
========================================================= */
function KpiCard({ label, value, color }) {
  const colorMap = {
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    rose: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-400"
  };

  return (
    <div className={`border rounded-xl p-6 ${colorMap[color]}`}>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

/* =========================================================
   TIMELINE COMPONENT
========================================================= */
function Timeline({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return <div className="text-xs text-gray-500">No data</div>;
  }

  const totalSeconds = timeline.reduce((sum, slot) => {
    const start = parseUTC(slot.start);
    const end = parseUTC(slot.end);
    return sum + Math.max(0, (end - start) / 1000);
  }, 0);

  if (totalSeconds <= 0) {
    return <div className="text-xs text-gray-500">No data</div>;
  }

  return (
    <div className="relative">
      <div className="flex h-5 rounded border border-gray-700 overflow-visible">
        {timeline.map((slot, index) => {
          const start = parseUTC(slot.start);
          const end = parseUTC(slot.end);
          const seconds = Math.max(0, (end - start) / 1000);
          const width = (seconds / totalSeconds) * 100;

          return (
            <div
              key={index}
              className={`relative group ${STATUS_META[slot.status]?.bar}`}
              style={{ width: `${width}%` }}
            >
              <div className="absolute hidden group-hover:block -top-20 left-1/2 -translate-x-1/2 bg-[#111827] text-white text-xs px-4 py-3 rounded-lg shadow-2xl border border-gray-700 whitespace-nowrap z-50">
                <div className="font-semibold mb-1">
                  {STATUS_META[slot.status]?.label}
                </div>
                <div className="text-gray-400">
                  {formatClock(slot.start)} → {formatClock(slot.end)}
                </div>
                <div className="text-emerald-400 mt-1 font-medium">
                  Duration: {formatDuration(seconds)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
