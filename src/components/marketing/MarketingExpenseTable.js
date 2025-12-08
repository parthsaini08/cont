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

const MarketingExpenseTable = ({ dateRange }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [totals, setTotals] = useState({
    marketing_spent: 0,
    total_calls: 0,
    MCO: 0,
    bookings: 0,
  });

  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  // ========================= FETCH DATA =========================
  useEffect(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return;

    const addHoursUTC = (isoString, hours) => {
      const date = new Date(
        isoString.endsWith("Z") ? isoString : isoString + "Z"
      );
      date.setUTCHours(date.getUTCHours() + hours);
      return date.toISOString();
    };

    const start = addHoursUTC(dateRange.startDate, 5);
    const end = addHoursUTC(dateRange.endDate, 5);

    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${BASE_URL}get_marketing_summary.php?startDate=${encodeURIComponent(
            start
          )}&endDate=${encodeURIComponent(end)}`,
          { credentials: "include" }
        );

        const json = await res.json();

        if (json.status === "success") {
          setSummaryData(json.summary || []);

          const total = json.summary?.find((r) => r.queue_name === "Total");
          if (total) setTotals(total);
        } else {
          setSummaryData([]);
        }
      } catch (err) {
        console.error("Summary fetch error:", err);
        setSummaryData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [dateRange]);

  // ========================= AVERAGES =========================
  const averages = (() => {
    if (!summaryData.length) return {};

    const valid = summaryData.filter((r) => r.queue_name !== "Total");

    const avg = (fn) =>
      valid.reduce((a, b) => a + fn(b), 0) / valid.length || 0;

    return {
      marketing_spent: avg((r) => r.marketing_spent),
      callCost: avg((r) =>
        r.total_calls > 0 ? r.marketing_spent / r.total_calls : 0
      ),
      MCO: avg((r) => r.MCO),
      bookings: avg((r) => r.bookings),
      conversion: avg((r) =>
        r.total_calls > 0 ? (r.bookings / r.total_calls) * 100 : 0
      ),
      revenueRatio: avg((r) =>
        r.marketing_spent > 0 ? r.MCO / r.marketing_spent : 0
      ),
    };
  })();

  // ========================= COLOR HELPERS =========================
  const getColorNormal = (value, avg) => {
    if (value > avg) return "text-green-400 font-semibold";
    if (value < avg) return "text-red-400 font-semibold";
    return "text-yellow-300 font-medium";
  };

  const getColorReverse = (value, avg) => {
    if (value > avg) return "text-red-400 font-semibold";
    if (value < avg) return "text-green-400 font-semibold";
    return "text-yellow-300 font-medium";
  };

  // ========================= SORTING =========================
  const handleSort = (field) => {
    if (sortField === field)
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedData = (() => {
    const total = summaryData.find((r) => r.queue_name === "Total");
    const rows = summaryData.filter((r) => r.queue_name !== "Total");

    const getValue = (row) => {
      switch (sortField) {
        case "callCost":
          return row.total_calls
            ? row.marketing_spent / row.total_calls
            : 0;
        case "conversion":
          return row.total_calls
            ? (row.bookings / row.total_calls) * 100
            : 0;
        case "revenueRatio":
          return row.marketing_spent
            ? row.MCO / row.marketing_spent
            : 0;
        default:
          return Number(row[sortField]) || 0;
      }
    };

    if (!sortField) return total ? [...rows, total] : rows;

    const sorted = rows.sort((a, b) =>
      sortOrder === "asc"
        ? getValue(a) - getValue(b)
        : getValue(b) - getValue(a)
    );

    return total ? [...sorted, total] : sorted;
  })();

  // ========================= EXCEL EXPORT =========================
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Summary");

    sheet.addRow([
      "Queue",
      "Marketing Spent",
      "Calls",
      "Call Cost",
      "MCO",
      "Bookings",
      "Conversion (%)",
      "Revenue Ratio",
    ]);

    summaryData.forEach((r) => {
      sheet.addRow([
        r.queue_name,
        r.marketing_spent,
        r.total_calls,
        r.total_calls ? r.marketing_spent / r.total_calls : 0,
        r.MCO,
        r.bookings,
        r.total_calls ? (r.bookings / r.total_calls) * 100 : 0,
        r.marketing_spent ? r.MCO / r.marketing_spent : 0,
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "MarketingSummary.xlsx");
  };

  // ===== BLUE BORDER CLASSES =====
  const BLUE = "border-[#3da0ff]";
  const blueTop = "border-t-4 " + BLUE;
  const blueBottom = "border-b-4 " + BLUE;
  const blueLeft = "border-l-4 " + BLUE;
  const blueRight = "border-r-4 " + BLUE;

  // ========================= UI START =========================
  return (
    <div className="rounded-2xl shadow-xl border border-[#1f3b58] bg-[#0B1E34]/60 p-5 space-y-6">

      {/* SUMMARY CARDS */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
            className={`p-4 rounded-2xl border border-[#264766] shadow-lg bg-gradient-to-br ${card.gradient}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-200">{card.label}</span>
              <div className="p-2 bg-white/10 rounded-lg">{card.icon}</div>
            </div>

            <div className="text-2xl font-bold text-white mt-2">
              {card.value}
            </div>
          </div>
        ))}
      </motion.div>

      {/* ========================= TABLE ========================= */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm text-gray-300">
          <thead>
            <tr className="bg-[#1e293b] uppercase text-xs tracking-wide">

              {/* Normal Columns */}
              <th className="p-3 text-center border-r border-gray-700">Queue</th>

              <th
                className="p-3 text-center border-r border-gray-700 cursor-pointer"
                onClick={() => handleSort("marketing_spent")}
              >
                Spent
                {sortField === "marketing_spent" && (
                  <span className="ml-1 text-[10px]">
                    {sortOrder === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>

              <th
                className="p-3 text-center border-r border-gray-700 cursor-pointer"
                onClick={() => handleSort("total_calls")}
              >
                Calls
                {sortField === "total_calls" && (
                  <span className="ml-1 text-[10px]">
                    {sortOrder === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>

              <th
                className="p-3 text-center border-r border-gray-700 cursor-pointer"
                onClick={() => handleSort("callCost")}
              >
                Call Cost
                {sortField === "callCost" && (
                  <span className="ml-1 text-[10px]">
                    {sortOrder === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>

              {/* ========================= BLUE TOP HEADERS ========================= */}

              <th
                onClick={() => handleSort("MCO")}
                className={`p-3 text-center ${blueLeft} ${blueTop}`}
              >
                MCO
                {sortField === "MCO" && (
                  <span className="ml-1 text-[10px]">
                    {sortOrder === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>

              <th
                onClick={() => handleSort("bookings")}
                className={`p-3 text-center ${blueTop}`}
              >
                Bookings
                {sortField === "bookings" && (
                  <span className="ml-1 text-[10px]">
                    {sortOrder === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>

              <th
                onClick={() => handleSort("conversion")}
                className={`p-3 text-center ${blueTop}`}
              >
                Conversion
                {sortField === "conversion" && (
                  <span className="ml-1 text-[10px]">
                    {sortOrder === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>

              <th
                onClick={() => handleSort("revenueRatio")}
                className={`p-3 text-center ${blueTop} ${blueRight}`}
              >
                Revenue Ratio
                {sortField === "revenueRatio" && (
                  <span className="ml-1 text-[10px]">
                    {sortOrder === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedData.map((row, index) => {
              const isLast = index === sortedData.length - 1;

              const callCost = row.total_calls
                ? row.marketing_spent / row.total_calls
                : 0;

              const conversion = row.total_calls
                ? (row.bookings / row.total_calls) * 100
                : 0;

              const revenueRatio = row.marketing_spent
                ? row.MCO / row.marketing_spent
                : 0;

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-700 ${
                    row.queue_name === "Total"
                      ? "bg-indigo-900 font-bold text-white"
                      : "hover:bg-[#1e293b]"
                  }`}
                >
                  {/* Normal columns */}
                  <td className="p-3 text-center border-r border-gray-700">
                    {row.queue_name}
                  </td>

                  <td
                    className={`p-3 text-center border-r border-gray-700 ${getColorNormal(
                      row.marketing_spent,
                      averages.marketing_spent
                    )}`}
                  >
                    ${row.marketing_spent.toFixed(2)}
                  </td>

                  <td className="p-3 text-center border-r border-gray-700">
                    {row.total_calls}
                  </td>

                  <td
                    className={`p-3 text-center border-r border-gray-700 ${getColorReverse(
                      callCost,
                      averages.callCost
                    )}`}
                  >
                    {callCost.toFixed(2)}
                  </td>

                  {/* ========================= BLUE BORDER BLOCK ========================= */}

                  <td
                    className={`p-3 text-center ${blueLeft} ${
                      isLast ? blueBottom : ""
                    } ${getColorNormal(row.MCO, averages.MCO)}`}
                  >
                    ${row.MCO.toFixed(2)}
                  </td>

                  <td
                    className={`p-3 text-center ${
                      isLast ? blueBottom : ""
                    } ${getColorNormal(row.bookings, averages.bookings)}`}
                  >
                    {row.bookings}
                  </td>

                  <td
                    className={`p-3 text-center ${
                      isLast ? blueBottom : ""
                    } ${getColorNormal(conversion, averages.conversion)}`}
                  >
                    {conversion.toFixed(2)}%
                  </td>

                  <td
                    className={`p-3 text-center ${blueRight} ${
                      isLast ? blueBottom : ""
                    } ${getColorNormal(
                      revenueRatio,
                      averages.revenueRatio
                    )}`}
                  >
                    {revenueRatio.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketingExpenseTable;
