import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../config";
import { FileDown, PhoneCall, BarChart3, CheckCircle, DollarSign, User } from "lucide-react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";

const AgentExpenseTable = ({ dateRange }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [totals, setTotals] = useState({
    marketing_spent: 0,
    total_calls: 0,
    MCO: 0,
    bookings: 0,
  });

  // ⭐ Sorting states
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return;

    const addHoursUTC = (isoString, hours) => {
      if (!isoString) return "";
      const date = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
      date.setUTCHours(date.getUTCHours() + hours);
      return date.toISOString();
    };

    const startDateAdjusted = addHoursUTC(dateRange.startDate, 5);
    const endDateAdjusted = addHoursUTC(dateRange.endDate, 5);

    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${BASE_URL}get_marketing_summary_agentwise.php?startDate=${encodeURIComponent(
            startDateAdjusted
          )}&endDate=${encodeURIComponent(endDateAdjusted)}`,
          { credentials: "include" }
        );

        const json = await res.json();
        if (json.status === "success") {
          const data = json.summary || [];
          setSummaryData(data);

          const totalRow = data.find((r) => r.agent_name === "Total");
          if (totalRow) setTotals(totalRow);
        } else {
          setSummaryData([]);
        }
      } catch (err) {
        console.error("Failed to fetch agent summary:", err);
        setSummaryData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [dateRange]);

  // ---------------- Excel Export ----------------
  const exportToExcel = async () => {
  if (!summaryData.length) return alert("No data to export.");

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Agent Summary");

  // ---- HEADERS ----
  const headers = [
    "Agent Name",
    "Marketing Spent",
    "Calls",
    "MCO",
    "Bookings",
    "Conversion (%)",
    "Revenue Ratio",
  ];

  worksheet.addRow(headers);

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" }, // dark blue
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // ---- DATA ROWS ----
  summaryData.forEach((row) => {
    const conversion =
      row.total_calls > 0
        ? ((row.bookings / row.total_calls) * 100).toFixed(2) + "%"
        : "0%";

    worksheet.addRow([
      row.agent_name,
      row.marketing_spent,
      row.total_calls,
      row.MCO,
      row.bookings,
      conversion,
      row.marketing_spent > 0
        ? (row.MCO / row.marketing_spent).toFixed(2)
        : "0.00",
    ]);
  });

  // ---- APPLY FORMATS TO DATA ----
  worksheet.eachRow((row, rowIndex) => {
    row.eachCell((cell, colIndex) => {
      // Borders for each cell
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Right align numbers (except names)
      if (colIndex !== 1) {
        cell.alignment = { horizontal: "right" };
      }

      // Currency Formatting
      if (colIndex === 2 || colIndex === 4) {
        // Marketing Spent = column 2
        // MCO = column 4
        if (typeof cell.value === "number") {
          cell.numFmt = "$#,##0.00";
        }
      }
    });
  });

  // ---- TOTAL ROW STYLING ----
  const lastRow = worksheet.getRow(worksheet.rowCount);
  lastRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFF00" }, // Yellow
    };
    cell.font = { bold: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { horizontal: "center" };
  });

  // ---- COLUMN WIDTHS ----
  worksheet.columns = [
    { width: 20 }, // Agent Name
    { width: 18 }, // Marketing Spent
    { width: 10 }, // Calls
    { width: 12 }, // MCO
    { width: 10 }, // Bookings
    { width: 15 }, // Conversion
    { width: 15 }, // Revenue Ratio
  ];

  // ---- SAVE FILE ----
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `AgentSummary_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
};


  // ---------------- Sorting Logic ----------------
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedData = (() => {
    const totalRow = summaryData.find((r) => r.agent_name === "Total");
    const rest = summaryData.filter((r) => r.agent_name !== "Total");

    const getValue = (row, field) => {
      switch (field) {
        case "conversion":
          return row.total_calls > 0
            ? (row.bookings / row.total_calls) * 100
            : 0;

        case "revenueRatio":
          return row.marketing_spent > 0
            ? row.MCO / row.marketing_spent
            : 0;

        default:
          return Number(row[field]) || 0;
      }
    };

    const sorted = rest.sort((a, b) => {
      if (!sortField) return 0;

      const valA = getValue(a, sortField);
      const valB = getValue(b, sortField);

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return totalRow ? [...sorted, totalRow] : sorted;
  })();

  // ---------------- Summary Cards ----------------
  const summaryCards = [
    {
      label: "Total Marketing Spend",
      value: `$${totals.marketing_spent?.toFixed(2)}`,
      icon: <DollarSign size={22} />,
      gradient: "from-green-600 to-emerald-800",
    },
    {
      label: "Total Calls",
      value: totals.total_calls,
      icon: <PhoneCall size={22} />,
      gradient: "from-blue-600 to-indigo-700",
    },
    {
      label: "Total MCO",
      value: `$${totals.MCO?.toFixed(2)}`,
      icon: <BarChart3 size={22} />,
      gradient: "from-cyan-600 to-sky-700",
    },
    {
      label: "Total Bookings",
      value: totals.bookings,
      icon: <CheckCircle size={22} />,
      gradient: "from-purple-600 to-pink-700",
    },
  ];

  return (
    <div className="rounded-2xl shadow-xl border border-[#1f3b58] bg-[#0B1E34]/60 backdrop-blur-lg p-5 sm:p-6 space-y-6">

      {/* Summary Cards */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {summaryCards.map((card, i) => (
            <div
              key={i}
              className={`flex flex-col justify-between p-4 rounded-2xl border border-[#264766] shadow-lg bg-gradient-to-br ${card.gradient} bg-opacity-20 hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">{card.label}</span>
                <div className="p-2 rounded-lg bg-white/10 text-white">{card.icon}</div>
              </div>

              <div className="text-2xl font-bold mt-2 bg-white/90 bg-clip-text text-transparent">
                {card.value}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 sm:px-4 py-3 border-b border-gray-700 gap-3">
        <h2 className="font-semibold text-base sm:text-lg text-white">
          Agent-wise Productivity Summary
        </h2>

        <button
          onClick={exportToExcel}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-sm bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 shadow-md text-white"
        >
          <FileDown size={16} /> Export to Excel
        </button>
      </div>

      {/* ==================== TABLE ==================== */}
      {isLoading ? (
        <div className="text-gray-300 p-4">Loading summary...</div>
      ) : summaryData.length === 0 ? (
        <div className="text-gray-400 p-4 text-sm text-center">
          No agent summary available.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-xs sm:text-sm text-gray-300 border-collapse">
            <thead>
              <tr className="bg-[#1e293b] uppercase text-[10px] sm:text-xs tracking-wide text-gray-300">

                {/* SORTABLE HEADERS */}
                {[
                  { field: "agent_name", label: "Agent Name" },
                  { field: "marketing_spent", label: "Marketing Spent" },
                  { field: "total_calls", label: "Calls" },
                  { field: "MCO", label: "MCO" },
                  { field: "bookings", label: "Bookings" },
                  { field: "conversion", label: "Conversion" },
                  { field: "revenueRatio", label: "Revenue Ratio" },
                ].map((col) => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className="p-2 sm:p-3 text-center border-r border-gray-700 cursor-pointer hover:bg-[#334155] select-none"
                  >
                    {col.label}
                    {sortField === col.field && (
                      <span className="ml-1 text-[10px]">
                        {sortOrder === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </th>
                ))}

              </tr>
            </thead>

            <tbody>
              {sortedData.map((row, index) => {
                const isTotal = row.agent_name === "Total";

                const conversion =
                  row.total_calls > 0
                    ? ((row.bookings / row.total_calls) * 100).toFixed(2) + "%"
                    : "0%";

                const revenueRatio =
                  row.marketing_spent > 0
                    ? (row.MCO / row.marketing_spent).toFixed(2)
                    : "0.00";

                return (
                  <tr
                    key={index}
                    className={`border-b border-gray-700 ${
                      isTotal
                        ? "bg-indigo-900 font-bold text-white"
                        : "hover:bg-[#1e293b]"
                    }`}
                  >
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.agent_name || "-"}
                    </td>

                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      ${row.marketing_spent?.toFixed(2)}
                    </td>

                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.total_calls}
                    </td>

                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      ${row.MCO?.toFixed(2)}
                    </td>

                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.bookings}
                    </td>

                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {conversion}
                    </td>

                    <td className="p-2 sm:p-3 text-center">
                      {revenueRatio}
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      )}

    </div>
  );
};

export default AgentExpenseTable;
