import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../config";

const MarketingCost = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [queueNames, setQueueNames] = useState([]);
  const [costMatrix, setCostMatrix] = useState({});
  const [selectedQueue, setSelectedQueue] = useState([]);
  const [changedRows, setChangedRows] = useState([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get days in selected month
  useEffect(() => {
    setDaysInMonth(new Date(year, month, 0).getDate());
  }, [month, year]);

  // Fetch queues
  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const res = await fetch(`${BASE_URL}get_call_queues.php`);
        const data = await res.json();
        if (data.status === "success") {
          setQueueNames(data.queues);
        }
      } catch (err) {
        console.error("Queue fetch error:", err);
      }
    };
    fetchQueues();
  }, []);

  // Fetch monthly marketing costs
  const fetchMonthlyCosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}get_monthly_costs.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });

      const data = await res.json();

      let updated = {};
      queueNames.forEach((queue) => {
        updated[queue] = {};
        for (let day = 1; day <= daysInMonth; day++) {
          updated[queue][day] = "";
        }
      });

      if (data.success) {
        data.costs.forEach((row) => {
          updated[row.queue_name][row.day] = row.amount;
        });
      }

      setCostMatrix(updated);
      setChangedRows([]);
    } catch (err) {
      console.error("Month fetch failed:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (queueNames.length > 0) fetchMonthlyCosts();
  }, [month, year, queueNames]);

  // Track changed cells only
  const handleCostChange = (queue, day, value) => {
    value = value === "" ? "" : Number(value);

    setCostMatrix((prev) => ({
      ...prev,
      [queue]: { ...prev[queue], [day]: value },
    }));

    setChangedRows((prev) => {
      const updatedEntry = { queue_name: queue, day, month, year, amount: value };

      const exists = prev.find((r) => r.queue_name === queue && r.day === day);
      if (exists) {
        return prev.map((r) => (r.queue_name === queue && r.day === day ? updatedEntry : r));
      }
      return [...prev, updatedEntry];
    });
  };

  // Daily totals
  const dayTotals = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return (selectedQueue.length ? selectedQueue : queueNames).reduce((sum, queue) => {
      const value = parseFloat(costMatrix?.[queue]?.[day] || 0);
      return sum + value;
    }, 0);
  });

  // Grand Total of selected queues
  const grandTotal = (selectedQueue.length ? selectedQueue : queueNames).reduce(
    (queueSum, queue) => {
      const days = costMatrix?.[queue] || {};
      const sumPerQueue = Object.values(days).reduce(
        (daySum, val) => daySum + (parseFloat(val) || 0),
        0
      );
      return queueSum + sumPerQueue;
    },
    0
  );

  // Save changed rows
  const handleSave = async () => {
    if (changedRows.length === 0) {
      alert("Nothing to save.");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}save_monthly_cost_matrix.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: changedRows }),
      });

      const result = await res.json();

      if (result.success) {
        alert("Saved successfully!");
        setChangedRows([]);
      } else {
        alert("Save error: " + result.error);
      }
    } catch (err) {
      alert("Save failed.");
      console.error(err);
    }
  };

  // Update Queues Button
  const handleUpdateQueues = async () => {
    try {
      const res = await fetch("https://gettrip4me.com/test-api/update_queues.php");
      const result = await res.text();
      alert(result || "Queues updated successfully!");
    } catch (err) {
      alert("Error updating queues: " + err.message);
    }
  };

  return (
    <div className="p-6 bg-[#1d2738] min-h-screen text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">Marketing Cost Management</h1>

      <div className="mb-6 p-4 bg-[#0f172a] border border-gray-700 rounded-lg text-lg font-bold text-cyan-400">
        Total Marketing Cost for {new Date(year, month - 1).toLocaleString("en", { month: "long" })}{" "}
        {year}:  
        <span className="text-white ml-2">${grandTotal.toLocaleString()}</span>
      </div>

      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-6">

        {/* Month */}
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="p-2 rounded bg-[#0f172a] border border-gray-600"
        >
          {[...Array(12)].map((_, i) => (
            <option value={i + 1} key={i + 1}>
              {new Date(0, i).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>

        {/* Year */}
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="p-2 rounded bg-[#0f172a] border border-gray-600"
        >
          {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        {/* Update Queues */}
        <button
          onClick={handleUpdateQueues}
          className="p-2 rounded bg-green-700 hover:bg-green-600 text-white font-semibold"
        >
          Update Queues
        </button>

        {/* Multi Select */}
        <div className="relative ml-auto w-56">
          <button
            onClick={() => setIsQueueOpen((prev) => !prev)}
            className="w-full bg-[#0f172a] border border-gray-600 text-left px-3 py-2 rounded-lg"
          >
            {selectedQueue.length === 0
              ? "Select Queues"
              : `${selectedQueue.length} Selected`}
          </button>

          {isQueueOpen && (
            <div className="absolute mt-2 w-full bg-[#0f172a] border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
              {queueNames.map((q) => {
                const checked = selectedQueue.includes(q);
                return (
                  <div
                    key={q}
                    className="px-3 py-2 flex items-center gap-2 hover:bg-[#1e293b] cursor-pointer"
                    onClick={() =>
                      setSelectedQueue((prev) =>
                        prev.includes(q)
                          ? prev.filter((item) => item !== q)
                          : [...prev, q]
                      )
                    }
                  >
                    <input type="checkbox" checked={checked} readOnly className="accent-cyan-500" />
                    <span>{q}</span>
                  </div>
                );
              })}

              {selectedQueue.length > 0 && (
                <button
                  className="w-full py-2 text-red-400 hover:bg-[#1e293b] text-sm"
                  onClick={() => setSelectedQueue([])}
                >
                  Clear Selection
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-auto border border-gray-700 rounded-lg">
        <table className="min-w-max w-full text-sm">
          <thead className="sticky top-0 bg-[#0f172a] z-40">
            <tr>
              {/* LEFT FIXED COLUMN */}
              <th className="p-3 border border-gray-600 text-left sticky left-0 bg-[#0f172a] z-30">
                Queue
              </th>

              {[...Array(daysInMonth)].map((_, i) => (
                <th key={i} className="p-2 border border-gray-700 text-center">
                  {i + 1}
                </th>
              ))}

              {/* RIGHT FIXED COLUMN TITLE */}
              <th className="p-3 border border-gray-700 sticky right-0 bg-[#0f172a] z-30 text-center">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {(selectedQueue.length ? selectedQueue : queueNames).sort().map((queue) => {
              const rowTotal = Object.values(costMatrix?.[queue] || {}).reduce(
                (sum, v) => sum + (parseFloat(v) || 0),
                0
              );

              return (
                <tr key={queue} className="hover:bg-[#1e293b]">
                  {/* LEFT FIXED NAME CELL */}
                  <td className="p-3 border border-gray-700 sticky left-0 bg-[#1d2738] z-20 font-medium">
                    {queue}
                  </td>

                  {/* DAY INPUT CELLS */}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1;
                    return (
                      <td key={day} className="border border-gray-700 p-1">
                        <input
                          type="number"
                          className="w-20 p-1 text-center bg-[#0f172a] border border-gray-600 rounded text-gray-200"
                          value={costMatrix?.[queue]?.[day] || ""}
                          onChange={(e) =>
                            handleCostChange(queue, day, e.target.value)
                          }
                        />
                      </td>
                    );
                  })}

                  {/* RIGHT FIXED TOTAL CELL */}
                  <td className="p-3 border border-gray-700 sticky right-0 bg-[#1d2738] z-30 font-semibold text-cyan-300">
                    ${rowTotal.toLocaleString()}
                  </td>
                </tr>
              );
            })}

            {/* BOTTOM TOTAL ROW */}
            <tr className="bg-[#0f172a] font-bold text-cyan-400 sticky bottom-0 z-40">
              <td className="p-3 border border-gray-700 sticky left-0 bg-[#0f172a] z-40">
                TOTAL
              </td>

              {dayTotals.map((total, i) => (
                <td key={i} className="border border-gray-700 p-2 text-center">
                  ${total.toLocaleString()}
                </td>
              ))}

              {/* BOTTOM RIGHT GRAND TOTAL */}
              <td className="p-3 border border-gray-700 sticky right-0 bg-[#0f172a] z-40 text-green-400">
                ${grandTotal.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold"
        >
          Save All
        </button>
      </div>

      {isLoading && <p className="mt-4 text-gray-400">Loading data...</p>}
    </div>
  );
};

export default MarketingCost;
