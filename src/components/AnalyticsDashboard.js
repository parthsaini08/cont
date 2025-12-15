import React, { useEffect, useState } from "react";
import { BASE_URL } from "../config";
import FilterButton from "../components/FilterButton";
import { motion } from "framer-motion";
import { BarChart3, DollarSign, Target, Users, TrendingUp } from "lucide-react";

/* ===================== Helpers ===================== */
const getNYDateTime = (options = {}) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    ...options,
  });
  return Object.fromEntries(formatter.formatToParts(new Date()).map((p) => [p.type, p.value]));
};
const getNYMonthStart = () => {
  const now = getNYDateTime({ year: "numeric", month: "2-digit" });
  return `${now.year}-${now.month}-01T00:00:00`;
};
const getNYNow = () => {
  const now = getNYDateTime({
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  return `${now.year}-${now.month}-${now.day}T${now.hour}:${now.minute}:${now.second}`;
};
const addHoursUTC = (isoString, hours) => {
  const date = new Date(isoString.endsWith("Z") ? isoString : isoString + "Z");
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString();
};
const fmt = (v) => {
  if (v === null || v === undefined || v === "") return "0";
  const n = Number(v);
  if (Number.isNaN(n)) return "0";
  return n >= 1000 ? n.toLocaleString() : (n % 1 === 0 ? n.toFixed(0) : n.toFixed(2));
};

/* ===================== Dashboard Component ===================== */
const Dashboard = () => {
  const [dateRange, setDateRange] = useState({ startDate: getNYMonthStart(), endDate: getNYNow() });
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const startDateAdjusted = addHoursUTC(dateRange.startDate, 5);
        const endDateAdjusted = addHoursUTC(dateRange.endDate, 5);
        const res = await fetch(
          `${BASE_URL}analyticsdashboard.php?startDate=${encodeURIComponent(startDateAdjusted)}&endDate=${encodeURIComponent(endDateAdjusted)}`,
          { credentials: "include" }
        );
        const json = await res.json();
        if (json?.status === "success") setDashboard(json);
        else {
          console.error("dashboard API error:", json);
          setDashboard(null);
        }
      } catch (err) {
        console.error("fetch failed:", err);
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [dateRange]);

  const kpis = dashboard?.kpis || {};
  const expenses = dashboard?.expenses || {};
  const topAgentsMco = dashboard?.top_agents_mco || [];
  const topAgentsConv = dashboard?.top_agents_conversion || [];
  const topAgentsRevRatio = dashboard?.top_agents_revenue_ratio || [];
  const topAgentsGm = dashboard?.top_agents_gross_margin || [];
  const topCampMco = dashboard?.top_campaigns_mco || [];
  const topCampConv = dashboard?.top_campaigns_conversion || [];
  const topCampRev = dashboard?.top_campaigns_revenue_ratio || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020617] via-[#07182e] to-[#0a2340] text-white">
      <main className="w-[90%] mx-auto px-6 py-8 space-y-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#081126] border border-cyan-600/25 shadow-lg">
              <BarChart3 size={26} className="text-cyan-300" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">Analytics Dashboard</h1>
              <p className="text-sm text-indigo-200/60">Marketing, revenue & performance insights</p>
            </div>
          </div>

          <div>
            <FilterButton dateRange={dateRange} onApply={(r) => setDateRange({ startDate: r.startDate, endDate: r.endDate })} />
          </div>
        </motion.div>

        {/* KPIs */}
        <Section title="Key Performance Indicators">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading KPIs…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard label="Total MCO" value={`$${fmt(kpis.totalMco)}`} icon={<DollarSign />} accent="cyan" />
              <KpiCard label="Marketing Spend" value={`$${fmt(kpis.totalMarketing)}`} icon={<TrendingUp />} accent="indigo" />
              <KpiCard label="Conversion" value={`${fmt(kpis.conversionRatio)}%`} icon={<Target />} accent="emerald" />
              <KpiCard label="Revenue Ratio" value={fmt(kpis.revenueRatio)} icon={<Users />} accent="violet" />
            </div>
          )}
        </Section>

        {/* Top Performers (Option A, Style 1) */}
        <Section title="Top Performers">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Agents Column */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-300 mb-4 border-b border-cyan-600/20 pb-2">Agents</h3>
              <div className="space-y-6">
                <SharpList title="Top Agents — By MCO" data={topAgentsMco} label="mco" isMoney />
                <SharpList title="Top Agents — By Gross Margin" data={topAgentsGm} label="gross_margin" isMoney />
                <SharpList title="Top Agents — By Conversion %" data={topAgentsConv} label="conversion" suffix="%" />
                <SharpList title="Top Agents — By Revenue Ratio" data={topAgentsRevRatio} label="rev_ratio" />
              </div>
            </div>

            {/* Campaigns Column */}
            <div>
              <h3 className="text-lg font-semibold text-cyan-300 mb-4 border-b border-cyan-600/20 pb-2">Campaigns</h3>
              <div className="space-y-6">
                <SharpList title="Top Campaigns — By MCO" data={topCampMco} label="mco" isMoney isCampaign />
                <SharpList title="Top Campaigns — By Conversion %" data={topCampConv} label="conversion" suffix="%" isCampaign />
                <SharpList title="Top Campaigns — By Revenue Ratio" data={topCampRev} label="rev_ratio" isCampaign />
              </div>
            </div>
          </div>
        </Section>

        {/* Expenses */}
        <Section title="Expense Breakdown">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ExpenseCard title="Tools Cost" value={expenses.tool ?? expenses.toolCost} />
            <ExpenseCard title="Revenue Gen Cost" value={expenses.rev ?? expenses.revGenCost} />
            <ExpenseCard title="Admin Cost" value={expenses.admin ?? expenses.adminCost} />
          </div>
        </Section>
      </main>
    </div>
  );
};

