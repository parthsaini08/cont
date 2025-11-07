import { Funnel } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

const FilterPopup = ({
  columnKey,
  columnLabel,
  data,
  filterType = "text", // "text" | "numeric" | "multi"
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [gte, setGte] = useState(value?.gte || "");
  const [lte, setLte] = useState(value?.lte || "");
  const [selectedValues, setSelectedValues] = useState(value?.values || []);
  const [positionStyle, setPositionStyle] = useState({});
  const buttonRef = useRef();
  const popupRef = useRef();

  const uniqueValues = Array.from(
    new Set(data.map((row) => row[columnKey]).filter(Boolean))
  );

  // Close popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePopup = () => {
    if (!isOpen && buttonRef.current) {
      const btnRect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 260;
      const popupHeight = 300;

      let top = btnRect.bottom + 6;
      let left = btnRect.left;

      // Flip up if no space below
      if (window.innerHeight - btnRect.bottom < popupHeight && btnRect.top > popupHeight) {
        top = btnRect.top - popupHeight - 6;
      }

      // Flip left if no space on right
      if (btnRect.left + popupWidth > window.innerWidth - 10) {
        left = btnRect.right - popupWidth;
      }

      // Clamp values
      if (left < 10) left = 10;
      if (top < 10) top = 10;

      setPositionStyle({
        top: `${top}px`,
        left: `${left}px`,
        width: `${popupWidth}px`,
        maxHeight: `${popupHeight}px`,
      });
    }
    setIsOpen((prev) => !prev);
  };

  const handleApply = () => {
  if (filterType === "numeric") {
    onChange({
      type: "range",
      gte: gte !== "" ? parseFloat(gte) : undefined,
      lte: lte !== "" ? parseFloat(lte) : undefined,
    });
  }
  if(filterType === "duration") {
    onChange({
      type: "range",
      gte: gte !== "" ? parseInt(gte) : undefined,
      lte: lte !== "" ? parseInt(lte) : undefined,
    });
  }
  if (filterType === "text") onChange({ type: "text", value: inputValue });
  if (filterType === "multi") onChange({ type: "multi", values: selectedValues });
  setIsOpen(false);
};


  const handleClear = () => {
    if (filterType === "text") setInputValue("");
    if (filterType === "multi") setSelectedValues([]);
    if (filterType === "numeric") {
      setGte("");
      setLte("");
    }
    onChange(filterType === "numeric" ? { type: "range" } : { type: filterType });
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={togglePopup}
        className="ml-1 text-gray-300 hover:text-white"
        title="Filter"
      >
        <Funnel className="h-3"/>
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          style={{ position: "fixed", ...positionStyle }}
          className="z-50 p-3 bg-[#1e293b] border border-gray-700 rounded-lg shadow-xl text-sm overflow-auto"
        >
          <div className="mb-3 font-semibold text-gray-100 border-b border-gray-600 pb-1">
            {columnLabel} Filter
          </div>

          {filterType === "text" && (
            <input
              type="text"
              placeholder="Type to filter..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full p-2 mb-3 rounded bg-[#111827] text-gray-200 border border-gray-600"
            />
          )}
          {filterType === "duration" && (
            <div className="flex flex-col gap-2 mb-3">
              <select
                value={gte}
                onChange={(e) => setGte(e.target.value*1000)}
                className="w-full p-2 rounded bg-[#111827] text-gray-200 border border-gray-600"
              >
                <option value="">Min Duration</option>
                <option value="60">1 minute</option>
                <option value="300">5 minutes</option>
                <option value="600">10 minutes</option>
                <option value="1200">20 minutes</option>
              </select>
              </div>
          )
          }

          {filterType === "multi" && (
            <div className="mb-3 max-h-40 overflow-y-auto">
              {/* {uniqueValues.length <= 10 ? ( */}{                uniqueValues.map((val) => (
                  <label key={val} className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(val)}
                      onChange={() =>
                        setSelectedValues((prev) =>
                          prev.includes(val)
                            ? prev.filter((v) => v !== val)
                            : [...prev, val]
                        )
                      }
                    />
                    <span className="text-gray-200">{val}</span>
                  </label>
                ))}
              {/* ) : (
                <input
                  type="text"
                  placeholder="Search..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full p-2 rounded bg-[#111827] text-gray-200 border border-gray-600"
                />
              )} */}
            </div>
          )}

          {filterType === "numeric" && (
  <div className="flex flex-col gap-2 mb-3">
    <input
      type="number"
      placeholder="Min"
      value={gte}
      onChange={(e) => setGte(e.target.value)} // keep as string
      className="w-full p-2 rounded bg-[#111827] text-gray-200 border border-gray-600"
    />
    <input
      type="number"
      placeholder="Max"
      value={lte}
      onChange={(e) => setLte(e.target.value)} // keep as string
      className="w-full p-2 rounded bg-[#111827] text-gray-200 border border-gray-600"
    />
  </div>
)}


          <div className="flex justify-end gap-2">
            <button
              onClick={handleClear}
              className="px-3 py-1 text-gray-300 bg-gray-700 rounded hover:bg-gray-600"
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              className="px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-500"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPopup;
