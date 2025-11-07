import React, { useEffect, useState, useMemo } from "react";
import { BASE_URL } from "../../config";
import { ChevronDown, ChevronUp, CalendarDays } from "lucide-react";

const MarketingCost = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [costs, setCosts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [queueNames, setQueueNames] = useState([]);
  const [selectedQueues, setSelectedQueues] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // ✅ Set default date (US/New York)
  useEffect(() => {
  const getDateInTimeZone = (timeZone) => {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    // parts approach avoids string parsing issues
    const parts = dtf.formatToParts(new Date());
    const map = {};
    for (const p of parts) map[p.type] = p.value;
    // map: { month: "09", day: "03", year: "2025", ... }
    return `${map.year}-${map.month}-${map.day}`; // ISO yyyy-mm-dd
  };

  const usIsoDate = getDateInTimeZone('America/New_York'); // choose US timezone you want
  setSelectedDate(usIsoDate);
  fetchCosts(usIsoDate);
}, []);


  // ✅ Fetch queues once
  // Go with useEffect to fetch call queues on component mount
  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const res = await fetch(`${BASE_URL}get_call_queues.php`);
        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.queues)) {
          setQueueNames(data.queues);
        } else {
          setQueueNames([]);
        }
      } catch (err) {
        console.error("Error fetching call queues:", err);
        setQueueNames([]);
      }
    };
    fetchQueues();
  }, []);

  // ✅ Fetch costs
  const fetchCosts = async (date) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}get_marketing_costs.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      if (data.success && data.costs) {
        const costMap = {};
        data.costs.forEach((item) => {
          costMap[item.queue_name] = item.amount;
        });
        setCosts(costMap);
      } else {
        setCosts({});
      }
    } catch (err) {
      console.error("Error fetching costs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQueues = async () => {
  try {
    const response = await fetch("https://gettrip4me.com/test-api/update_queues.php", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.text();
    alert(result || "✅ Queues updated successfully!");
  } catch (error) {
    console.log(error.message);
    alert("❌ Error updating queues: " + error.message);
  }
};

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) fetchCosts(date);
  };

  const handleAmountChange = (queue, value) => {
    setCosts((prev) => ({ ...prev, [queue]: value }));
  };

  const handleSave = async () => {
    if (!selectedDate) {
      alert("Please select a date first.");
      return;
    }

    const payload = {
      date: selectedDate,
      costs: queueNames.map((queue) => ({
        queue_name: queue,
        amount: costs[queue] || 0,
      })),
    };

    try {
      const res = await fetch(`${BASE_URL}save_marketing_cost.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) alert("Marketing cost saved successfully!");
      else alert("Error saving data: " + (data.error || "Unknown error"));
    } catch (err) {
      console.error("Save failed:", err);
      alert("Save failed. Check console for details.");
    }
  };

  const toggleQueue = (queue) => {
    setSelectedQueues((prev) =>
      prev.includes(queue)
        ? prev.filter((q) => q !== queue)
        : [...prev, queue]
    );
  };

  const clearFilter = () => {
    setSelectedQueues([]);
    setSearch("");
  };

  const filteredQueues = selectedQueues.length
    ? queueNames.filter((q) => selectedQueues.includes(q))
    : queueNames;

  const filteredDropdownQueues = queueNames.filter((q) =>
    q.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Compute total and average
  const { totalCost, avgCost } = useMemo(() => {
    const amounts = Object.values(costs).map((val) => parseFloat(val) || 0);
    const total = amounts.reduce((sum, val) => sum + val, 0);
    const avg = amounts.length ? total / amounts.length : 0;
    return { totalCost: total, avgCost: avg };
  }, [costs]);

  return (
    <div className="p-6 bg-[#1d2738] w-full min-h-screen text-gray-200">
      <div className="flex items-center justify-between mb-6">
      <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
        Marketing Cost Management
      </h1>
      <button className="p-2 rounded-lg font-bold bg-green-700 hover:bg-green-600" onClick={handleUpdateQueues}>Update Queues</button>
</div>
      {/* ✅ Summary Block */}
      <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 p-[1px] rounded-2xl mb-6 shadow-lg">
        <div className="bg-[#0f172a] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Total Marketing Cost</h2>
            <p className="text-3xl font-extrabold text-cyan-400 mt-1">
              ${totalCost.toLocaleString()}
            </p>
           
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <CalendarDays size={40} className="text-cyan-400" />
            <div>
              <p className="text-sm text-gray-400">Selected Date</p>
              <p className="text-base font-medium text-white">
                {selectedDate ? selectedDate : "Not selected"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Filters Section */}
      <div className="bg-[#0f172a] p-4 rounded-lg border border-gray-700 mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <label className="block mb-2 text-sm">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="p-2 rounded bg-[#1e293b] text-gray-200 border border-gray-600 focus:border-cyan-500 focus:ring focus:ring-cyan-500/20"
          />
        </div>

        {/* Queue Filter */}
        <div className="relative w-full sm:w-1/2">
          <button
            onClick={() => setFilterOpen((p) => !p)}
            className="w-full flex justify-between items-center px-3 py-2 bg-[#1e293b] border border-gray-600 rounded text-sm text-gray-300 hover:border-cyan-500 transition"
          >
            {selectedQueues.length > 0
              ? `${selectedQueues.length} Queues Selected`
              : "Filter Queues"}
            {filterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {filterOpen && (
            <div className="absolute z-10 w-full mt-2 bg-[#0f172a] border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search queues..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-2 mb-2 rounded bg-[#1e293b] text-gray-200 border border-gray-600 text-sm"
                />
                {filteredDropdownQueues.length === 0 ? (
                  <p className="text-gray-400 text-center py-2 text-sm">
                    No queues found
                  </p>
                ) : (
                  filteredDropdownQueues.map((queue, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-2 px-2 py-1 hover:bg-[#1e293b] rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedQueues.includes(queue)}
                        onChange={() => toggleQueue(queue)}
                        className="accent-[#2563eb]"
                      />
                      <span className="text-sm">{queue}</span>
                    </label>
                  ))
                )}
              </div>
              {selectedQueues.length > 0 && (
                <button
                  onClick={clearFilter}
                  className="w-full py-2 text-sm text-[#f87171] hover:bg-[#1e293b]"
                >
                  Clear Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ Table */}
      {filteredQueues.length > 0 && (
        <div className="bg-[#0f172a] rounded-lg border border-gray-700 overflow-hidden">
          <div className="max-h-[65vh] overflow-y-auto px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
              {filteredQueues.map((queue, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[#1e293b] border border-gray-700 p-3 rounded-lg hover:bg-[#243045] transition"
                >
                  <span className="text-sm font-medium text-gray-100 truncate">
                    {queue}
                  </span>
                  <input
                    type="number"
                    value={costs[queue] || ""}
                    onChange={(e) => handleAmountChange(queue, e.target.value)}
                    className="w-28 p-1 bg-[#0f172a] border border-gray-600 rounded text-gray-200 text-right text-sm"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Save Bar */}
          <div className="p-4 border-t border-gray-700 bg-[#1e293b] sticky bottom-0 flex justify-end">
            <button
              onClick={handleSave}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2 rounded-lg font-semibold transition"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-gray-400 mt-4">Fetching data for selected date...</div>
      )}
    </div>
  );
};

export default MarketingCost;
