import React from "react";
import { Plus, Download, Upload, Filter } from "lucide-react";

const ExpenseToolbar = ({ onAddGroup, onImport, onExport, onFilter }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-900 rounded-lg shadow-md mb-6 border border-gray-700">
      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-100 tracking-wide">
        Operations Cost Manager
      </h2>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onAddGroup}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Cost Group
        </button>

        <button
          onClick={onImport}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg transition text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>

        <button
          onClick={onFilter}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg transition text-sm font-medium"
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>
    </div>
  );
};

export default ExpenseToolbar;