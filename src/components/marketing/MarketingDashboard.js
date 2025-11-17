import React, { useState } from "react";
import MarketingExpenseTable from "./MarketingExpenseTable";
import AgentExpenseTable from "./AgentExpenseTable"; // ✅ New component
import DashboardHeader from "../DashboardHeader";
import FilterButton from "../FilterButton";
import { LineChart, Users, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

function ReportsPage() {
  // ✅ Get current NY date & time
const getNYDateTime = (options = {}) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    ...options,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((p) => [p.type, p.value])
  );

  return parts;
};

// ✅ Start of this month (NY Timezone)
const getNYMonthStart = () => {
  const now = getNYDateTime({
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return `${now.year}-${now.month}-01T00:00:00`;
};

// ✅ Current NY datetime
const getNYNow = () => {
  const now = getNYDateTime({
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `${now.year}-${now.month}-${now.day}T${now.hour}:${now.minute}:${now.second}`;
};

const [dateRange, setDateRange] = useState({
  startDate: getNYMonthStart(),  // <-- First of the month
  endDate: getNYNow(),           // <-- Current NY datetime
});


  // ✅ View Toggle (Queue / Agent)
  const [viewMode, setViewMode] = useState("queue");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#0B1E34] to-[#132F4C] text-white">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* ✅ Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500/40 to-cyan-400/30 rounded-2xl backdrop-blur-md shadow-md">
              {viewMode === "queue" ? (
                <BarChart3 size={28} className="text-cyan-300" />
              ) : (
                <Users size={28} className="text-cyan-300" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                {viewMode === "queue"
                  ? "Productivity Summary (Queue-wise)"
                  : "Productivity Summary (Agent-wise)"}
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                {viewMode === "queue"
                  ? "Analyze total marketing costs, conversions, and performance by queue."
                  : "Track marketing cost distribution and performance per agent."}
              </p>
            </div>
          </div>

          {/* ✅ Filter + Toggle Buttons */}
          <div className="mt-5 sm:mt-0 flex flex-wrap gap-3 items-center">
            <FilterButton
              dateRange={dateRange}
              onApply={(newRange) =>
                setDateRange({
                  startDate: newRange.startDate,
                  endDate: newRange.endDate,
                })
              }
            />

            <button
              onClick={() =>
                setViewMode((prev) => (prev === "queue" ? "agent" : "queue"))
              }
              className="px-4 py-2 mb-4 text-md rounded-lg border border-white text-white bg-[#4d5dd1] hover:bg-cyan-600/20 transition-all"
            >
              {viewMode === "queue" ? "Switch to Agent View" : "Switch to Queue View"}
            </button>
          </div>
        </motion.div>

        {/* ✅ Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-[#0B1E34]/70 border border-[#1e3455] rounded-2xl shadow-2xl p-5 sm:p-6 backdrop-blur-sm hover:border-[#2d4d73] transition-all duration-300"
        >
          {viewMode === "queue" ? (
            <MarketingExpenseTable dateRange={dateRange} />
          ) : (
            <AgentExpenseTable dateRange={dateRange} />
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default ReportsPage;
