import React from "react";
import { PlusCircle, Save, FileDown, Calendar } from "lucide-react";

const monthsList = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const quarterList = [
  { name: "Q1", months: ["Jan", "Feb", "Mar"] },
  { name: "Q2", months: ["Apr", "May", "Jun"] },
  { name: "Q3", months: ["Jul", "Aug", "Sep"] },
  { name: "Q4", months: ["Oct", "Nov", "Dec"] },
];

const HeaderActions = ({
  onAddGroup,
  onSave,
  onExport, // 👈 new prop
  selectedYear,
  onYearChange,
  selectedMonths,
  onMonthChange,
}) => {
  const handleMonthToggle = (month) => {
    if (selectedMonths.includes(month)) {
      onMonthChange(selectedMonths.filter((m) => m !== month));
    } else {
      onMonthChange([...selectedMonths, month]);
    }
  };

  return (
    <div className="w-full flex flex-wrap justify-between items-center mb-4 gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-gray-300">
          Select Timeframe:
        </div>

        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="bg-gray-800 border border-white text-white px-3 py-2 rounded-md"
        >
          {Array.from({ length: 11 }, (_, i) => {
          const year = 2025 + i;
          return (
            <option key={year} value={year}>
              {year}
            </option>
          );
        })}
        </select>

        <div className="flex flex-wrap gap-2">
          {monthsList.map((month) => (
            <button
              key={month}
              onClick={() => handleMonthToggle(month)}
              className={`px-2 py-1 border border-white rounded-md text-sm ${
                selectedMonths.includes(month)
                  ? "bg-green-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {month}
            </button>
          ))}

          {quarterList.map((quarter) => {
            const isSelected = quarter.months.every((m) =>
              selectedMonths.includes(m)
            );
            return (
              <button
                key={quarter.name}
                onClick={() => {
                  if (isSelected) {
                    onMonthChange(
                      selectedMonths.filter(
                        (m) => !quarter.months.includes(m)
                      )
                    );
                  } else {
                    onMonthChange([
                      ...new Set([...selectedMonths, ...quarter.months]),
                    ]);
                  }
                }}
                className={`px-6 py-1 border border-white rounded-md text-sm ${
                  isSelected ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {quarter.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onAddGroup}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md text-sm flex items-center gap-2"
        >
          <PlusCircle size={16} />
          Add Group
        </button>

        <button
          onClick={onSave}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md text-sm flex items-center gap-2"
        >
          <Save size={16} />
          Save All
        </button>

        {/* 👇 New Export to Excel button */}
        <button
          onClick={onExport}
          className="bg-emerald-700 hover:bg-emerald-600 px-4 py-2 rounded-md text-sm flex items-center gap-2"
        >
          <FileDown size={16} />
          Export to Excel
        </button>
      </div>
    </div>
  );
};

export default HeaderActions;
