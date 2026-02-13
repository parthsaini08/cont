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

  // ADD QUEUE STATES
  const [isAddingQueue, setIsAddingQueue] = useState(false);
  const [newQueue, setNewQueue] = useState("");

  // Days in month
  useEffect(() => {
    setDaysInMonth(new Date(year, month, 0).getDate());
  }, [month, year]);

  // Fetch queues
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

  useEffect(() => {
    fetchQueues();
  }, []);

  // Fetch monthly costs
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
        for (let d = 1; d <= daysInMonth; d++) {
          updated[queue][d] = "";
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
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (queueNames.length > 0) fetchMonthlyCosts();
  }, [month, year, queueNames]);

  // Handle cost change
  const handleCostChange = (queue, day, value) => {
    value = value === "" ? "" : Number(value);

    setCostMatrix((prev) => ({
      ...prev,
      [queue]: { ...prev[queue], [day]: value },
    }));

    setChangedRows((prev) => {
      const row = { queue_name: queue, day, month, year, amount: value };
      const exists = prev.find((r) => r.queue_name === queue && r.day === day);
      return exists
        ? prev.map((r) => (r.queue_name === queue && r.day === day ? row : r))
        : [...prev, row];
    });
  };

  // Add Queue
  const handleAddQueue = async () => {
    if (!newQueue.trim()) {
      alert("Queue name required");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}add_call_queue.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue_name: newQueue.trim() }),
      });
      console.log(JSON.stringify({ queue_name: newQueue.trim() }));
      const result = await res.json();
      console.log("Add Queue Result:", result);
      if (result.success) {
        setQueueNames((prev) => [...prev, newQueue.trim()]);
        setNewQueue("");
        setIsAddingQueue(false);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Failed to add queue");
    }
  };

  // Totals
  const activeQueues = selectedQueue.length ? selectedQueue : queueNames;

  const dayTotals = Array.from({ length: daysInMonth }, (_, i) =>
    activeQueues.reduce(
      (sum, q) => sum + (parseFloat(costMatrix?.[q]?.[i + 1]) || 0),
      0
    )
  );

  const grandTotal = activeQueues.reduce((sum, q) => {
    return (
      sum +
      Object.values(costMatrix?.[q] || {}).reduce(
        (s, v) => s + (parseFloat(v) || 0),
        0
      )
    );
  }, 0);

  // Save
  const handleSave = async () => {
    if (!changedRows.length) return alert("Nothing to save");

    const res = await fetch(`${BASE_URL}save_monthly_cost_matrix.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: changedRows }),
    });

    const result = await res.json();
    if (result.success) {
      alert("Saved successfully");
      setChangedRows([]);
    } else {
      alert("Save failed");
    }
  };

  return (
    <div className="p-6 bg-[#1d2738] min-h-screen text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">
        Marketing Cost Management
      </h1>

      {/* TOP BAR */}
      <div className="flex gap-4 mb-6 items-center">
        <select
          value={month}
          onChange={(e) => setMonth(+e.target.value)}
          className="p-2 bg-[#0f172a] border border-gray-600 rounded"
        >
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i + 1}>
              {new Date(0, i).toLocaleString("en", { month: "long" })}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(+e.target.value)}
          className="p-2 bg-[#0f172a] border border-gray-600 rounded"
        >
          {[2025, 2026, 2027, 2028].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        {/* ADD QUEUE */}
        {!isAddingQueue ? (
          <button
            onClick={() => setIsAddingQueue(true)}
            className="px-4 py-2 bg-cyan-700 rounded font-semibold"
          >
            + Add Queue
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              value={newQueue}
              onChange={(e) => setNewQueue(e.target.value)}
              placeholder="Queue name"
              className="p-2 bg-[#0f172a] border border-gray-600 rounded"
            />
            <button
              onClick={handleAddQueue}
              className="px-3 py-2 bg-green-600 rounded"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsAddingQueue(false);
                setNewQueue("");
              }}
              className="px-3 py-2 bg-red-600 rounded"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* MATRIX */}
      <div className="overflow-auto border border-gray-700 rounded-lg">
        <table className="min-w-max w-full text-sm">
          <thead className="bg-[#0f172a] sticky top-0">
            <tr>
              <th className="p-3 sticky left-0 bg-[#0f172a]">Queue</th>
              {[...Array(daysInMonth)].map((_, i) => (
                <th key={i} className="p-2">
                  {i + 1}
                </th>
              ))}
              <th className="p-3 sticky right-0 bg-[#0f172a]">Total</th>
            </tr>
          </thead>

          <tbody>
            {activeQueues.map((queue) => {
              const rowTotal = Object.values(costMatrix?.[queue] || {}).reduce(
                (s, v) => s + (parseFloat(v) || 0),
                0
              );

              return (
                <tr key={queue}>
                  <td className="p-3 sticky left-0 bg-[#1d2738]">
                    {queue}
                  </td>

                  {[...Array(daysInMonth)].map((_, i) => (
                    <td key={i}>
                      <input
                        type="number"
                        value={costMatrix?.[queue]?.[i + 1] || ""}
                        onChange={(e) =>
                          handleCostChange(queue, i + 1, e.target.value)
                        }
                        className="w-20 p-1 bg-[#0f172a] border border-gray-600 rounded text-center"
                      />
                    </td>
                  ))}

                  <td className="p-3 sticky right-0 bg-[#1d2738] text-cyan-400">
                    ${rowTotal.toLocaleString()}
                  </td>
                </tr>
              );
            })}

            <tr className="bg-[#0f172a] font-bold">
              <td className="p-3 sticky left-0 bg-[#0f172a]">TOTAL</td>
              {dayTotals.map((t, i) => (
                <td key={i} className="text-center">
                  ${t.toLocaleString()}
                </td>
              ))}
              <td className="p-3 sticky right-0 bg-[#0f172a] text-green-400">
                ${grandTotal.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-right">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-cyan-600 rounded font-bold"
        >
          Save All
        </button>
      </div>

      {isLoading && <p className="mt-4 text-gray-400">Loading...</p>}
    </div>
  );
};

export default MarketingCost;
