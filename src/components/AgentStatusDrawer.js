import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { BASE_URL } from "../config";

// ----------------------------
// Status → UI mapping
// ----------------------------
const STATUS_META = {
  busy: { color: "bg-rose-500", symbol: "●", label: "Busy", text: "text-rose-400" },
  available: { color: "bg-emerald-500", symbol: "✓", label: "Available", text: "text-emerald-400" },
  dnd: { color: "bg-orange-400", symbol: "⛔", label: "DND", text: "text-orange-400" },
  queue_off: { color: "bg-yellow-400", symbol: "⏸", label: "Queue Off", text: "text-yellow-400" },
  offline: { color: "bg-gray-500", symbol: "○", label: "Offline", text: "text-gray-400" }
};

const STATUS_ORDER = ["busy", "available", "dnd", "queue_off", "offline"];
const STATUS_PRIORITY = { busy: 1, available: 2, dnd: 3, queue_off: 4, offline: 5 };

// ----------------------------
// Utils
// ----------------------------
const formatDuration = (sec = 0) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h.toString().padStart(2, "0")}h ${m
    .toString()
    .padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
};

export default function AgentStatusDrawer() {
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState([]);
  const ticker = useRef(null);

  // Initial load
  useEffect(() => {
    fetch(`${BASE_URL}get_agent_current_status.php`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setAgents(
          data.agents.map((a) => ({
            ...a,
            liveSeconds: a.productive_seconds_today || 0
          }))
        )
    }
      )
      .catch(() => setAgents([]));
  }, []);

  // Live ticker (productive time)
  useEffect(() => {
    if (!open) return;

    ticker.current = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) =>
          ["available", "busy"].includes(a.status)
            ? { ...a, liveSeconds: a.liveSeconds + 1 }
            : a
        )
      );
    }, 1000);

    return () => clearInterval(ticker.current);
  }, [open]);

  const statusCounts = useMemo(
    () =>
      agents.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {}),
    [agents]
  );

  return (
    <>
      {/* Collapsed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-1/2 right-0 z-50 bg-[#1e293b] border border-gray-700 rounded-l-2xl px-2 py-3 shadow-xl space-y-2"
        >
          {STATUS_ORDER.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${STATUS_META[s].color}`} />
              <span className="text-xs font-semibold text-gray-200">
                {statusCounts[s] || 0}
              </span>
            </div>
          ))}
        </button>
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-40 bg-[#0f172a]/95 border-l border-gray-700 shadow-2xl transition-transform duration-300
        ${open ? "translate-x-0" : "translate-x-full"} w-80`}
      >
        <div className="px-4 py-4 border-b border-gray-700 flex justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">Agent Status</h3>
            <p className="text-xs text-gray-400">Productive time today</p>
          </div>
          <button onClick={() => setOpen(false)}>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {agents.map((a) => {
            const meta = STATUS_META[a.status];
            return (
              <div
                key={a.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-cyan-400 shrink-0">
                    {formatDuration(a.liveSeconds)}
                  </span>
                  <span className={`w-3 h-3 rounded-full ${meta.color}`} />
                  <span className="text-sm text-gray-200 truncate">
                    {a.name}
                  </span>
                </div>
                <span className={`text-xs font-semibold ${meta.text}`}>
                  {meta.symbol}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
