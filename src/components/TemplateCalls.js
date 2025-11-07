import React, { useState, useEffect } from "react";
import CallDetailsModal from "./CallDetailsModal";
import FilterButton from "./FilterButton";
import { BASE_URL } from "../config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import FilterPopup from "./FilterPopup";
import CallSummaryTable from "./CallSummary";
import { Trash2 } from "lucide-react";
import AddCallModal from "./AddCallModal";


const TempCallsTable = () => {
  const [calls, setCalls] = useState([]);
  const [columnFilters, setColumnFilters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [formData, setFormData] = useState({});
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [resultsPerPage, setResultsPerPage] = useState(20);
  const [extensions, setExtensions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);


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




  // ✅ Initialize with NY timezone dates
  const [dateRange, setDateRange] = useState({
    startDate: getNYYesterday(),
    endDate: getNYNow(),
  });

  const allColumns = [
    { key: "start_time", label: "Date" },
    { key: "direction", label: "Direction" },
    { key: "from_number", label: "From" },
    { key: "from_name", label: "From Name" },
    { key: "to_number", label: "To" },
    { key: "call_log_status", label: "Status" },
    { key: "queue_name", label: "Queue Name" },
    { key: "agent_name", label: "Agent Name" },
    { key: "duration_ms", label: "Duration" },
    { key: "customer_type", label: "Customer Type" },
    { key: "airline", label: "Airline" },
    { key: "mco", label: "MCO" },
    { key: "booking_number", label: "booking number" },
    { key: "type", label: "Type" },
    { key: "converted", label: "Result" },
    { key: "reason", label: "Reason-Not Converted" },
    { key: "flight_usage", label: "Flight Usage" },
    { key: "cabin_type", label: "Cabin Type" },
    { key: "segment", label: "Segment" },
    { key: "gateway", label: "Gateway" },
    { key: "company_billing", label: "Company Billing" },
    { key: "productivity", label: "Productive" },
    { key: "amount", label: "Amount" },
    { key: "car_company", label: "Car Company" },
    { key: "car_usage", label: "Car Usage" },
    { key: "car_type", label: "Car Type" },
    { key: "notes", label: "Notes" },
  ];

  const agentDefaultColumns = [
    "from_name",
    "from_number",
    "start_time",
    "call_log_status",
    "queue_name",
    "duration_ms",
    "converted",
    "mco",
  ];

  
const [userData, setUserData] = useState(null); // ✅ NEW

useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await fetch(`${BASE_URL}get_user.php`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.status === "success") {
        setUserRole(json.user.role);
        setUserData(json.user); // ✅ store full user object
        console.log("Fetched user data:", json.user);
        setVisibleColumns(
          json.user.role === "user"
            ? agentDefaultColumns
            : allColumns.map((c) => c.key)
        );
      } else {
        setUserRole("agent");
        setVisibleColumns(agentDefaultColumns);
      }
    } catch {
      setUserRole("agent");
      setVisibleColumns(agentDefaultColumns);
    }
  };
  fetchUser();
}, []);


  // Fetch calls with NY timezone dates
  useEffect(() => {
    const fetchCalls = async () => {
      if (!userRole) return;
      setIsLoading(true);
      try {
        console.log("TemplateCalls - Fetching with dates:", dateRange);
        


// Add 4 hours to an ISO string assumed to be UTC
const addHoursUTC = (isoString, hours) => {
  if (!isoString) return "";
  // Append "Z" to treat it as UTC
  const date = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
  date.setUTCHours(date.getUTCHours() + hours); // add hours in UTC
  return date.toISOString(); // returns correct UTC ISO string
};

const startDateAdjusted = addHoursUTC(dateRange.startDate, 5);
const endDateAdjusted = addHoursUTC(dateRange.endDate, 5);
console.log("Start date",dateRange.startDate,startDateAdjusted);
console.log("End date",dateRange.endDate,endDateAdjusted);
const res = await fetch(
  `${BASE_URL}get_calls.php?startDate=${encodeURIComponent(startDateAdjusted)}&endDate=${encodeURIComponent(endDateAdjusted)}`,
  { credentials: "include" }
);

        const json = await res.json();

        // Filter calls with non-empty queue_name
        const filtered = (json.calls || []).filter(
          (call) => call.queue_name && call.queue_name.trim() !== ""
        );

        setCalls(filtered);
      } catch (error) {
        console.error("Error fetching calls:", error);
        setCalls([]);
      } finally {
        setIsLoading(false);
        setCurrentPage(1);
      }
    };

    fetchCalls();
  }, [dateRange, userRole]);

  const handleClearRow = async (call) => {
  if (!window.confirm("Are you sure you want to clear this call’s data?")) return;

  // 1️⃣ Build cleared object
  const clearedCall = {
    ...call,
    callId: call.session_id,
    notes: "",
    reason: "",
    converted: "",
    mco: "",
    amount: "",
    type: "",
    segment: "",
    flight_usage: "",
    cabin_type: "",
    car_company: "",
    car_usage: "",
    car_type: "",
    company_billing: "",
    gateway: "",
    airline: "",
    customer_type: "",
    productivity: "",
    booking_number: "",
  };
  console.log("Cleared call data:", clearedCall);

  // 3️⃣ Persist to backend
  try {
    const res = await fetch(`${BASE_URL}save_call.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(clearedCall),
    });

    const result = await res.json();

    if (result.success) {
      console.log(`✅ Call ${call.id} cleared successfully`);
      alert("Call data cleared successfully.");

      // 4️⃣ Update local state
      setCalls((prevCalls) =>
        prevCalls.map((c) => (c.id === call.id ? { ...c, ...clearedCall } : c))
      );
    } else {
      console.warn("⚠️ Failed to clear:", result.error);
      alert("Failed to clear the data. Please try again.");
    }
  } catch (err) {
    console.error("❌ Error clearing call:", err);
    alert("Network error while clearing the call.");
  }
};


  const handleRowClick = (call) => {
    setSelectedCall(call);

    setFormData({
      ...call,
      callId: call.session_id,
      language: call.language,
      flightUsage: call.flight_usage,
      cabinType: call.cabin_type,
      carCompany: call.car_company,
      carUsage: call.car_usage,
      carType: call.car_type,
      authType: call.auth_type,
      reason: call.reason,
      customer_type: call.customer_type,
      converted: call.converted,
      mco: call.mco,
      type: call.type,
      segment: call.segment,
      gateway: call.gateway,
      company_billing: call.company_billing,
    });
  };

  const handleExport = () => {
  const exportData = calls.map((call) => {
    const row = {};
    allColumns
      .filter((c) => visibleColumns.includes(c.key))
      .forEach((col) => {
        if (col.key === "duration_ms") {
  if (call.duration_ms && call.duration_ms > 0) {
    const totalSeconds = Math.floor(call.duration_ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, "0");

    // Format as HH:MM:SS (always two digits)
    row[col.label] = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    row[col.label] = "00:00:00";
  }
}
 else {
          row[col.label] = call[col.key] || "-";
        }
      });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Calls");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });
  saveAs(data, `calls_${new Date().toISOString()}.xlsx`);
};


  const handleSave = async () => {
    try {
      const res = await fetch(`${BASE_URL}save_call.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        alert("Call saved successfully!");
        setCalls((prev) =>
          prev.map((c) => (c.id === formData.id ? { ...c, ...formData } : c))
        );
        setSelectedCall(null);
      } else {
        alert("Save failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Save failed due to network error");
    }
  };

  const fetchExtensions = async () => {
    try {
      const res = await fetch("/extensions.json");
      const data = await res.json();
      setExtensions(data);
    } catch (err) {
      console.error("Error fetching extensions", err);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, []);

  const filteredCalls = calls.filter((call) =>
    allColumns
      .filter((c) => visibleColumns.includes(c.key))
      .every((col) => {
        const filter = columnFilters[col.key];
        if (!filter) return true;

        if (filter.type === "text") {
          return (call[col.key] || "")
            .toString()
            .toLowerCase()
            .includes(filter.value?.toLowerCase() || "");
        }
        if (filter.type === "multi") {
          if (!filter.values || filter.values.length === 0) return true;
          return filter.values.includes(call[col.key]);
        }
        if (filter.type === "range") {
          const val = parseFloat(call[col.key]);
          if (filter.gte && val < parseFloat(filter.gte)) return false;
          if (filter.lte && val > parseFloat(filter.lte)) return false;
          return true;
        }

        return true;
      })
  );

  const totalPages = Math.ceil(filteredCalls.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const currentCalls = filteredCalls.slice(
    startIndex,
    startIndex + resultsPerPage
  );

  // helpers (place above your component)
const parseYMDHMSAsUTC = (s) => {
  // "YYYY-MM-DD HH:mm:ss"
  if (!s) return null;
  const [datePart, timePart] = s.split(" ");
  if (!timePart) return null;
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm, ss] = timePart.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss)); // interpreted as UTC
};

