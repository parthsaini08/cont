import React, { useEffect, useRef, useState } from "react";
import { BASE_URL } from "../config";
import { Check, ChevronDown, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const CallSummaryTable = ({ dateRange }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("viewMode") || "queue");

  const dropdownRef = useRef(null);

  // ✅ Load agents
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

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Fetch summary
  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const addHoursUTC = (isoString, hours) => {
          if (!isoString) return "";
          const date = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
          date.setUTCHours(date.getUTCHours() + hours);
          return date.toISOString();
        };

        const start = addHoursUTC(dateRange.startDate, 5);
        const end = addHoursUTC(dateRange.endDate, 5);

        let url = "";
        if (viewMode === "queue") {
          url = `${BASE_URL}get_summary.php?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
        } else {
          const query = new URLSearchParams({ startDate: start, endDate: end });
          selectedAgents.forEach((a) => query.append("agents[]", a));
          url = `${BASE_URL}get_agent_summary.php?${query.toString()}`;
        }

        const res = await fetch(url, { credentials: "include" });
        const json = await res.json();
        setSummaryData(json.status === "success" ? json.summary || [] : []);
      } catch (err) {
        console.error("Failed to fetch summary:", err);
        setSummaryData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, [dateRange, viewMode, selectedAgents]);

  // ✅ Export both Queue & Agent views
  const exportToExcel = async () => {
    const addHoursUTC = (isoString, hours) => {
      if (!isoString) return "";
      const date = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
      date.setUTCHours(date.getUTCHours() + hours);
      return date.toISOString();
    };

    const start = addHoursUTC(dateRange.startDate, 5);
    const end = addHoursUTC(dateRange.endDate, 5);

    try {
      const queueUrl = `${BASE_URL}get_summary.php?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;
      const agentQuery = new URLSearchParams({ startDate: start, endDate: end });
      selectedAgents.forEach((a) => agentQuery.append("agents[]", a));
      const agentUrl = `${BASE_URL}get_agent_summary.php?${agentQuery.toString()}`;

      const [queueRes, agentRes] = await Promise.all([
        fetch(queueUrl, { credentials: "include" }),
        fetch(agentUrl, { credentials: "include" }),
      ]);

      const [queueJson, agentJson] = await Promise.all([queueRes.json(), agentRes.json()]);
      const queueData = queueJson.status === "success" ? queueJson.summary || [] : [];
      const agentData = agentJson.status === "success" ? agentJson.summary || [] : [];

      if (!queueData.length && !agentData.length) return alert("No data to export.");

      const formatData = (data, isQueue = true) =>
        data.map((row) => ({
          [isQueue ? "Queue Name" : "Agent Name"]: row.queue_name || row.agent_name || "-",
          "Total Calls": row.total_calls,
          "Accepted Calls": row.accepted_calls,
          "Missed Calls": row.missed_calls,
          "Productive": row.productive_calls,
          "Converted": row.converted_calls,
          "MCO": row.MCO?.toFixed(2) || "0.00",
          "Avg Call Length": `${Math.floor(row.avg_call_duration_seconds / 60)}m ${Math.floor(row.avg_call_duration_seconds) % 60}s`,
          "Quality Calls": row.quality_calls,
        }));

      const wb = XLSX.utils.book_new();
      if (queueData.length)
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatData(queueData, true)), "Queue Summary");
      if (agentData.length)
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(formatData(agentData, false)), "Agent Summary");

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), `CallSummary_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export data.");
    }
  };

  const handleSwitchView = () => {
    setViewMode((prev) => {
      const newMode = prev === "queue" ? "agent" : "queue";
      localStorage.setItem("viewMode", newMode);
      return newMode;
    });
  };

  return (
    <div className="bg-[#0f172a] rounded-lg shadow border border-gray-700 overflow-hidden mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 sm:px-4 py-3 border-b border-gray-700 gap-3">
        <h2 className="font-semibold text-base sm:text-lg text-white">
          {viewMode === "queue" ? "Call Summary by Queue" : "Call Summary by Agent"}
        </h2>

        <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full sm:w-auto" ref={dropdownRef}>
          {viewMode === "agent" && (
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setShowAgentDropdown((prev) => !prev)}
                className="bg-[#1e293b] text-white text-sm px-3 py-2 rounded-md border border-gray-600 flex items-center justify-between w-full sm:min-w-[220px] hover:border-gray-400 transition"
              >
                {selectedAgents.length > 0
                  ? `${selectedAgents.length} Agent(s)`
                  : "Select Agents"}
                <ChevronDown size={16} />
              </button>

              {showAgentDropdown && (
                <div className="absolute z-50 bg-[#0f172a] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto w-full sm:w-64 mt-2">
                  {agents.map((agent) => {
                    const isSelected = selectedAgents.includes(agent.name);
                    return (
                      <div
                        key={agent.id}
                        onClick={() =>
                          setSelectedAgents((prev) =>
                            prev.includes(agent.name)
                              ? prev.filter((a) => a !== agent.name)
                              : [...prev, agent.name]
                          )
                        }
                        className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer hover:bg-[#1e293b] ${
                          isSelected ? "text-indigo-400" : "text-gray-300"
                        }`}
                      >
                        <span>{agent.name}</span>
                        {isSelected && <Check size={16} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button
            onClick={exportToExcel}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-3 py-2 rounded-md font-medium text-sm bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 shadow-md text-white"
          >
            <FileDown size={16} /> Export to Excel
          </button>

          <button
            onClick={handleSwitchView}
            className="w-full sm:w-auto px-3 py-2 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 shadow-md"
          >
            Switch to {viewMode === "queue" ? "Agent" : "Queue"}
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-gray-300 p-4">Loading summary...</div>
      ) : summaryData.length === 0 ? (
        <div className="text-gray-400 p-4 text-sm text-center">No summary available.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm text-gray-300 min-w-[700px]">
            <thead>
              <tr className="bg-[#1e293b] text-gray-300 uppercase text-[10px] sm:text-xs tracking-wide">
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">
                  {viewMode === "queue" ? "Queue Name" : "Agent Name"}
                </th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Total</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Accepted</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Missed</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Productive</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Converted</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">MCO</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Avg Length</th>
                <th className="p-2 sm:p-3 text-center">Quality</th>
              </tr>
            </thead>

            <tbody>
              {summaryData.map((row, index) => {
                const isTotal = row.queue_name === "Total" || row.agent_name === "Total";
                return (
                  <tr
                    key={index}
                    className={`border-b border-gray-700 ${
                      isTotal ? "bg-indigo-900 font-bold text-white" : "hover:bg-[#1e293b]"
                    }`}
                  >
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.queue_name || row.agent_name || "-"}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.total_calls}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.accepted_calls}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.missed_calls}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.productive_calls}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.converted_calls}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.MCO?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {Math.floor(row.avg_call_duration_seconds / 60)}m{" "}
                      {Math.floor(row.avg_call_duration_seconds) % 60}s
                    </td>
                    <td className="p-2 sm:p-3 text-center">{row.quality_calls}</td>
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
