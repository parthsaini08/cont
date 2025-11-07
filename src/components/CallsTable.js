import React, { useState, useEffect } from "react";
import CallDetailsModal from "./CallDetailsModal";
import { BASE_URL } from "../config";
const CallsTable = ({ filter = "week" }) => {
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState(null);
  const [formData, setFormData] = useState({
    productivity: "",
    type: "",
    converted: "",
    mco: "",
    bookingNumber: "",
    gateway: "",
    customerApproval: "",
    companyBilling: "",
    card: "",
    amount: "",
  });

  const resultsPerPage = 20;

  // Fetch calls from API
  const fetchCalls = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}api_calls.php?filter=${filter}`
      );
      const json = await res.json();
      setCalls(json.calls);
    } catch (err) {
      console.error("Error fetching calls:", err);
      setCalls([]);
    } finally {
      setIsLoading(false);
      setCurrentPage(1); // reset page on new fetch
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  // Pagination
  const totalPages = Math.ceil(calls.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const currentCalls = calls.slice(startIndex, startIndex + resultsPerPage);

  const productiveOptions = [
    "New booking",
    "Changes",
    "Cancellation",
    "Upgrade",
    "Ancillary services",
    "Sched change",
    "Pet addition",
  ];
  const nonProductiveOptions = ["Spam", "Wrong Number", "Inquiry Only", "Other"];

  const handleRowClick = (call) => {
    setSelectedCall(call);
    setFormData({
      productivity: "",
      type: "",
      converted: "",
      mco: "",
      bookingNumber: "",
      gateway: "",
      customerApproval: "",
      companyBilling: "",
      card: "",
      amount: "",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
  const payload = {
    callId: selectedCall?.session_id,
    ...formData,
  };
  console.log(payload);

  try {
    const res = await fetch(`${BASE_URL}save_call.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Save response:", data);

    if (data.success) {
      alert("Call saved successfully!");
      fetchCalls(); // refresh table after save
    } else {
      alert("Error saving: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Save failed:", err);
    alert("Save failed. Check console for details.");
  }

  setSelectedCall(null);
};


  if (isLoading)
    return <div className="ml-64 p-6 text-gray-300">Loading calls...</div>;
  if (calls.length === 0)
    return <div className="ml-64 p-6 text-gray-500">No calls found.</div>;

  return (
    <div className="ml-64 p-6 text-gray-200">
      <h1 className="p-3 font-bold text-xl">Call Logs</h1>
      <div className="bg-[#0f172a] rounded-lg shadow border border-gray-700 overflow-hidden">
        <table className="w-full text-left border-collapse text-sm text-gray-300">
          <thead>
            <tr className="bg-[#1e293b] text-gray-300 uppercase text-xs tracking-wide">
              <th className="p-3">Time</th>
              <th className="p-3">Direction</th>
              <th className="p-3">From</th>
              <th className="p-3">From Name</th>
              <th className="p-3">To</th>
              <th className="p-3">To Name</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentCalls.map((call, i) => (
              <tr
                key={i}
                onClick={() => handleRowClick(call)}
                className="border-b border-gray-700 hover:bg-[#1f2937] transition-colors cursor-pointer"
              >
                <td className="p-3">
                  {call.start_time
                    ? new Date(call.start_time).toLocaleString()
                    : "-"}
                </td>
                <td className="p-3">{call.direction || "-"}</td>
                <td className="p-3">{call.from_number || "-"}</td>
                <td className="p-3">
                  {call.direction === "Outbound"
                    ? "Outbound"
                    : call.from_name || "-"}
                </td>
                <td className="p-3">{call.to_number || "-"}</td>
                <td className="p-3">{call.agent_name || "-"}</td>
                <td className="p-3">
                  {(() => {
                    const durationSec = call.duration_ms  ;
                    const minutes = Math.floor(durationSec / 60);
                    const seconds = Math.floor(durationSec % 60);
                    return `${minutes}m ${seconds}s`;
                  })()}
                </td>
                <td className="p-3">{call.call_status || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-gray-300">
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
          <span className="text-sm">
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

      {/* Modal */}
      <CallDetailsModal
  call={selectedCall}
  formData={formData}
  onInputChange={handleInputChange}
  onSave={handleSave}
  onClose={() => setSelectedCall(null)}
/>
    </div>
  );
};

export default CallsTable;
