import React, { useEffect, useState } from "react";
import CallsTable from "./CallsTable";
import TempCallsTable from "./TemplateCalls";
import FilterButton from "./FilterButton";
import { BASE_URL } from "../config";
const CallsPage = () => {
  const getNYTime = (offsetDays = 0) => {
  const nyTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  nyTime.setDate(nyTime.getDate() + offsetDays);
  return nyTime;
};

const [dateRange, setDateRange] = useState({
  startDate: getNYTime(-1), // 24 hours ago in NY time
  endDate: getNYTime(),     // now in NY time
});

  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
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

  useEffect(() => {
    fetch(`${BASE_URL}get_calls.php`, {
      credentials: "include"  // ✅ important for sessions
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setCalls(data.calls);
        } else {
          alert(data.message);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching calls:", err);
        setIsLoading(false);
      });
  }, []);

  // Fetch calls from API
  const fetchCalls = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}get_calls.php`
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
  // if (calls.length === 0)
  //   return <div className="ml-64 p-6 text-gray-500">No calls found.</div>;

  return (
    <div className="p-6">
      {
  calls.length === 0 ? (
    <div className="flex gap-2 justify-end mb-4">
      <FilterButton
        dateRange={dateRange}
        onApply={(newRange) =>
          setDateRange({
            startDate: newRange.startDate,
            endDate: newRange.endDate,
          })
        }
      />
      <div className="relative">
        <button
          onClick={() => setShowColumnDropdown(!showColumnDropdown)}
          className="px-3 py-2 bg-[#1e293b] rounded hover:bg-[#374151] border border-white"
        >
          Customize Columns
        </button>
      </div>
    </div>
  ) : (
    <TempCallsTable calls={calls} />
  )
}

       
      {/* <h2 className="text-xl font-bold mb-4">📞 Call Logs</h2>
      {calls.length === 0 ? (
        <p>No calls found</p>
      ) : (
        <table className="min-w-full border border-gray-700">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-2 border">Session ID</th>
              <th className="p-2 border">Agent</th>
              <th className="p-2 border">Direction</th>
              <th className="p-2 border">Start</th>
              <th className="p-2 border">Duration</th>
              <th className="p-2 border">Agent Name</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr key={call.id} className="text-black">
                <td className="p-2 border">{call.session_id}</td>
                <td className="p-2 border">{call.agent_extension}</td>
                <td className="p-2 border">{call.direction}</td>
                <td className="p-2 border">{call.start_time}</td>
                <td className="p-2 border">{call.duration} sec</td>
                <td className="p-2 border">{call.agent_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )} */}
    </div>
  );
};

export default CallsPage;
