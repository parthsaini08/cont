import React from "react";
import { useNavigate } from "react-router-dom";
import {BASE_URL} from "../config";
import {
  Users,
  DollarSign,
  PhoneCall,
  RefreshCcw,
  BarChart3,
  FileBarChart,
  AlertTriangle,
  LayoutDashboard,
  UserCheck,
  Calendar,
  TrendingUp,
  Phone,
  Scale,
} from "lucide-react";

const AdminPanel = () => {
  const navigate = useNavigate();

  const handleUpdateUsers = async () => {
    try {
      const response = await fetch(
        "https://gettrip4me.com/test-api/update_extension.php",
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.text();
      alert(result || "✅ Users updated successfully!");
    } catch (error) {
      alert("❌ Error updating users: " + error.message);
    }
  };

  // =============================
  // DASHBOARD SECTIONS
  // =============================

  const sections = [
    {
      title: "User & System Management",
      subtitle: "Manage users, roles, and system updates",
      items: [
        {
          title: "Add Users",
          desc: "Create, manage, and assign roles to your agents.",
          icon: <Users size={22} />,
          glowColor: "cyan",
          onClick: () => navigate("/users"),
        },
        {
          title: "Update Users",
          desc: "Fetch the latest user data from the server.",
          icon: <RefreshCcw size={22} />,
          glowColor: "rose",
          onClick: handleUpdateUsers,
        },
      ],
    },

    {
      title: "Cost & Finance",
      subtitle: "Track expenses, marketing spend, and chargebacks",
      items: [
        {
          title: "Operation Cost Management",
          desc: "Track daily operational costs and profits.",
          icon: <DollarSign size={22} />,
          glowColor: "emerald",
          onClick: () => navigate("/operationscost"),
        },
        {
          title: "Marketing Cost Management",
          desc: "Monitor marketing spends by queue or channel.",
          icon: <BarChart3 size={22} />,
          glowColor: "blue",
          onClick: () => navigate("/marketingcost"),
        },
        {
          title: "Chargeback Tracker",
          desc: "Track chargebacks and refunds.",
          icon: <AlertTriangle size={22} />,
          glowColor: "cyan",
          onClick: () => navigate("/chargeback"),
        },
      ],
    },

    {
      title: "Analytics & Monitoring",
      subtitle: "Live insights into calls, performance, and productivity",
      items: [
        {
          title: "Analytics Dashboard",
          desc: "Live performance metrics and trends.",
          icon: <LayoutDashboard size={22} />,
          glowColor: "rose",
          onClick: () => navigate("/analytics-dashboard"),
        },
        {
          title: "Call Analytics",
          desc: "Monitor calls and conversion trends.",
          icon: <PhoneCall size={22} />,
          glowColor: "emerald",
          onClick: () => navigate("/call-logs"),
        },
        {
          title: "Productivity Summary",
          desc: "Summarized reports by date range.",
          icon: <FileBarChart size={22} />,
          glowColor: "blue",
          onClick: () => navigate("/marketing-expense-table"),
        },
      ],
    },

    {
      title: "Reports",
      subtitle: "Detailed financial and performance reports",
      items: [
        {
          title: "Agent Performance Report",
          desc: "Agent-wise calls, revenue, and MCO.",
          icon: <UserCheck size={22} />,
          glowColor: "cyan",
          onClick: () => navigate("/agent-report"),
        },
        {
          title: "Monthly MCO Report",
          desc: "Month-wise MCO with per-day drilldown.",
          icon: <Calendar size={22} />,
          glowColor: "rose",
          onClick: () => navigate("/reports/monthly-mco"),
        },
        {
          title: "Queue Report",
          desc: "Queue-wise marketing spend analysis.",
          icon: <TrendingUp size={22} />,
          glowColor: "emerald",
          onClick: () => navigate("/queue-report"),
        },
        {
          title: "Gateway Report",
          desc: "Charges and revenue per gateway.",
          icon: <Phone size={22} />,
          glowColor: "blue",
          onClick: () => navigate("/gateway-report"),
        },
        {
          title: "Chargeback Report",
          desc: "Detailed chargeback and refund report.",
          icon: <Scale size={22} />,
          glowColor: "cyan",
          onClick: () => navigate("/chargeback-report"),
        },
      ],
    },
  ];

  // Glow color mappings
  const glowColors = {
    cyan: {
      border: "from-cyan-400 to-blue-500",
      shadow: "shadow-cyan-400/50",
      bg: "bg-cyan-500/10",
    },
    rose: {
      border: "from-rose-400 to-red-500",
      shadow: "shadow-rose-400/50",
      bg: "bg-rose-500/10",
    },
    emerald: {
      border: "from-emerald-400 to-green-500",
      shadow: "shadow-emerald-400/50",
      bg: "bg-emerald-500/10",
    },
    blue: {
      border: "from-blue-400 to-cyan-500",
      shadow: "shadow-blue-400/50",
      bg: "bg-blue-500/10",
    },
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 px-6 py-10 relative overflow-hidden">
      {/* Radial gradient background effect - larger and more prominent */}
      <div className="absolute top-[-200px] right-[-200px] w-[1000px] h-[1000px] bg-blue-500/20 rounded-full blur-[150px] -z-10" />
      <div className="absolute bottom-[-300px] left-[-300px] w-[1200px] h-[1200px] bg-cyan-500/10 rounded-full blur-[180px] -z-10" />

      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          Real-Time Agent Visibility. Built for Scale.
        </h1>
        <p className="text-gray-400 text-base max-w-3xl mx-auto leading-relaxed">
          Track availability, live calls, and operational health across your entire
          support or sales team—instantly, accurately, and without manual
          intervention.
        </p>
      </div>

      {/* Sections */}
      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {sections.map((section, idx) => (
          <div key={idx}>
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-1">
                {section.title}
              </h2>
              <p className="text-sm text-gray-500">
                {section.subtitle}
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.items.map((card, i) => {
                const colors = glowColors[card.glowColor];
                return (
                  <div
                    key={i}
                    onClick={card.onClick}
                    className="group cursor-pointer rounded-xl bg-[#161b22] 
                    border border-gray-800/80
                    transition-all duration-300 
                    backdrop-blur-sm p-6 relative overflow-hidden
                    hover:-translate-y-1"
                  >
                    {/* Bottom glowing neon line - the key visual element */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${colors.border} 
                      ${colors.shadow} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}
                      style={{
                        boxShadow: `0 0 20px currentColor`,
                      }}
                    />

                    {/* Subtle top glow on hover */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-[1px] w-0 
                      group-hover:w-full bg-gradient-to-r ${colors.border} 
                      transition-all duration-500 opacity-40`}
                    />

                    {/* Content container */}
                    <div className="relative z-10">
                      {/* Icon - simple blue circle */}
                      <div className="inline-flex p-2 rounded-lg bg-blue-500/20 text-blue-400 mb-4">
                        {card.icon}
                      </div>

                      <h3 className="text-base font-medium text-white mb-2">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-24 text-center text-gray-600 text-xs">
        © {new Date().getFullYear()} Calling Dashboard — Admin Control Center
      </div>
    </div>
  );
};

export default AdminPanel;