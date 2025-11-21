import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  PhoneCall,
  BarChart3,
  DollarSign,
  CheckCircle,
  Gauge,
  TrendingUp,
} from "lucide-react";
import { BASE_URL } from "../config";

const addHoursUTC = (isoString, hours) => {
  if (!isoString) return "";
  const date = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString();
};

export default function AgentPerformanceDashboard() {
  const [data, setData] = useState(null);

  const getDates = () => {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return {
      startAdjusted: addHoursUTC(start.toISOString(), 5),
      endAdjusted: addHoursUTC(now.toISOString(), 5),
    };
  };

  useEffect(() => {
    const { startAdjusted, endAdjusted } = getDates();

    fetch(
      `${BASE_URL}get_agent_stats.php?startDate=${encodeURIComponent(
        startAdjusted
      )}&endDate=${encodeURIComponent(endAdjusted)}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((json) => setData(json.data));
  }, []);

  if (!data) return null;

  const {
    agent_name,
    marketing_spent,
    total_calls,
    MCO,
    bookings,
    conversion,
    revenue_ratio,
    rank,
    total_agents,
  } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        w-full rounded-xl 
        border border-[#1f3b58] 
        bg-[#0B1E34]/70 backdrop-blur-xl 
        shadow-[0_0_25px_rgba(0,0,0,0.4)]
        p-6
      "
    >
      <h2 className="text-white font-semibold mb-5 text-sm flex items-center gap-2">
        📊 {agent_name}'s KPI Overview
      </h2>

      {/* ================= ADMIN VIEW (3 + 3) ================= */}
      {rank === null ? (
        <>
          {/* ROW 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">

            <KPI
              label="Marketing Spend"
              value={`$${marketing_spent}`}
              color="from-[#FF6B6B] via-[#FF8E53] to-[#FFBB33]"
              icon={<DollarSign size={18} />}
            />

            <KPI
              label="Total Calls"
              value={total_calls}
              color="from-[#3A7BD5] via-[#3A6073] to-[#2A2F4F]"
              icon={<PhoneCall size={18} />}
            />

            <KPI
              label="Bookings"
              value={bookings}
              color="from-[#16A34A] via-[#22C55E] to-[#86EFAC]"
              icon={<CheckCircle size={18} />}
            />
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            <KPI
              label="Total MCO"
              value={`$${MCO}`}
              color="from-[#06B6D4] via-[#3B82F6] to-[#60A5FA]"
              icon={<BarChart3 size={18} />}
            />

            <KPI
              label="Conversion"
              value={`${conversion}%`}
              color="from-[#FACC15] via-[#F59E0B] to-[#F97316]"
              icon={<Gauge size={18} />}
            />

            <KPI
              label="Revenue Ratio"
              value={revenue_ratio}
              color="from-[#8B5CF6] via-[#D946EF] to-[#EC4899]"
              icon={<TrendingUp size={18} />}
            />
          </div>
        </>
      ) : (
        /* ================= AGENT VIEW (4 + 3) ================= */
        <>
          {/* ROW 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-6">
            <KPI
              label="Marketing Spend"
              value={`$${marketing_spent}`}
              color="from-[#FF6B6B] via-[#FF8E53] to-[#FFBB33]"
              icon={<DollarSign size={18} />}
            />

            <KPI
              label="Total Calls"
              value={total_calls}
              color="from-[#3A7BD5] via-[#3A6073] to-[#2A2F4F]"
              icon={<PhoneCall size={18} />}
            />

            <KPI
              label="Bookings"
              value={bookings}
              color="from-[#16A34A] via-[#22C55E] to-[#86EFAC]"
              icon={<CheckCircle size={18} />}
            />

            <KPI
              label="Total MCO"
              value={`$${MCO}`}
              color="from-[#06B6D4] via-[#3B82F6] to-[#60A5FA]"
              icon={<BarChart3 size={18} />}
            />
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5">
            <KPI
              label="Conversion"
              value={`${conversion}%`}
              color="from-[#FACC15] via-[#F59E0B] to-[#F97316]"
              icon={<Gauge size={18} />}
            />

            <KPI
              label="Revenue Ratio"
              value={revenue_ratio}
              color="from-[#8B5CF6] via-[#D946EF] to-[#EC4899]"
              icon={<TrendingUp size={18} />}
            />

            {/* AGENT ONLY */}
            <KPI
              label="Rank"
              value={`#${rank}`}
              color="from-[#FB923C] via-[#F97316] to-[#EF4444]"
              icon={<TrendingUp size={18} />}
            />
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ====================================================== */
/* 🔥 KPI BOX WITH PREMIUM GRADIENTS */
/* ====================================================== */
const KPI = ({ label, value, color, icon }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className={`
      rounded-xl p-4 
      bg-gradient-to-br ${color}
      text-white shadow-lg 
      flex flex-col gap-1
    `}
  >
    <div className="flex justify-between items-center">
      <span className="text-xs">{label}</span>
      <div className="p-2 bg-black/20 rounded-md">{icon}</div>
    </div>

    <span className="text-2xl font-bold">{value}</span>
  </motion.div>
);
