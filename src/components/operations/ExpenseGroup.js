import React, { useMemo } from "react";
import { Copy, Trash2 } from "lucide-react";

const ExpenseGroup = ({ group, onUpdate, onDelete, selectedMonths }) => {
  const filterMonths =
    selectedMonths.length > 0
      ? selectedMonths
      : [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

  // Calculate month totals + grand total
  const { monthTotals, grandTotal } = useMemo(() => {
    const totals = {};
    let overall = 0;

    group.expenses.forEach((expense) => {
      filterMonths.forEach((month) => {
        const val = Number(expense.months?.[month] || 0);
        totals[month] = (totals[month] || 0) + val;
        overall += val;
      });
    });

    return { monthTotals: totals, grandTotal: overall };
  }, [group.expenses, filterMonths]);

  const handleExpenseChange = (expenseId, month, value) => {
    const updatedExpenses = group.expenses.map((e) =>
      e.id === expenseId
        ? { ...e, months: { ...e.months, [month]: value } }
        : e
    );

    onUpdate({ ...group, expenses: updatedExpenses });
  };

  const copyEntireMonth = (fromMonth, toMonth) => {
    const updatedExpenses = group.expenses.map((expense) => ({
      ...expense,
      months: {
        ...expense.months,
        [toMonth]: expense.months[fromMonth],
      },
    }));

    onUpdate({ ...group, expenses: updatedExpenses });
  };

  const handleAddExpense = () => {
    const newExpense = {
      id: Date.now(),
      name: `Expense-${group.expenses.length + 1}`,
      months: Object.fromEntries(
        filterMonths.map((m) => [m, 0])
      ),
    };

    onUpdate({ ...group, expenses: [...group.expenses, newExpense] });
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm("Delete this expense?")) {
      onUpdate({
        ...group,
        expenses: group.expenses.filter((e) => e.id !== id),
      });
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-5 shadow-lg border border-gray-700">
      {/* Group Title */}
      <div className="flex justify-between items-center mb-5">
        <input
          type="text"
          value={group.name}
          onChange={(e) => onUpdate({ ...group, name: e.target.value })}
          className="text-xl font-semibold bg-transparent border-b border-gray-600 focus:border-green-400 text-white outline-none"
        />

        <button
          onClick={() => onDelete(group.id)}
          className="text-red-500 hover:text-red-400"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-gray-200 border-collapse">
          <thead>
            {/* TOTALS ROW */}
            <tr className="bg-gray-900 text-yellow-400 font-bold text-center">
              <th className="p-2 border border-gray-700 text-left">TOTAL</th>
              {filterMonths.map((m) => (
                <th key={m} className="p-2 border border-gray-700">
                  {monthTotals[m] || 0}
                </th>
              ))}
              <th className="p-2 border border-gray-700 text-green-400">
                {grandTotal}
              </th>
              <th className="p-2 border border-gray-700"></th>
            </tr>

            {/* COLUMN HEADERS WITH COPY BUTTONS */}
            <tr className="bg-gray-700 text-left">
              <th className="p-2 border border-gray-600 w-1/4">
                Expense Name
              </th>

              {filterMonths.map((month, idx) => {
                const nextMonth = filterMonths[idx + 1]; // determine next month

                return (
                  <th
                    key={month}
                    className="p-2 border border-gray-600 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <span>{month}</span>

                      {/* COPY THIS MONTH → NEXT MONTH */}
                      {nextMonth && (
                        <button
                          onClick={() => copyEntireMonth(month, nextMonth)}
                          className="mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 transition"
                        >
                          <Copy size={8}/>
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}

              <th className="p-2 border border-gray-600 text-center">Total</th>
              <th className="p-2 border border-gray-600"></th>
            </tr>
          </thead>

          <tbody>
            {group.expenses.map((expense) => {
              const total = filterMonths.reduce(
                (sum, m) => sum + Number(expense.months[m] || 0),
                0
              );

              return (
                <tr
                  key={expense.id}
                  className="hover:bg-gray-700 transition text-center"
                >
                  {/* Expense Name */}
                  <td className="p-2 border border-gray-700 text-left">
                    <input
                      type="text"
                      value={expense.name}
                      onChange={(e) =>
                        onUpdate({
                          ...group,
                          expenses: group.expenses.map((ex) =>
                            ex.id === expense.id
                              ? { ...ex, name: e.target.value }
                              : ex
                          ),
                        })
                      }
                      className="bg-transparent border-b border-gray-600 focus:outline-none text-white w-full"
                    />
                  </td>

                  {/* Month Value Inputs */}
                  {filterMonths.map((month) => (
                    <td key={month} className="p-2 border border-gray-700">
                      <input
                        type="number"
                        value={expense.months?.[month] || ""}
                        onChange={(e) =>
                          handleExpenseChange(
                            expense.id,
                            month,
                            e.target.value
                          )
                        }
                        className="w-20 text-center bg-gray-900 border border-gray-700 rounded-md text-white"
                      />
                    </td>
                  ))}

                  {/* Row Total */}
                  <td className="p-2 border border-gray-700 font-semibold text-green-400">
                    {total}
                  </td>

                  {/* Delete Row */}
                  <td className="p-2 border border-gray-700 text-center">
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Expense */}
      <div className="mt-5 text-right">
        <button
          onClick={handleAddExpense}
          className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-md text-sm"
        >
          + Add Expense
        </button>
      </div>
    </div>
  );
};

export default ExpenseGroup;
