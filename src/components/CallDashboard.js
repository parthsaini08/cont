import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

export default function CallDashboard() {
  const [agentData, setAgentData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [queueData, setQueueData] = useState([]);
  const [queueCallData, setQueueCallData] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/api/analytics.php?type=agent").then(res => setAgentData(res.data));
    axios.get("http://localhost:8000/api/analytics.php?type=trend").then(res => setTrendData(res.data));
    axios.get("http://localhost:8000/api/analytics.php?type=queue").then(res => setQueueData(res.data));
    axios.get("http://localhost:8000/api/analytics.php?type=queue_calls").then(res => setQueueCallData(res.data));

}, []);

  const COLORS = ["#4CAF50", "#F44336", "#2196F3", "#FFC107", "#9C27B0"];

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Agent Conversion Chart */}
      <div className="bg-white p-4 shadow-md rounded-2xl">
        <h2 className="text-lg font-semibold mb-2">Conversions per Agent</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={agentData}>
            <XAxis dataKey="agent_name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="converted_calls" stackId="a" fill="#4CAF50" name="Converted" />
            <Bar dataKey="not_converted_calls" stackId="a" fill="#F44336" name="Not Converted" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Trend */}
      <div className="bg-white p-4 shadow-md rounded-2xl">
        <h2 className="text-lg font-semibold mb-2">Daily Conversion Trend</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="call_date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="conversion_rate" stroke="#2196F3" name="Conversion Rate (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 🧩 Total Calls by Queue */}
        <div className="bg-white p-4 shadow-md rounded-2xl md:col-span-2">
        <h2 className="text-lg font-semibold mb-2">Total Calls by Queue</h2>
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={queueCallData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="queue_name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total_calls" fill="#2196F3" name="Total Calls" />
            </BarChart>
        </ResponsiveContainer>
        </div>

      

      {/* Queue Conversion Pie */}
      <div className="bg-white p-4 shadow-md rounded-2xl md:col-span-2">
        <h2 className="text-lg font-semibold mb-2">Conversion Rate by Queue</h2>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={queueData}
              dataKey="conversion_rate"
              nameKey="queue_name"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label
            >
              {queueData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