/* ===================== Subcomponents ===================== */

const Section = ({ title, children }) => (
  <div className="bg-[#0b1e34]/70 backdrop-blur-md rounded-2xl border border-cyan-600/10 shadow-2xl p-6">
    <h2 className="text-lg font-bold text-cyan-300 mb-4 text-center">{title}</h2>
    {children}
  </div>
);

const KpiCard = ({ label, value, icon }) => {
  return (
    <div className="rounded-xl bg-[#0f172a]/60 backdrop-blur-md p-5 border border-white/10 shadow-lg">
      <div className="flex justify-between items-center text-sm text-gray-300">
        <span>{label}</span>
        <span className="text-gray-400">{icon}</span>
      </div>

      <div className="text-3xl font-bold mt-3 text-white">
        {value}
      </div>
    </div>
  );
};


/* SharpList = style 1 premium block */
const SharpList = ({ title, data, label, suffix = "", isMoney = false, isCampaign = false }) => {
  return (
    <div className="rounded-xl bg-[#071226] border border-cyan-700/30 shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-cyan-300">{title}</div>
        <div className="text-xs text-blue-200/60">Top 3</div>
      </div>

      {(!Array.isArray(data) || data.length === 0) ? (
        <div className="text-gray-400 text-sm text-center py-3">No data</div>
      ) : (
        data.map((it, i) => {
          // normalize label key if backend returns slightly different keys
          const key = label in it ? label : (label === "gross_margin" && it.gross_margin !== undefined ? "gross_margin" : Object.keys(it).find(k => k !== (isCampaign ? "campaign" : "agent")));
          const raw = it[label] ?? it[key] ?? 0;
          const shown = isMoney ? `$${fmt(raw)}` : suffix ? `${raw}${suffix}` : fmt(raw);

          return (
            <div key={i} className="flex items-center justify-between py-2 border-t border-cyan-700/10">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center rounded-md ${i === 0 ? "bg-cyan-500/20 text-cyan-300" : i === 1 ? "bg-cyan-400/12 text-cyan-200" : "bg-cyan-400/6 text-cyan-100"} text-sm font-semibold`}>
                  #{i + 1}
                </div>
                <div className="text-sm text-gray-100">
                  {isCampaign ? (it.campaign ?? "-") : (it.agent ?? "-")}
                </div>
              </div>
              <div className="font-semibold text-white">{shown}</div>
            </div>
          );
        })
      )}
    </div>
  );
};

const ExpenseCard = ({ title, value }) => (
  <div className="rounded-xl bg-[#071226] border border-rose-600/8 p-4 shadow-md text-center">
    <div className="text-sm text-indigo-200/70">{title}</div>
    <div className="text-2xl font-bold mt-3 text-rose-300">${fmt(value ?? 0)}</div>
  </div>
);

export default Dashboard;
