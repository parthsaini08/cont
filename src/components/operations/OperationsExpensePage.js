import React, { useState, useEffect, useMemo } from "react";
import HeaderActions from "./HeaderActions";
import ExpenseGroup from "./ExpenseGroup";
import { BASE_URL } from "../../config";
import * as XLSX from "xlsx"; // 👈 import XLSX

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const OperationsExpensePage = () => {
  const [groups, setGroups] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState([]);

  const fetchExpenses = async (year) => {
    try {
      const res = await fetch(`${BASE_URL}get_expenses.php?year=${year}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") setGroups(data.groups);
      else alert("Failed to load data: " + data.message);
    } catch (err) {
      console.error(err);
      alert("Error fetching expenses.");
    }
  };

  useEffect(() => {
    fetchExpenses(selectedYear);
  }, [selectedYear]);

  const addGroup = () => {
    const newGroup = {
      id: Date.now(),
      name: `Group-${groups.length + 1}`,
      expenses: [],
    };
    setGroups([...groups, newGroup]);
  };

  const quarterList = [
    { name: "Q1", months: ["Jan", "Feb", "Mar"] },
    { name: "Q2", months: ["Apr", "May", "Jun"] },
    { name: "Q3", months: ["Jul", "Aug", "Sep"] },
    { name: "Q4", months: ["Oct", "Nov", "Dec"] },
  ];
  

  const saveAll = async () => {
    const res = await fetch(`${BASE_URL}save_expenses.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ year: selectedYear, groups }),
    });
    const data = await res.json();
    alert(data.message);
  };

  const updateGroup = (updatedGroup) => {
    setGroups(groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
  };

  const deleteGroup = (id) => {
    if (window.confirm("Delete this group?")) {
      setGroups(groups.filter((g) => g.id !== id));
    }
  };

  const { monthTotals, grandTotal } = useMemo(() => {
    const monthTotals = Array(12).fill(0);
    groups.forEach((group) => {
      group.expenses?.forEach((exp) => {
        Object.entries(exp.months || {}).forEach(([month, value]) => {
          const monthIndex = monthNames.indexOf(month);
          if (monthIndex !== -1)
            monthTotals[monthIndex] += parseFloat(value || 0);
        });
      });
    });

    const filteredMonths =
      selectedMonths.length > 0
        ? selectedMonths.map((m) => monthNames.indexOf(m))
        : monthTotals.map((_, i) => i);

    const filteredMonthTotals = monthTotals.map((val, i) =>
      filteredMonths.includes(i) ? val : 0
    );

    const grandTotal = filteredMonthTotals.reduce((a, b) => a + b, 0);

    return { monthTotals: filteredMonthTotals, grandTotal };
  }, [groups, selectedMonths]);

  const quarterTotal = (quarter) =>
    quarter.months.reduce((sum, month) => {
      const monthIndex = monthNames.indexOf(month);
      return sum + (monthTotals[monthIndex] || 0);
    }, 0);

  // ✅ Export to Excel
  const handleExportToExcel = () => {
    // Prepare a flat structure
    const exportData = [];

    groups.forEach((group) => {
      group.expenses.forEach((exp) => {
        const row = {
          Group: group.name,
          Expense: exp.name || "-",
          ...monthNames.reduce((acc, m) => {
            acc[m] = exp.months?.[m] || 0;
            return acc;
          }, {}),
        };
        exportData.push(row);
      });
    });

    // Add summary row
    exportData.push({});
    exportData.push({
      Group: "Grand Total",
      ...monthNames.reduce((acc, m, i) => {
        acc[m] = monthTotals[i];
        return acc;
      }, {}),
      Total: grandTotal,
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, `Expenses_${selectedYear}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-[#1e293b] text-gray-100 p-6">
      <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600">
        Operations Expense Management
      </h1>

      {/* Header Actions */}
      <HeaderActions
        onAddGroup={addGroup}
        onSave={saveAll}
        onExport={handleExportToExcel} // 👈 pass export handler
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedMonths={selectedMonths}
        onMonthChange={setSelectedMonths}
      />

      {/* Totals Summary */}
      <div className="bg-gradient-to-b from-[#0f172a] to-[#1a2235] border border-gray-700 rounded-2xl p-5 mb-6 shadow-lg">
        <h2 className="text-xl font-semibold text-teal-400 mb-4 tracking-wide">
          Overall Summary ({selectedYear})
        </h2>

        {/* Monthly Totals */}
        <div className="grid grid-cols-12 gap-2 text-center text-sm font-medium">
          {monthNames.map((m, i) => (
            <div
              key={m}
              className={`p-3 rounded-xl transition-all duration-200 ${
                selectedMonths.length === 0 || selectedMonths.includes(m)
                  ? "bg-gradient-to-b from-[#0f766e] to-[#0d9488] text-white shadow-md hover:from-[#0d9488] hover:to-[#14b8a6]"
                  : "bg-[#1e293b] text-gray-500 border border-gray-700"
              }`}
            >
              <div className="text-xs uppercase tracking-wide">{m}</div>
              <div className="text-md font-bold mt-1">
                ${monthTotals[i]?.toLocaleString() || 0}
              </div>
            </div>
          ))}
        </div>

        {/* Quarter Totals */}
        <div className="grid grid-cols-4 gap-3 mt-5 text-center text-sm font-medium">
          {quarterList.map((quarter) => {
            const isVisible =
              selectedMonths.length === 0 ||
              quarter.months.some((m) => selectedMonths.includes(m));
            return (
              <div
                key={quarter.name}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  isVisible
                    ? "bg-gradient-to-b from-[#1e3a8a] to-[#3b82f6] text-white shadow-md hover:from-[#2563eb] hover:to-[#60a5fa]"
                    : "bg-[#1e293b] text-gray-500 border border-gray-700"
                }`}
              >
                <div className="text-xs uppercase tracking-wide">
                  {quarter.name}
                </div>
                <div className="text-md font-bold mt-1">
                  ${quarterTotal(quarter).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grand Total */}
        <div className="mt-6 bg-gradient-to-r from-[#fc466b] to-[#3f5efb] text-white font-bold text-center py-3 rounded-xl text-lg tracking-wide shadow-lg">
          Grand Total: ${grandTotal.toLocaleString()}
        </div>
      </div>

      {/* Expense Groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <ExpenseGroup
            key={group.id}
            group={group}
            onUpdate={updateGroup}
            onDelete={deleteGroup}
            selectedMonths={selectedMonths}
          />
        ))}
      </div>
    </div>
  );
};

export default OperationsExpensePage;
