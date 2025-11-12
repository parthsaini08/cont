import React, { useState } from "react";
import MarketingExpenseTable from "./MarketingExpenseTable";
import DashboardHeader from "../DashboardHeader";
import FilterButton from "../FilterButton";
import { LineChart } from "lucide-react"; // nice analytics icon
import { motion } from "framer-motion"; // subtle fade-in animation

function ReportsPage() {
  // ✅ Get current NY time
  const getNYNow = () => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date()).map((p) => [p.type, p.value])
    );
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  };

  // ✅ Get yesterday (midnight NY)
  const getNYYesterday = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(now).map((p) => [p.type, p.value])
    );
    return `${parts.year}-${parts.month}-${parts.day}T00:00:00`;
  };

  const [dateRange, setDateRange] = useState({
    startDate: getNYYesterday(),
    endDate: getNYNow(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0B1E34] to-[#132F4C] text-white">
      {/* ✅ Top Header */}
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* ✅ Section Header with Gradient Title */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500/40 to-cyan-400/30 rounded-2xl backdrop-blur-md shadow-md">
              <LineChart size={28} className="text-cyan-300" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Marketing Expense Summary
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Analyze total marketing costs, conversions, and performance by queue.
              </p>
            </div>
          </div>

          <div className="mt-5 sm:mt-0 flex items-center gap-3">
            <FilterButton
              dateRange={dateRange}
              onApply={(newRange) =>
                setDateRange({
                  startDate: newRange.startDate,
                  endDate: newRange.endDate,
                })
              }
            />
          </div>
        </motion.div>

        

        {/* ✅ Expense Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-[#0B1E34]/70 border border-[#1e3455] rounded-2xl shadow-2xl p-5 sm:p-6 backdrop-blur-sm hover:border-[#2d4d73] transition-all duration-300"
        >
          <MarketingExpenseTable dateRange={dateRange} />
        </motion.div>
      </main>
    </div>
  );
}

export default ReportsPage;