const formatDateInTimeZone = (date, timeZone = "Asia/Kolkata") => {
  if (!date) return "-";
  // Use formatToParts to build YYYY-MM-DD HH:mm:ss in the requested timezone
  const opts = {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat("en-GB", opts).formatToParts(date);
  const map = {};
  parts.forEach((p) => (map[p.type] = p.value));
  // map.month, map.day etc. are already zero-padded by "2-digit"
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`;
};

  if (!userRole)
    return <div className="p-4 text-gray-300">Loading user info...</div>;
  if (isLoading)
    return <div className="p-4 text-gray-300">Loading calls...</div>;

  return (
    <div className="p-4 text-gray-200">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 justify-end mb-4">
        <div className="relative">
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-gradient-to-b from-indigo-500/90 to-blue-500/70 rounded hover:bg-[#374151] border border-white text-md"
          >
            Export to Excel
          </button>
        </div>

        <FilterButton
          dateRange={dateRange}
          onApply={(newRange) => {
            // console.log("TemplateCalls - Date range updated:", newRange);
            setDateRange({
              startDate: newRange.startDate,
              endDate: newRange.endDate,
            });
          }}
        />

        {(userRole === "admin" || userRole === "lead") && (
          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="px-3 py-2 bg-gradient-to-b from-indigo-500/90 to-blue-500/70 rounded hover:bg-[#374151] border border-white text-md"
            >
              Customize Columns
            </button>

            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 bg-[#1e293b] border border-gray-700 rounded shadow-lg p-3 z-50 w-56 max-h-80 overflow-y-auto text-sm">
                {allColumns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 mb-1 text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.key)}
                      onChange={() =>
                        setVisibleColumns((prev) =>
                          prev.includes(col.key)
                            ? prev.filter((k) => k !== col.key)
                            : [...prev, col.key]
                        )
                      }
                    />
                    {col.label}
                  </label>
                ))}
          </div>
            )}
          </div>
        )}
        <div className="flex justify-end mb-4 bg-gradient-to-b from-indigo-500/90 to-blue-500/70 items-center gap-2 border border-white rounded">
          <label htmlFor="rowsPerPage" className="px-3 py-2 text-md">
            Rows per page:
          </label>
          <select
            id="rowsPerPage"
            value={resultsPerPage}
            onChange={(e) => {
              setResultsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#1e293b] border border-gray-700 text-gray-300 rounded px-2 py-1"
          >
            {[10, 20, 30, 40, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        {(userRole === "admin" || userRole === "lead" || userRole === "VJ") && (
          <CallSummaryTable dateRange={dateRange} />
        )}
      </div>

        {/* Adding a call */}
        <div className="flex justify-between items-center mb-3">
  <h1 className="text-lg font-bold md:text-xl">&nbsp;</h1>

  <button
    onClick={() => setShowAddModal(true)}
    className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 shadow-md text-white rounded-md flex items-center gap-2"
  >
    + Add Call
  </button>
</div>

    
      <div className="bg-[#0f172a] rounded-lg shadow border border-gray-700 overflow-x-auto">
        <h1 className="p-3 font-bold text-lg md:text-xl">
          Call Logs (New York Time)
        </h1>
        <table className="w-full min-w-max text-left border-collapse text-xs md:text-sm text-gray-300">
          <thead>
            <tr className="bg-[#1e293b] text-gray-300 uppercase text-[10px] md:text-xs tracking-wide">
              {allColumns
                .filter((c) => visibleColumns.includes(c.key))
                .map((col) => {
                  const filterType = [
                    "queue_name",
                    "agent_name",
                    "call_log_status",
                    "airline",
                    "direction",
                    "customer_type",
                    "reason",
                    "converted",
                    "type",
                  ].includes(col.key)
                    ? "multi"
                    : (col.key === "duration_ms")
                    ? "duration"
                    : "text"; 

                  return (
                    <th key={col.key} className="p-1 md:p-2 md:text-md">
                      {col.label}
                      { col.key !== "mco" &&
                        col.key !== "amount" &&
                        filterType !== "numeric" && (
                          <FilterPopup
                            columnKey={col.key}
                            columnLabel={col.label}
                            data={calls}
                            filterType={filterType}
                            value={columnFilters[col.key]}
                            onChange={(val) =>
                              setColumnFilters((prev) => ({ ...prev, [col.key]: val }))
                            }
                          />
                        )}
                    </th>
                  );
                })}
            </tr>
          </thead>
        
          <tbody>
            {currentCalls.map((call, i) => (
              <tr
                key={i}
                onClick={() => handleRowClick(call)}
                className="border-b border-gray-700 hover:bg-[#1f2937] cursor-pointer"
              >
               {allColumns
  .filter((c) => visibleColumns.includes(c.key))
  .map((col) => (
    <td key={col.key} className="p-2 md:p-3 whitespace-nowrap">
      {col.key === "duration_ms"
        ? call.duration_ms
          ? (() => {
             const totalSeconds = Math.floor(call.duration_ms / 1000);
const hours = Math.floor(totalSeconds / 3600);
const minutes = Math.floor((totalSeconds % 3600) / 60);
const seconds = totalSeconds % 60;

// Pad each unit to always have two digits
const pad = (num) => String(num).padStart(2, "0");

return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

            })()
          : "00:00:00"
        : col.key === "start_time"
        ? (() => {
            if (!call.start_time) return "-";

            // 1️⃣ Split manually into parts to avoid local timezone interpretation
            const [datePart, timePart] = call.start_time.split(" ");
            const [year, month, day] = datePart.split("-").map(Number);
            const [hour, minute, second] = timePart.split(":").map(Number);

            // 2️⃣ Create a UTC timestamp
            const utcMillis = Date.UTC(year, month - 1, day, hour, minute, second);

            // 3️⃣ Subtract 4 hours (4 * 60 * 60 * 1000 ms)
            const shiftedMillis = utcMillis - 5 * 60 * 60 * 1000;

            // 4️⃣ Build a new date from shifted milliseconds
            const shiftedDate = new Date(shiftedMillis);

            // 5️⃣ Format as YYYY-MM-DD HH:mm:ss (UTC)
            const yyyy = shiftedDate.getUTCFullYear();
            const mm = String(shiftedDate.getUTCMonth() + 1).padStart(2, "0");
            const dd = String(shiftedDate.getUTCDate()).padStart(2, "0");
            const hh = String(shiftedDate.getUTCHours()).padStart(2, "0");
            const min = String(shiftedDate.getUTCMinutes()).padStart(2, "0");
            const ss = String(shiftedDate.getUTCSeconds()).padStart(2, "0");

            return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
          })()
        : col.key === "mco"
        ? call.mco
          ? `$ ${call.mco}`
          : "-"
        : call[col.key] || "-"}
    </td>
  ))}

      {/* 🧹 Clear button column */}
    <td className="p-2 text-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClearRow(call);
        }}
        title="Clear this call’s data"
        className="text-red-500 hover:text-red-700 transition"
      >
        <Trash2 size={16} />
      </button>
    </td>


              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-gray-300 text-sm">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${
              currentPage === 1
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-[#1e293b] hover:bg-[#374151]"
            }`}
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded ${
              currentPage === totalPages
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-[#1e293b] hover:bg-[#374151]"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {showAddModal && (
  <AddCallModal
    onClose={() => setShowAddModal(false)}
    onAdded={(newCall) => setCalls((prev) => [...prev, newCall])}
    userRole={userRole}
    extensions={extensions}
    userData={userData} // optional: name, id, extension
  />
)}



      {selectedCall && (
        <CallDetailsModal
          call={selectedCall}
          formData={formData}
          onInputChange={(f, v) => setFormData((p) => ({ ...p, [f]: v }))}
          onSave={handleSave}
          onClose={() => setSelectedCall(null)}
          userRole={userRole}
          extensions={extensions}
        />
      )}
    </div>
  );
};

export default TempCallsTable;