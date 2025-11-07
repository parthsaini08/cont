import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ============================================
// TIMEZONE UTILITIES - All dates in NY timezone
// ============================================

// Get current time in NY timezone as Date object
const getNowInNY = () => {
  const now = new Date();
  
  const nyTimeString = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const [datePart, timePart] = nyTimeString.split(", ");
  const [month, day, year] = datePart.split("/");
  const [hour, minute, second] = timePart.split(":");

  return new Date(year, month - 1, day, hour, minute, second);
};

// Convert Date object to NY timezone string (YYYY-MM-DD HH:mm:ss)
const dateToNYString = (date) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

// Parse NY string to Date object
const parseNYString = (nyString) => {
  if (!nyString) return null;
  
  // Handle both "YYYY-MM-DD HH:mm:ss" and "YYYY-MM-DDTHH:mm:ss" formats
  const normalized = nyString.replace("T", " ");
  const [datePart, timePart] = normalized.split(" ");
  
  if (!datePart || !timePart) return null;
  
  const [year, month, day] = datePart.split("-");
  const [hour, minute, second] = timePart.split(":");

  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second) || 0
  );
};

// Date manipulation helpers
const startOfDay = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (d) => {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
};

const addDays = (d, days) => {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
};

const DateTimeRangePicker = ({
  initialStartDate,
  initialEndDate,
  onApply,
  onCancel,
}) => {
  const nowNY = getNowInNY();
  
  // Initialize dates - parse string if provided, otherwise use defaults
  const [startDate, setStartDate] = useState(() => {
    if (initialStartDate) {
      const parsed = parseNYString(initialStartDate);
      return parsed || startOfDay(nowNY);
    }
    return startOfDay(nowNY);
  });
  
  const [endDate, setEndDate] = useState(() => {
    if (initialEndDate) {
      const parsed = parseNYString(initialEndDate);
      return parsed || nowNY;
    }
    return nowNY;
  });
  
  const [activeRange, setActiveRange] = useState(null);

  // Quick range presets
  const quickRanges = [
    {
      label: "Today",
      range: () => {
        const now = getNowInNY();
        return [startOfDay(now), now];
      },
    },
    {
      label: "Yesterday",
      range: () => {
        const now = getNowInNY();
        const yesterday = addDays(now, -1);
        return [startOfDay(yesterday), endOfDay(yesterday)];
      },
    },
    {
      label: "Last 7 days",
      range: () => {
        const now = getNowInNY();
        const weekAgo = addDays(now, -6);
        return [startOfDay(weekAgo), now];
      },
    },
    {
      label: "Last 30 days",
      range: () => {
        const now = getNowInNY();
        const monthAgo = addDays(now, -29);
        return [startOfDay(monthAgo), now];
      },
    },
    {
      label: "This month",
      range: () => {
        const now = getNowInNY();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return [startOfDay(firstDay), now];
      },
    },
    {
      label: "Last month",
      range: () => {
        const now = getNowInNY();
        const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastOfLastMonth = addDays(firstOfThisMonth, -1);
        const firstOfLastMonth = new Date(
          lastOfLastMonth.getFullYear(),
          lastOfLastMonth.getMonth(),
          1
        );
        return [startOfDay(firstOfLastMonth), endOfDay(lastOfLastMonth)];
      },
    },
    {
      label: "This year",
      range: () => {
        const now = getNowInNY();
        const firstDay = new Date(now.getFullYear(), 0, 1);
        return [startOfDay(firstDay), now];
      },
    },
  ];

  const handleQuickRange = (rangeFn, label) => {
    const [s, e] = rangeFn();
    setStartDate(s);
    setEndDate(e);
    setActiveRange(label);
  };

  const handleApply = () => {
    const startString = dateToNYString(startDate);
    const endString = dateToNYString(endDate);

    console.log("DateTimeRangePicker Apply:", {
      startDate: startString,
      endDate: endString,
    });

    onApply({
      startDate: startString,
      endDate: endString,
    });
  };

  return (
    <div className="bg-[#1e293b] text-gray-200 p-4 rounded-2xl shadow-2xl md:w-[800px] w-full flex flex-col md:flex-row gap-4 border border-white">
      {/* Left: Calendars */}
      <div className="flex flex-col gap-4 flex-1">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-400">
            Start Date & Time (New York)
          </label>
          <DatePicker
            selected={startDate}
            onChange={(date) => {
              setStartDate(date);
              setActiveRange(null);
            }}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="MMM d, yyyy h:mm aa"
            className="px-3 py-2 rounded-md text-black w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-400">
            End Date & Time (New York)
          </label>
          <DatePicker
            selected={endDate}
            onChange={(date) => {
              setEndDate(date);
              setActiveRange(null);
            }}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="MMM d, yyyy h:mm aa"
            className="px-3 py-2 rounded-md text-black w-full"
            minDate={startDate}
            maxDate={getNowInNY()}
          />
        </div>
      </div>

      {/* Right: Quick Ranges */}
      <div className="md:w-52 w-full md:border-l md:pl-4 border-gray-700 flex flex-col justify-between">
        <div className="space-y-1 grid grid-cols-2 md:grid-cols-1 gap-2 mb-4">
          {quickRanges.map((qr) => (
            <div
              key={qr.label}
              className={`cursor-pointer px-3 py-2 rounded-md text-sm text-center transition 
                ${
                  activeRange === qr.label
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-700"
                }`}
              onClick={() => handleQuickRange(qr.range, qr.label)}
            >
              {qr.label}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col md:flex-row gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateTimeRangePicker;