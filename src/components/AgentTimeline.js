// import React, { useState } from "react";
// import { motion } from "framer-motion";

// // ============================================
// // Dummy US Agents Data (Client Demo)
// // ============================================
// const agents = [
//   {
//     id: 1,
//     name: "John Miller",
//     status: "available",
//     timeline: [
//       { start: "09:00", end: "10:15", type: "available" },
//       { start: "10:15", end: "11:00", type: "busy" },
//       { start: "11:00", end: "13:00", type: "available" },
//       { start: "13:00", end: "14:00", type: "offline" },
//       { start: "14:00", end: "18:00", type: "busy" },
//     ],
//   },
//   { id: 2, name: "Sarah Johnson", status: "busy", timeline: [
//       { start: "09:00", end: "11:30", type: "busy" },
//       { start: "11:30", end: "12:30", type: "available" },
//       { start: "12:30", end: "18:00", type: "busy" },
//     ]},
//   { id: 3, name: "Michael Brown", status: "available", timeline: [
//       { start: "09:00", end: "12:00", type: "available" },
//       { start: "12:00", end: "13:00", type: "busy" },
//       { start: "13:00", end: "18:00", type: "available" },
//     ]},
//   { id: 4, name: "Emily Davis", status: "offline", timeline: [
//       { start: "09:00", end: "11:00", type: "offline" },
//       { start: "11:00", end: "15:00", type: "available" },
//       { start: "15:00", end: "18:00", type: "busy" },
//     ]},
//   { id: 5, name: "Daniel Wilson", status: "queue_off", timeline: [
//       { start: "09:00", end: "18:00", type: "queue_off" },
//     ]},
//   { id: 6, name: "Jessica Moore", status: "available", timeline: [
//       { start: "09:00", end: "10:00", type: "available" },
//       { start: "10:00", end: "11:00", type: "busy" },
//       { start: "11:00", end: "18:00", type: "available" },
//     ]},
//   { id: 7, name: "David Taylor", status: "busy", timeline: [
//       { start: "09:00", end: "14:00", type: "busy" },
//       { start: "14:00", end: "18:00", type: "available" },
//     ]},
//   { id: 8, name: "Olivia Anderson", status: "available", timeline: [
//       { start: "09:00", end: "12:30", type: "available" },
//       { start: "12:30", end: "13:30", type: "offline" },
//       { start: "13:30", end: "18:00", type: "available" },
//     ]},
//   { id: 9, name: "James Thompson", status: "offline", timeline: [
//       { start: "09:00", end: "16:00", type: "offline" },
//       { start: "16:00", end: "18:00", type: "busy" },
//     ]},
//   { id: 10, name: "Sophia Martinez", status: "available", timeline: [
//       { start: "09:00", end: "11:00", type: "available" },
//       { start: "11:00", end: "12:00", type: "busy" },
//       { start: "12:00", end: "18:00", type: "available" },
//     ]},
// ];

// // ============================================
// // Utils (Matched with Admin Dark Theme)
// // ============================================
// const getColor = (type) => {
//   if (type === "available") return "bg-emerald-500";
//   if (type === "busy") return "bg-rose-500";
//   if (type === "offline") return "bg-gray-500";
//   if (type === "queue_off") return "bg-yellow-500";
//   return "bg-cyan-500";
// };

// const timeToMinutes = (t) => {
//   const [h, m] = t.split(":");
//   return parseInt(h) * 60 + parseInt(m);
// };

// // ============================================
// // Main Component
// // ============================================
// export default function AgentTimelineDashboard() {
//   const [selectedAgent, setSelectedAgent] = useState(agents[0]);

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#1e293b] text-gray-100 p-8 space-y-8">

//       {/* Timeline */}
//       <div className="bg-[#1e293b]/80 border border-gray-700 rounded-2xl p-6 shadow-xl">
//         <h2 className="text-xl font-semibold mb-4">
//           Agent Timeline — {selectedAgent.name}
//         </h2>

//         <div className="flex w-full h-12 rounded overflow-hidden border border-gray-700">
//           {selectedAgent.timeline.map((slot, idx) => {
//             const width = ((timeToMinutes(slot.end) - timeToMinutes(slot.start)) / (9 * 60)) * 100;
//             return (
//               <motion.div
//                 key={idx}
//                 className={`${getColor(slot.type)} h-full`}
//                 style={{ width: `${width}%` }}
//                 whileHover={{ scaleY: 1.1 }}
//                 title={`${slot.start} - ${slot.end} (${slot.type})`}
//               />
//             );
//           })}
//         </div>

//         {/* Legend */}
//         <div className="flex gap-6 mt-4 text-xs text-gray-300">
//           <span className="flex items-center gap-2"><i className="w-3 h-3 bg-emerald-500 inline-block" /> Available</span>
//           <span className="flex items-center gap-2"><i className="w-3 h-3 bg-rose-500 inline-block" /> Busy</span>
//           <span className="flex items-center gap-2"><i className="w-3 h-3 bg-gray-500 inline-block" /> Offline</span>
//           <span className="flex items-center gap-2"><i className="w-3 h-3 bg-yellow-500 inline-block" /> Queue Off</span>
//         </div>
//       </div>

//       {/* Summary Blocks */}
//       <div className="grid grid-cols-2 gap-6">
//         <div className="bg-[#1e293b]/80 border border-emerald-600/40 rounded-2xl p-6 shadow-xl">
//           <h3 className="text-sm text-gray-400">Available Agents</h3>
//           <p className="text-3xl font-bold text-emerald-400 mt-2">
//             {agents.filter(a => a.status === "available").length}
//           </p>
//         </div>
//         <div className="bg-[#1e293b]/80 border border-gray-600/40 rounded-2xl p-6 shadow-xl">
//           <h3 className="text-sm text-gray-400">Offline Agents</h3>
//           <p className="text-3xl font-bold text-gray-300 mt-2">
//             {agents.filter(a => a.status === "offline").length}
//           </p>
//         </div>
//       </div>

//       {/* Agent Table */}
//       <div className="bg-[#1e293b]/80 border border-gray-700 rounded-2xl p-6 shadow-xl">
//         <h2 className="text-xl font-semibold mb-4">Agents Status</h2>

//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b border-gray-700 text-gray-400">
//               <th className="py-2 text-left">Agent</th>
//               <th className="py-2 text-left">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {agents.map((agent) => (
//               <tr
//                 key={agent.id}
//                 onClick={() => setSelectedAgent(agent)}
//                 className={`cursor-pointer border-b border-gray-700 hover:bg-cyan-500/10 ${selectedAgent.id === agent.id ? "bg-cyan-500/10" : ""}`}
//               >
//                 <td className="py-3 font-medium">{agent.name}</td>
//                 <td className="py-3">
//                   <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getColor(agent.status)} text-white`}>
//                     {agent.status.replace("_", " ").toUpperCase()}
//                   </span>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }




import React from "react";
import { motion } from "framer-motion";

// ============================================
// Dummy US Agents Data (Client Demo)
// ============================================
const agents = [
  { id: 1, name: "John Miller", status: "available", timeline: [
      { start: "09:00", end: "10:15", type: "available" },
      { start: "10:15", end: "11:00", type: "busy" },
      { start: "11:00", end: "13:00", type: "available" },
      { start: "13:00", end: "14:00", type: "offline" },
      { start: "14:00", end: "18:00", type: "busy" },
  ]},
  { id: 2, name: "Sarah Johnson", status: "busy", timeline: [
      { start: "09:00", end: "11:30", type: "busy" },
      { start: "11:30", end: "12:30", type: "available" },
      { start: "12:30", end: "18:00", type: "busy" },
  ]},
  { id: 3, name: "Michael Brown", status: "available", timeline: [
      { start: "09:00", end: "12:00", type: "available" },
      { start: "12:00", end: "13:00", type: "busy" },
      { start: "13:00", end: "18:00", type: "available" },
  ]},
  { id: 4, name: "Emily Davis", status: "offline", timeline: [
      { start: "09:00", end: "11:00", type: "offline" },
      { start: "11:00", end: "15:00", type: "available" },
      { start: "15:00", end: "18:00", type: "busy" },
  ]},
  { id: 5, name: "Daniel Wilson", status: "queue_off", timeline: [
      { start: "09:00", end: "18:00", type: "queue_off" },
  ]},
  { id: 6, name: "Jessica Moore", status: "available", timeline: [
      { start: "09:00", end: "10:00", type: "available" },
      { start: "10:00", end: "11:00", type: "busy" },
      { start: "11:00", end: "18:00", type: "available" },
  ]},
  { id: 7, name: "David Taylor", status: "busy", timeline: [
      { start: "09:00", end: "14:00", type: "busy" },
      { start: "14:00", end: "18:00", type: "available" },
  ]},
  { id: 8, name: "Olivia Anderson", status: "available", timeline: [
      { start: "09:00", end: "12:30", type: "available" },
      { start: "12:30", end: "13:30", type: "offline" },
      { start: "13:30", end: "18:00", type: "available" },
  ]},
  { id: 9, name: "James Thompson", status: "offline", timeline: [
      { start: "09:00", end: "16:00", type: "offline" },
      { start: "16:00", end: "18:00", type: "busy" },
  ]},
  { id: 10, name: "Sophia Martinez", status: "available", timeline: [
      { start: "09:00", end: "11:00", type: "available" },
      { start: "11:00", end: "12:00", type: "busy" },
      { start: "12:00", end: "18:00", type: "available" },
  ]},
];

// ============================================
// Utils
// ============================================
const getColor = (type) => {
  if (type === "available") return "bg-emerald-500";
  if (type === "busy") return "bg-rose-500";
  if (type === "offline") return "bg-gray-500";
  if (type === "queue_off") return "bg-yellow-500";
  return "bg-cyan-500";
};

const getStatusBadge = (status) => {
  const base = "px-3 py-1 rounded-full text-xs font-semibold tracking-wide";
  if (status === "available") return `${base} bg-emerald-500/20 text-emerald-400 border border-emerald-500/40`;
  if (status === "busy") return `${base} bg-rose-500/20 text-rose-400 border border-rose-500/40`;
  if (status === "offline") return `${base} bg-gray-500/20 text-gray-300 border border-gray-500/40`;
  if (status === "queue_off") return `${base} bg-yellow-500/20 text-yellow-400 border border-yellow-500/40`;
  return base;
};

const timeToMinutes = (t) => {
  const [h, m] = t.split(":");
  return parseInt(h) * 60 + parseInt(m);
};

const getAvailableMinutes = (timeline) =>
  timeline
    .filter((t) => t.type === "available")
    .reduce((sum, t) => sum + (timeToMinutes(t.end) - timeToMinutes(t.start)), 0);

// ============================================
// Main Component
// ============================================
export default function AgentTimelineTableView() {
  const totalAvailable = agents.filter((a) => a.status === "available").length;
  const totalOffline = agents.filter((a) => a.status === "offline").length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#1e293b] text-gray-100 p-8 space-y-8">

      {/* Top Summary Blocks */}
      <div className="grid grid-cols-2 gap-6 w-full">
        <div className="bg-[#1e293b]/80 border border-emerald-600/40 rounded-2xl p-6 shadow-xl">
          <p className="text-sm text-gray-400">Available Agents</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">{totalAvailable}</p>
        </div>
        <div className="bg-[#1e293b]/80 border border-gray-600/40 rounded-2xl p-6 shadow-xl">
          <p className="text-sm text-gray-400">Offline Agents</p>
          <p className="text-3xl font-bold text-gray-300 mt-2">{totalOffline}</p>
        </div>
      </div>

      {/* Agent Table */}
      <div className="bg-[#1e293b]/80 border border-gray-700 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Agent Availability Overview</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="py-2 text-left">Agent</th>
              <th className="py-2 text-left">Current Status</th>
              <th className="py-2">Timeline (9 AM – 6 PM)</th>
              <th className="py-2 text-right">Total Available</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => {
              const availableMins = getAvailableMinutes(agent.timeline);
              return (
                <tr key={agent.id} className="border-b border-gray-700 hover:bg-cyan-500/5 transition">
                  <td className="py-3 font-medium">{agent.name}</td>

                  <td className="py-3">
                    <span className={getStatusBadge(agent.status)}>
                      {agent.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>

                  <td className="py-3">
                    <div className="flex w-full h-4 rounded overflow-hidden border border-gray-700">
                      {agent.timeline.map((slot, idx) => {
                        const width = ((timeToMinutes(slot.end) - timeToMinutes(slot.start)) / (9 * 60)) * 100;
                        return (
                          <motion.div
                            key={idx}
                            className={`${getColor(slot.type)} h-full`}
                            style={{ width: `${width}%` }}
                            title={`${slot.start} - ${slot.end} (${slot.type})`}
                          />
                        );
                      })}
                    </div>
                  </td>

                  <td className="py-3 text-right text-emerald-400 font-semibold">
                    {Math.floor(availableMins / 60)}h {availableMins % 60}m
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
