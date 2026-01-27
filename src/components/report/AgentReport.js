import React, { useState } from "react";
import DateTimeRangePicker from "../DateRangeFilter";
import { BASE_URL } from "../../config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AgentReport = () => {

    // ✅ Get current NY time as ISO string format
  const getNYNow = () => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = Object.fromEntries(
      formatter.formatToParts(new Date()).map((p) => [p.type, p.value])
    );

    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  };

  // ✅ Get yesterday in NY timezone
  // ✅ Get exactly 24 hours ago in NY timezone
const getNYYesterday = () => {
  const now = new Date();

  // Format today's date in New York time zone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((p) => [p.type, p.value])
  );

  // Return today's date at 12:00:00 AM NY time
  return `${parts.year}-${parts.month}-${parts.day}T00:00:00`;
};
  const [period1, setPeriod1] = useState({ startDate: getNYYesterday(), endDate: getNYNow() });
  const [period2, setPeriod2] = useState({ startDate: "", endDate: "" });

  const [compare, setCompare] = useState(false);
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  /* =============================
     Fetch helper
  ============================= */
  const addHoursUTC = (isoString, hours) => {
      if (!isoString) return "";
      // Append "Z" to treat it as UTC
      const date = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
      date.setUTCHours(date.getUTCHours() + hours); // add hours in UTC
      return date.toISOString(); // returns correct UTC ISO string
    };

  const fetchPeriod = async (period) => {
    const params = new URLSearchParams({
      startDate: addHoursUTC(period.startDate, 5),
      endDate: addHoursUTC(period.endDate, 5),
    });

    const res = await fetch(
      `${BASE_URL}/get_agent_summary.php?${params.toString()}`,
      { credentials: "include" }
    );

    const json = await res.json();
    return Array.isArray(json.summary) ? json.summary : [];
  };
  
  

  /* =============================
     Fetch & Compare
  ============================= */
  const fetchReport = async () => {
    setLoading(true);

    const p1 = await fetchPeriod(period1);
    const p2 = compare ? await fetchPeriod(period2) : [];

    const p2Index = {};
    p2.forEach((r) => {
      p2Index[r.agent_name] = r;
    });

    const merged = p1.map((r1) => {
      const r2 = p2Index[r1.agent_name];

      return {
        agent_name: r1.agent_name,
        period1: {
          calls: r1.total_calls,
          mco: r1.MCO,
        },
        period2: r2
          ? {
              calls: r2.total_calls,
              mco: r2.MCO,
            }
          : null,
      };
    });

    setRows(merged);
    setLoading(false);
  };

  /* =============================
     Excel Export
  ============================= */
  const downloadExcel = () => {
    const data = rows.map((r) => ({
      Agent: r.agent_name,
      "Calls (P1)": r.period1.calls,
      "MCO (P1)": r.period1.mco,
      ...(compare && r.period2
        ? {
            "Calls (P2)": r.period2.calls,
            "MCO (P2)": r.period2.mco,
            "Δ Calls": r.period2.calls - r.period1.calls,
            "Δ MCO": r.period2.mco - r.period1.mco,
          }
        : {}),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agent Comparison");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "agent-comparison.xlsx");
  };

  return (
    <div className="min-h-[calc(100vh-64px)] p-6 h-full bg-[#11182b] text-gray-200">
      <h2 className="text-2xl font-semibold mb-4 text-white">
        Agent Comparison Report
      </h2>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-[#11182b] border border-gray-700 rounded-xl p-4 mb-6 flex gap-4 flex-wrap items-center">
        <button
          onClick={() => setShowP1(true)}
          className="px-4 py-2 bg-[#1f2a48] rounded-md border border-gray-700 hover:bg-[#2a365c]"
        >
         { period1.startDate && period1.endDate
            ? `${new Date(period1.startDate).toLocaleDateString()} - ${new Date(
                period1.endDate
              ).toLocaleDateString()}`
            : "Period 1"}
        </button>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
          />
          Compare
        </label>

        {compare && (
          <button
            onClick={() => setShowP2(true)}
            className="px-4 py-2 bg-[#1f2a48] rounded-md border border-gray-700"
          >
            {period2.startDate && period2.endDate
              ? `${new Date(period2.startDate).toLocaleDateString()} - ${new Date(
                  period2.endDate
                ).toLocaleDateString()}`
              : "Period 2"}
          </button>
        )}

        <button
          onClick={fetchReport}
          disabled={!period1.startDate || !period1.endDate}
          className="px-4 py-2 bg-cyan-600 text-black rounded-md disabled:opacity-50"
        >
          Apply
        </button>

        <button
          onClick={downloadExcel}
          disabled={!rows.length}
          className="px-4 py-2 bg-emerald-600 text-black rounded-md disabled:opacity-50"
        >
          Download Excel
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-[#11182b] border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-400">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#1a2337]">
              <tr>
                <th className="p-3 text-left">Agent</th>
                <th className="p-3">Calls (P1)</th>
                <th className="p-3">MCO (P1)</th>
                {compare && (
                  <>
                    <th className="p-3">Calls (P2)</th>
                    <th className="p-3">MCO (P2)</th>
                    <th className="p-3">Δ Calls</th>
                    <th className="p-3">Δ MCO</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.agent_name}-${i}`}
                  className="border-t border-gray-800 hover:bg-[#1f2a48]"
                >
                  <td className="p-3">{r.agent_name}</td>
                  <td className="p-3 text-center">{r.period1.calls}</td>
                  <td className="p-3 text-center text-cyan-400 font-semibold">
                    {r.period1.mco}
                  </td>

                  {compare && r.period2 && (
                    <>
                      <td className="p-3 text-center">
                        {r.period2.calls}
                      </td>
                      <td className="p-3 text-center text-cyan-400 font-semibold">
                        {r.period2.mco}
                      </td>
                      <td className="p-3 text-center">
                        {r.period2.calls - r.period1.calls}
                      </td>
                      <td
                        className={`p-3 text-center font-semibold ${
                          r.period2.mco - r.period1.mco >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {((r.period2.mco - r.period1.mco)/r.period1.mco*100).toFixed(2)}%
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODAL: PERIOD 1 ================= */}
      {showP1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowP1(false)}
          />
          <div className="relative z-10">
            <DateTimeRangePicker
              initialStartDate={period1.startDate}
              initialEndDate={period1.endDate}
              onApply={(r) => {
                setPeriod1(r);
                setShowP1(false);
              }}
              onCancel={() => setShowP1(false)}
            />
          </div>
        </div>
      )}

      {/* ================= MODAL: PERIOD 2 ================= */}
      {showP2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowP2(false)}
          />
          <div className="relative z-10">
            <DateTimeRangePicker
              initialStartDate={period2.startDate}
              initialEndDate={period2.endDate}
              onApply={(r) => {
                setPeriod2(r);
                setShowP2(false);
              }}
              onCancel={() => setShowP2(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentReport;
