import React, { useEffect, useRef, useState } from "react";
import { BASE_URL } from "../config";
import { Check, ChevronDown, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const CallSummaryTable = ({ dateRange, onRowClick }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("viewMode") || "queue"
  );

  const dropdownRef = useRef(null);

  /* ===================== LOAD AGENTS ===================== */
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch("/extensions.json");
        const data = await res.json();
        setAgents(data.filter((item) => item.type === "User"));
      } catch (err) {
        console.error("Failed to load extensions.json:", err);
      }
    };
    loadAgents();
  }, []);

  /* ===================== CLOSE DROPDOWN ===================== */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ===================== FETCH SUMMARY ===================== */
  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const addHoursUTC = (isoString, hours) => {
          if (!isoString) return "";
          const date = new Date(
            isoString.endsWith("Z") ? isoString : isoString + "Z"
          );
          date.setUTCHours(date.getUTCHours() + hours);
          return date.toISOString();
        };

        const start = addHoursUTC(dateRange.startDate, 5);
        const end = addHoursUTC(dateRange.endDate, 5);

        let url = "";
        if (viewMode === "queue") {
          url = `${BASE_URL}get_summary.php?startDate=${encodeURIComponent(
            start
          )}&endDate=${encodeURIComponent(end)}`;
        } else {
          const query = new URLSearchParams({
            startDate: start,
            endDate: end,
          });
          selectedAgents.forEach((a) => query.append("agents[]", a));
          url = `${BASE_URL}get_agent_summary.php?${query.toString()}`;
        }

        const res = await fetch(url, { credentials: "include" });
        const json = await res.json();
        setSummaryData(
          json.status === "success" ? json.summary || [] : []
        );
      } catch (err) {
        console.error("Failed to fetch summary:", err);
        setSummaryData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [dateRange, viewMode, selectedAgents]);

  /* ===================== EXPORT ===================== */
  const exportToExcel = async () => {
    try {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(summaryData),
        viewMode === "queue" ? "Queue Summary" : "Agent Summary"
      );
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(
        new Blob([wbout], { type: "application/octet-stream" }),
        `CallSummary_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleSwitchView = () => {
    setViewMode((prev) => {
      const next = prev === "queue" ? "agent" : "queue";
      localStorage.setItem("viewMode", next);
      return next;
    });
  };

  /* ===================== RENDER ===================== */
  return (
    <div className="bg-[#0f172a] rounded-lg shadow border border-gray-700 overflow-visible mb-6">
      {/* HEADER */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
        <h2 className="font-semibold text-lg text-white">
          {viewMode === "queue"
            ? "Call Summary by Queue"
            : "Call Summary by Agent"}
        </h2>

        <div className="flex gap-2" ref={dropdownRef}>
          {viewMode === "agent" && (
  <div className="relative">
    <button
  onClick={() => setShowAgentDropdown((p) => !p)}
  title={selectedAgents.join(", ")}
  className="bg-[#1e293b] text-sm px-3 py-2 rounded-md border border-gray-600 flex items-center gap-2 max-w-[260px] truncate"
>
  {selectedAgents.length === 0
    ? "Select Agents"
    : selectedAgents.length <= 2
    ? selectedAgents.join(", ")
    : `${selectedAgents.slice(0, 2).join(", ")} +${
        selectedAgents.length - 2
      } more`}
  <ChevronDown size={14} />
</button>


    {showAgentDropdown && (
      <div className="absolute right-0 mt-2 z-[9999] bg-[#0f172a] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto w-64">
        {agents.length === 0 && (
          <div className="px-4 py-2 text-sm text-gray-400">
            No agents found
          </div>
        )}

        {agents.map((agent) => {
          const agentKey = agent.name;

          const isSelected = selectedAgents.includes(agentKey);

          return (
            <div
              key={agentKey}
              onClick={() =>
                setSelectedAgents((prev) =>
                  prev.includes(agentKey)
                    ? prev.filter((a) => a !== agentKey)
                    : [...prev, agentKey]
                )
              }
              className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer
                hover:bg-[#1e293b]
                ${isSelected ? "text-indigo-400" : "text-gray-300"}`}
            >
              <span>{agent.name}</span>
              {isSelected && <Check size={14} />}
            </div>
          );
        })}
      </div>
    )}
  </div>
)}


          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-indigo-600 text-white"
          >
            <FileDown size={16} /> Export
          </button>

          <button
            onClick={handleSwitchView}
            className="px-3 py-2 rounded-md text-sm bg-indigo-600 text-white"
          >
            Switch to {viewMode === "queue" ? "Agent" : "Queue"}
          </button>
        </div>
      </div>

      {/* TABLE */}
      {isLoading ? (
        <div className="p-4 text-gray-300">Loading summary...</div>
      ) : summaryData.length === 0 ? (
        <div className="p-4 text-gray-400 text-center">
          No summary available.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300 border-collapse border border-gray-700">
            <thead>
              <tr className="bg-[#1e293b] text-xs uppercase">
                <th className="p-3 text-center">
                  {viewMode === "queue" ? "Queue Name" : "Agent Name"}
                </th>
                <th className="p-3 text-center">Total</th>
                <th className="p-3 text-center">Accepted</th>
                <th className="p-3 text-center">Missed</th>
                <th className="p-3 text-center">Productive</th>
                <th className="p-3 text-center">Converted</th>
                <th className="p-3 text-center">MCO</th>
                <th className="p-3 text-center">Avg Length</th>
                <th className="p-3 text-center">Quality</th>
              </tr>
            </thead>

            <tbody>
              {summaryData.map((row, index) => {
                const isTotal =
                  row.queue_name === "Total" ||
                  row.agent_name === "Total";

                return (
                  <tr
                    key={index}
                    onClick={() => {
                      if (isTotal) return;

                      if (viewMode === "queue") {
                        onRowClick?.({
                          type: "queue",
                          value: row.queue_name,
                        });
                      } else {
                        onRowClick?.({
                          type: "agent",
                          value: row.agent_name,
                        });
                      }
                    }}
                    title={
                      isTotal
                        ? "Summary row"
                        : "Click to view call details"
                    }
                    className={`border-b border-gray-700 ${
                      isTotal
                        ? "bg-indigo-900 font-bold text-white"
                        : "cursor-pointer hover:bg-[#1e293b]"
                    }`}
                  >
                    <td className="p-3 text-center border-r border-gray-700">

                      {row.queue_name || row.agent_name}
                    </td>
                    <td className="p-3 text-center border-r border-gray-700">{row.total_calls}</td>
                    <td className="p-3 text-center border-r border-gray-700">
                      {row.accepted_calls}
                    </td>
                    <td className="p-3 text-center border-r border-gray-700">
                      {row.missed_calls}
                    </td>
                    <td className="p-3 text-center border-r border-gray-700">
                      {row.productive_calls}
                    </td>
                    <td className="p-3 text-center border-r border-gray-700">
                      {row.converted_calls}
                    </td>
                    <td className="p-3 text-center border-r border-gray-700">
                      {row.MCO?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-3 text-center border-r border-gray-700">
                      {Math.floor(row.avg_call_duration_seconds / 60)}m{" "}
                      {Math.floor(row.avg_call_duration_seconds % 60)}s
                    </td>
                    <td className="p-3 text-center">
                      {row.quality_calls}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CallSummaryTable;
