import React, { useEffect, useState } from "react";
import { BASE_URL } from "../../config";
import { FileDown, DollarSign, PhoneCall, BarChart3, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";
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
          `${BASE_URL}get_marketing_summary.php?startDate=${encodeURIComponent(
            startDateAdjusted
          )}&endDate=${encodeURIComponent(endDateAdjusted)}`,
          { credentials: "include" }
        );

        const json = await res.json();
        if (json.status === "success") {
          const data = json.summary || [];
          setSummaryData(data);
          const totalRow = data.find((r) => r.queue_name === "Total");
          if (totalRow) setTotals(totalRow);
        } else {
          setSummaryData([]);
        }
      } catch (err) {
        console.error("Failed to fetch marketing summary:", err);
        setSummaryData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [dateRange]);

  // ✅ Export to Excel
  const exportToExcel = () => {
    if (!summaryData.length) return alert("No data to export.");
    const formatted = summaryData.map((row) => ({
      "Queue Name": row.queue_name,
      "Marketing Spent": row.marketing_spent,
      Calls: row.total_calls,
      "Call Cost":
        row.total_calls > 0
          ? (row.marketing_spent / row.total_calls).toFixed(2)
          : "0.00",
      MCO: row.MCO?.toFixed(2) || "0.00",
      Bookings: row.bookings || 0,
      "Conversion (%)":
        row.total_calls > 0
          ? ((row.bookings / row.total_calls) * 100).toFixed(2) + "%"
          : "0%",
      "Revenue Ratio":
        row.marketing_spent > 0
          ? (row.MCO / row.marketing_spent).toFixed(2)
          : "0.00",
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marketing Summary");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      `MarketingSummary_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // ✅ Summary Cards Data
  const summaryCards = [
    {
      label: "Total Marketing Spend",
      value: `$${totals.marketing_spent?.toFixed(2) || "0.00"}`,
      icon: <DollarSign size={22} />,
      gradient: "from-green-400 to-emerald-500",
    },
    {
      label: "Total Calls",
      value: totals.total_calls || 0,
      icon: <PhoneCall size={22} />,
      gradient: "from-blue-400 to-indigo-500",
    },
    {
      label: "Total MCO",
      value: `$${totals.MCO?.toFixed(2) || "0.00"}`,
      icon: <BarChart3 size={22} />,
      gradient: "from-cyan-400 to-sky-500",
    },
    {
      label: "Total Bookings",
      value: totals.bookings || 0,
      icon: <CheckCircle size={22} />,
      gradient: "from-purple-400 to-pink-500",
    },
  ];

  return (
    <div className="rounded-2xl shadow-xl border border-[#1f3b58] bg-[#0B1E34]/60 backdrop-blur-lg p-5 sm:p-6 space-y-6">
      {/* ✅ Top Summary Cards */}
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

      {/* ✅ Table Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 sm:px-4 py-3 border-b border-gray-700 gap-3">
        <h2 className="font-semibold text-base sm:text-lg text-white">
          Marketing Expense Summary
        </h2>

        <button
          onClick={exportToExcel}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-sm bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 shadow-md text-white"
        >
          <FileDown size={16} /> Export to Excel
        </button>
      </div>

      {/* ✅ Table Section */}
      {isLoading ? (
        <div className="text-gray-300 p-4">Loading summary...</div>
      ) : summaryData.length === 0 ? (
        <div className="text-gray-400 p-4 text-sm text-center">
          No marketing summary available.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm text-gray-300 min-w-[850px]">
            <thead>
              <tr className="bg-[#1e293b] text-gray-300 uppercase text-[10px] sm:text-xs tracking-wide">
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Queue</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Marketing Spent</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Calls</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Call Cost</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">MCO</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Bookings</th>
                <th className="p-2 sm:p-3 text-center border-r border-gray-700">Conversion</th>
                <th className="p-2 sm:p-3 text-center">Revenue Ratio</th>
              </tr>
            </thead>

            <tbody>
              {summaryData.map((row, index) => {
                const isTotal = row.queue_name === "Total";
                const callCost =
                  row.total_calls > 0
                    ? (row.marketing_spent / row.total_calls).toFixed(2)
                    : "0.00";
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
                      {row.queue_name || "-"}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.marketing_spent?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.total_calls}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {callCost}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.MCO?.toFixed(2) || "0.00"}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {row.bookings || 0}
                    </td>
                    <td className="p-2 sm:p-3 text-center border-r border-gray-700">
                      {conversion}
                    </td>
                    <td className="p-2 sm:p-3 text-center">{revenueRatio}</td>
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

export default MarketingExpenseTable;
