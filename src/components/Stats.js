import React from "react";

const Stats = ({ stats }) => {
  const items = [
    { label: "Total Calls", value: stats.total_calls },
    { label: "Calls Today", value: stats.calls_today },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6 ml-64 p-6">
      {items.map((item, i) => (
        <div key={i} className="bg-gray-800 p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-secondary">{item.value || 0}</div>
          <div className="text-sm text-gray-300">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default Stats;
