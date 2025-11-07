import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Skeleton } from "./ui/Skeleton";
import { BASE_URL } from "../config";

const intervalOptions = [
  { label: "Auto (By Hour)", value: "hour" },
  { label: "By Minute", value: "minute" },
  { label: "By Day", value: "day" },
];

export default function TimelineChart({ filter = "month" }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interval, setInterval] = useState("hour");

  const fetchData = async (interval) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}api_timeline.php?filter=${filter}&interval=${interval}`,
        { credentials: "include" }
      );
      const json = await res.json();

      if (Array.isArray(json.chartData)) {
        setData(
          json.chartData.map((item) => ({
            label: item[interval] || "",
            calls: item.calls || 0,
          }))
        );
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching timeline data:", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(interval);
  }, [interval, filter]);

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg md:text-xl font-bold text-white">
            📊 Timeline
          </CardTitle>
          <select
            aria-label="Select interval"
            className="bg-slate-800 border border-slate-600 text-xs md:text-sm text-white rounded px-2 py-1 md:px-3 md:py-1 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            {intervalOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="label"
                  stroke="#9CA3AF"
                  tick={{ fill: "#D1D5DB", fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={10}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: "#D1D5DB", fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    borderRadius: "8px",
                    border: "1px solid #374151",
                    color: "#F9FAFB",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Legend
                  wrapperStyle={{
                    color: "#E5E7EB",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="calls"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={window.innerWidth < 640 ? 14 : 20}
                  animationDuration={700}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
