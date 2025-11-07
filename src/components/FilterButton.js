import React, { useState } from "react";
import DateTimeRangePicker from "./DateRangeFilter";
import { Calendar } from "lucide-react";

const FilterButton = ({ dateRange, onApply }) => {
  const [showFilter, setShowFilter] = useState(false);

  // Format date string for display (YYYY-MM-DD HH:mm:ss -> MM/DD/YYYY HH:mm)
  const formatDate = (dateString) => {
    if (!dateString) return "";
    
    // Handle both "YYYY-MM-DD HH:mm:ss" and "YYYY-MM-DDTHH:mm:ss" formats
    const normalized = dateString.replace("T", " ");
    const [datePart, timePart] = normalized.split(" ");
    
    if (!datePart) return dateString;
    
    const [year, month, day] = datePart.split("-");
    const timeDisplay = timePart ? timePart.substring(0, 5) : "00:00"; // HH:mm only
    
    return `${month}/${day}/${year} ${timeDisplay}`;
  };

  return (
    <div className="flex justify-end mb-4">
      <div className="relative inline-block">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-indigo-500/90 to-blue-500/70 rounded hover:bg-[#374151] border border-white whitespace-nowrap"
        >
          <Calendar size={16} />
          <span className="text-md">
            {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
          </span>
        </button>

        {showFilter && (
          <div className="absolute right-0 mt-2 z-50">
            <DateTimeRangePicker
              initialStartDate={dateRange.startDate}
              initialEndDate={dateRange.endDate}
              onApply={({ startDate, endDate }) => {
                console.log("FilterButton Apply:", { startDate, endDate });
                onApply({ startDate, endDate });
                setShowFilter(false);
              }}
              onCancel={() => setShowFilter(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterButton;