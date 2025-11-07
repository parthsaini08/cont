import React, { useState } from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

const ExpenseTable = ({ expenses, onUpdateExpense, onDeleteExpense }) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);

  const handleChange = (id, field, value) => {
    const expense = expenses.find((e) => e.id === id);
    const updated = {
      ...expense,
      months: { ...expense.months, [field]: value },
    };
    onUpdateExpense(updated);
  };

  const handleNameChange = (id, value) => {
    const expense = expenses.find((e) => e.id === id);
    onUpdateExpense({ ...expense, name: value });
  };

  const calculateRowTotal = (months) =>
    Object.values(months).reduce((sum, val) => sum + Number(val || 0), 0);

  const groupTotal = expenses.reduce(
    (sum, e) => sum + calculateRowTotal(e.months),
    0
  );

  const allMonths = Object.keys(expenses[0]?.months || {
    Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
    Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
  });

  // ✅ Filter logic
  const visibleMonths = selectedMonths.length > 0 ? selectedMonths : allMonths;

  const toggleMonth = (month) => {
    setSelectedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month]
    );
  };

  const selectAll = () => setSelectedMonths(allMonths);
  const clearAll = () => setSelectedMonths([]);

  return (
    <div className="p-4 bg-[#0f172a] text-gray-200 rounded-lg shadow-lg border border-gray-700">
      {/* Filter Bar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Expense Overview</h2>

        <div className="relative">
          <button
            onClick={() => setFilterOpen((p) => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] border border-gray-600 rounded-lg hover:bg-[#27344d] text-sm"
          >
            {selectedMonths.length > 0
              ? `${selectedMonths.length} Month(s) Selected`
              : "Filter Months"}
            {filterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#1e293b] border border-gray-600 rounded-lg shadow-lg z-10">
              <div className="p-2 max-h-64 overflow-y-auto">
                {allMonths.map((month) => (
                  <label
                    key={month}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-[#334155] rounded cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(month)}
                      onChange={() => toggleMonth(month)}
                      className="accent-blue-500"
                    />
                    {month}
                  </label>
                ))}
              </div>

              <div className="flex justify-between border-t border-gray-600 text-sm">
                <button
                  onClick={selectAll}
                  className="w-1/2 py-2 hover:bg-[#334155] text-blue-400"
                >
                  Select All
                </button>
                <button
                  onClick={clearAll}
                  className="w-1/2 py-2 hover:bg-[#334155] text-red-400"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expense Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-left text-sm bg-[#111827] rounded-lg overflow-hidden border border-gray-700">
          <thead className="bg-[#1e293b] text-gray-300">
            <tr>
              <th className="px-4 py-3">Expense Name</th>
              {visibleMonths.map((month) => (
                <th key={month} className="px-3 py-2 text-center">{month}</th>
              ))}
              <th className="px-3 py-2 text-center">Total</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {expenses.map((e) => (
              <tr
                key={e.id}
                className="even:bg-[#1f2937] odd:bg-[#0f172a] hover:bg-[#27344d] transition"
              >
                <td className="px-3 py-2">
                  <input
                    value={e.name}
                    onChange={(ev) => handleNameChange(e.id, ev.target.value)}
                    className="w-full bg-transparent border-b border-gray-500 focus:border-blue-400 text-gray-100 outline-none"
                  />
                </td>

                {visibleMonths.map((month) => (
                  <td key={month} className="px-3 py-2 text-center">
                    <input
                      type="number"
                      value={e.months[month]}
                      onChange={(ev) =>
                        handleChange(e.id, month, ev.target.value)
                      }
                      className="w-20 bg-[#1e293b] text-center rounded-md text-gray-100 border border-gray-600 focus:border-blue-400 outline-none"
                    />
                  </td>
                ))}

                <td className="px-3 py-2 text-center font-semibold text-gray-100">
                  {calculateRowTotal(e.months).toLocaleString()}
                </td>

                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => onDeleteExpense(e.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition inline-flex items-center justify-center"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </td>
              </tr>
            ))}

            {expenses.length > 0 && (
              <tr className="bg-[#1e293b] font-semibold">
                <td
                  className="px-3 py-2 text-right text-gray-200"
                  colSpan={visibleMonths.length + 1}
                >
                  Group Total:
                </td>
                <td className="px-3 py-2 text-center text-green-400">
                  {groupTotal.toLocaleString()}
                </td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseTable;
