import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../config";
import {
  FileDown,
  PhoneCall,
  BarChart3,
  CheckCircle,
  DollarSign,
} from "lucide-react";
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
    gateway_cost: 0,
    salary_share: 0,
    admin_share: 0,
    gross_margin: 0,
  });

  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return;

    const addHoursUTC = (isoString, hours) => {
      const date = new Date(
        isoString.endsWith("Z") ? isoString : isoString + "Z"
      );
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

          const processed = data.map((row) => {
            const mco = Number(row.MCO || 0);
            const mkt = Number(row.marketing_spent || 0);
            const gateway = Number(row.gateway_cost || 0);
            const salary = Number(row.salary_share || 0);
            const admin = Number(row.admin_share || 0);

            return {
              ...row,
              gross_margin: mco - mkt - gateway - salary - admin,
            };
          });

          setSummaryData(processed);

          const totalRow = processed.find((r) => r.agent_name === "Total");
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

  const averages = (() => {
    if (!summaryData.length) return {};

    const validRows = summaryData.filter((r) => r.agent_name !== "Total");

    const avg = (field, transform) => {
      const values = validRows.map((row) =>
        transform ? transform(row) : Number(row[field]) || 0
      );
      return values.reduce((a, b) => a + b, 0) / values.length || 0;
    };

    return {
      marketing_spent: avg("marketing_spent"),
      MCO: avg("MCO"),
      bookings: avg("bookings"),
      gateway_cost: avg("gateway_cost"),
      conversion: avg(null, (r) =>
        r.total_calls > 0 ? (r.bookings / r.total_calls) * 100 : 0
      ),
      revenueRatio: avg(null, (r) =>
        r.marketing_spent > 0 ? r.MCO / r.marketing_spent : 0
      ),
    };
  })();

  const getColorClass = (value, average) => {
    if (value > average) return "text-green-400 font-semibold";
    if (value < average) return "text-red-400 font-semibold";
    return "text-yellow-300";
  };

  const exportToExcel = async () => {
    if (!summaryData.length) return alert("No data to export.");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Agent Summary");

    const headers = [
      "Agent Name",
      "Marketing Spent",
      "Calls",
      "Gateway Cost",
      "Salary",
      "Admin",
      "MCO",
      "Bookings",
      "Conversion (%)",
      "Revenue Ratio",
      "Gross Margin",
    ];

    sheet.addRow(headers);

    summaryData.forEach((row) => {
      const conversion =
        row.total_calls > 0
          ? ((row.bookings / row.total_calls) * 100).toFixed(2) + "%"
          : "0%";

      sheet.addRow([
        row.agent_name,
        row.marketing_spent,
        row.total_calls,
        row.gateway_cost,
        row.salary_share,
        row.admin_share,
        row.MCO,
        row.bookings,
        conversion,
        row.marketing_spent > 0
          ? (row.MCO / row.marketing_spent).toFixed(2)
          : "0.00",
        row.gross_margin,
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `AgentSummary_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

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
        case "gross_margin":
          return Number(row.gross_margin) || 0;
        default:
          return Number(row[field]) || 0;
      }
    };

    if (!sortField) return totalRow ? [...rest, totalRow] : rest;

    const sorted = [...rest].sort((a, b) => {
      const valA = getValue(a, sortField);
      const valB = getValue(b, sortField);
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return totalRow ? [...sorted, totalRow] : sorted;
  })();

  // Blue border classes
  const blue = "border-[#3da0ff]";
  const topBlue = "border-t-4 " + blue;
  const bottomBlue = "border-b-4 " + blue;
  const leftBlue = "border-l-4 " + blue;
  const rightBlue = "border-r-4 " + blue;

  // Identify last row for bottom border
  const lastRowIndex = sortedData.length - 1;

  return (
    <div className="rounded-2xl shadow-xl border border-[#1f3b58] bg-[#0B1E34]/60 backdrop-blur-lg p-5 sm:p-6 space-y-6">

      {/* TOP SUMMARY BOXES */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {[
            {
              label: "Total Marketing Spend",
              value: `$${(totals.marketing_spent || 0).toFixed(2)}`,
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
              value: `$${(totals.MCO || 0).toFixed(2)}`,
              icon: <BarChart3 size={22} />,
              gradient: "from-cyan-600 to-sky-700",
            },
            {
              label: "Total Bookings",
              value: totals.bookings,
              icon: <CheckCircle size={22} />,
              gradient: "from-purple-600 to-pink-700",
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`flex flex-col justify-between p-4 rounded-2xl border border-[#264766] shadow-lg bg-gradient-to-br ${card.gradient}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">
                  {card.label}
                </span>
                <div className="p-2 rounded-lg bg-white/10 text-white">
                  {card.icon}
                </div>
              </div>

              <div className="text-2xl font-bold mt-2 text-white">
                {card.value}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Table header */}
      <div className="flex justify-between items-center px-3 py-3 border-b border-gray-700">
        <h2 className="font-semibold text-lg text-white">
          Agent-wise Productivity & Expense Summary
        </h2>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-indigo-600 to-blue-500 text-white"
        >
          <FileDown size={16} /> Export to Excel
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-300 p-4">Loading summary...</div>
      ) : summaryData.length === 0 ? (
        <div className="text-gray-400 p-4 text-center">No data.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm text-gray-300">
            <thead>
              <tr className="bg-[#1e293b] text-gray-300 uppercase text-xs tracking-wide">

                {/* Regular headers */}
                <th className="p-3 text-center border-r border-gray-700">Agent Name</th>

                <th
                  className="p-3 text-center border-r border-gray-700 cursor-pointer"
                  onClick={() => handleSort("marketing_spent")}
                >
                  Marketing Spent
                  {sortField === "marketing_spent" && (
                    <span className="ml-1 text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>

                <th
                  className="p-3 text-center border-r border-gray-700 cursor-pointer"
                  onClick={() => handleSort("total_calls")}
                >
                  Calls
                  {sortField === "total_calls" && (
                    <span className="ml-1 text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>

                <th
                  className="p-3 text-center border-r border-gray-700 cursor-pointer"
                  onClick={() => handleSort("gateway_cost")}
                >
                  Gateway Cost
                  {sortField === "gateway_cost" && (
                    <span className="ml-1 text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>

                <th className="p-3 text-center border-r border-gray-700">Salary</th>
                <th className="p-3 text-center border-r border-gray-700">Admin</th>

                {/* ==============================
                    PERFORMANCE GROUP HEADERS
                   ============================== */}

                <th
                  onClick={() => handleSort("MCO")}
                  className={`p-3 text-center ${leftBlue} ${topBlue}`}
                >
                  MCO
                  {sortField === "MCO" && (
                    <span className="ml-1 text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>

                <th
                  onClick={() => handleSort("bookings")}
                  className={`p-3 text-center ${topBlue}`}
                >
                  Bookings
                  {sortField === "bookings" && (
                    <span className="ml-1 text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>

                <th
                  onClick={() => handleSort("conversion")}
                  className={`p-3 text-center ${topBlue}`}
                >
                  Conversion
                  {sortField === "conversion" && (
                    <span className="ml-1 text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>

                <th
                  onClick={() => handleSort("revenueRatio")}
                  className={`p-3 text-center ${topBlue}`}
                >
                  Revenue Ratio
                  {sortField === "revenueRatio" && (
                    <span className="ml-1 text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>

                <th
                  onClick={() => handleSort("gross_margin")}
                  className={`p-3 text-center ${topBlue} ${rightBlue}`}
                >
                  Gross Margin
                  {sortField === "gross_margin" && (
                    <span className="ml-1 text-[10px]">{sortOrder === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>

              </tr>
            </thead>

            <tbody>
              {sortedData.map((row, index) => {
                const isTotal = row.agent_name === "Total";
                const isLast = index === lastRowIndex;

                const conversion =
                  row.total_calls > 0
                    ? ((row.bookings / row.total_calls) * 100).toFixed(2)
                    : "0";

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

                    {/* Regular columns */}
                    <td className="p-3 text-center border-r border-gray-700">
                      {row.agent_name}
                    </td>

                    <td className={`p-3 text-center border-r border-gray-700 ${getColorClass(
                      row.marketing_spent,
                      averages.marketing_spent
                    )}`}>
                      ${row.marketing_spent.toFixed(2)}
                    </td>

                    <td className="p-3 text-center border-r border-gray-700">
                      {row.total_calls}
                    </td>

                    <td className={`p-3 text-center border-r border-gray-700 ${getColorClass(
                      row.gateway_cost,
                      averages.gateway_cost
                    )}`}>
                      ${row.gateway_cost.toFixed(2)}
                    </td>

                    <td className="p-3 text-center border-r border-gray-700">
                      ${row.salary_share.toFixed(2)}
                    </td>

                    <td className="p-3 text-center border-r border-gray-700">
                      ${row.admin_share.toFixed(2)}
                    </td>

                    {/* ==============================
                        PERFORMANCE GROUP CELLS
                        (only top row + last row have blue border)
                       ============================== */}

                    <td
                      className={`p-3 text-center ${leftBlue} ${
                        isLast ? bottomBlue : ""
                      } ${getColorClass(row.MCO, averages.MCO)}`}
                    >
                      ${row.MCO.toFixed(2)}
                    </td>

                    <td
                      className={`p-3 text-center ${
                        isLast ? bottomBlue : ""
                      } ${getColorClass(row.bookings, averages.bookings)}`}
                    >
                      {row.bookings}
                    </td>

                    <td
                      className={`p-3 text-center ${
                        isLast ? bottomBlue : ""
                      } ${getColorClass(parseFloat(conversion), averages.conversion)}`}
                    >
                      {conversion}%
                    </td>

                    <td
                      className={`p-3 text-center ${
                        isLast ? bottomBlue : ""
                      } ${getColorClass(parseFloat(revenueRatio), averages.revenueRatio)}`}
                    >
                      {revenueRatio}
                    </td>

                    <td
                      className={`p-3 text-center ${rightBlue} ${
                        isLast ? bottomBlue : ""
                      } ${row.gross_margin >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      ${row.gross_margin.toFixed(2)}
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
