import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const ExpenseSummary = ({ expenses }) => {
  if (!expenses) return null;

  const monthKeys = Object.keys(expenses[0]?.months || {});
  const monthlyTotals = monthKeys.map((month) => ({
    name: month,
    total: expenses.reduce((sum, e) => sum + Number(e.months[month] || 0), 0),
  }));

  const annualTotal = monthlyTotals.reduce((sum, m) => sum + m.total, 0);

  return (
    <section className="mt-8 bg-gray-900 text-gray-100 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Expense Summary</h3>

      {/* Total Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {monthlyTotals.map((m) => (
          <div
            key={m.name}
            className="bg-gray-800 p-3 rounded-md text-center border border-gray-700"
          >
            <p className="text-sm text-gray-400">{m.name}</p>
            <p className="text-lg font-bold text-green-400">
              ${m.total.toLocaleString()}
            </p>    
          </div>
        ))}
      </div>

      {/* Annual Total */}
      <div className="text-center my-4">
        <p className="text-gray-400 text-sm uppercase tracking-wider">
          Annual Total
        </p>
        <h2 className="text-3xl font-bold text-blue-400">
          ${annualTotal.toLocaleString()}
        </h2>
      </div>

      {/* Chart Visualization */}
      <div className="h-64 mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyTotals}>
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                borderRadius: "8px",
                border: "1px solid #374151",
              }}
            />
            <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default ExpenseSummary;
