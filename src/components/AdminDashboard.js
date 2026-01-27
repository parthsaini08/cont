import React from "react";
import { useNavigate } from "react-router-dom";
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
          icon: <Users size={28} />,
          gradient: "from-blue-500 to-cyan-400",
          onClick: () => navigate("/users"),
        },
        {
          title: "Update Users",
          desc: "Fetch the latest user data from the server.",
          icon: <RefreshCcw size={28} />,
          gradient: "from-orange-500 to-yellow-400",
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
          icon: <DollarSign size={28} />,
          gradient: "from-green-500 to-lime-400",
          onClick: () => navigate("/operationscost"),
        },
        {
          title: "Marketing Cost Management",
          desc: "Monitor marketing spends by queue or channel.",
          icon: <BarChart3 size={28} />,
          gradient: "from-indigo-500 to-sky-400",
          onClick: () => navigate("/marketingcost"),
        },
        {
          title: "Chargeback Tracker",
          desc: "Track chargebacks and refunds.",
          icon: <AlertTriangle size={28} />,
          gradient: "from-red-500 to-rose-400",
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
          icon: <LayoutDashboard size={28} />,
          gradient: "from-cyan-500 to-blue-500",
          onClick: () => navigate("/analytics-dashboard"),
        },
        {
          title: "Call Analytics",
          desc: "Monitor calls and conversion trends.",
          icon: <PhoneCall size={28} />,
          gradient: "from-purple-500 to-pink-400",
          onClick: () => navigate("/call-logs"),
        },
        {
          title: "Productivity Summary",
          desc: "Summarized reports by date range.",
          icon: <FileBarChart size={28} />,
          gradient: "from-teal-500 to-emerald-400",
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
          icon: <UserCheck size={28} />,
          gradient: "from-violet-500 to-purple-400",
          onClick: () => navigate("/agent-report"),
        },
        {
          title: "Monthly MCO Report",
          desc: "Month-wise MCO with per-day drilldown.",
          icon: <Calendar size={28} />,
          gradient: "from-sky-500 to-indigo-400",
          onClick: () => navigate("/reports/monthly-mco"),
        },
        {
          title: "Queue Report",
          desc: "Queue-wise marketing spend analysis.",
          icon: <TrendingUp size={28} />,
          gradient: "from-pink-500 to-rose-400",
          onClick: () => navigate("/queue-report"),
        },
        {
          title: "Gateway Report",
          desc: "Charges and revenue per gateway.",
          icon: <Phone size={28} />,
          gradient: "from-blue-600 to-indigo-500",
          onClick: () => navigate("/gateway-report"),
        },
        {
          title: "Chargeback Report",
          desc: "Detailed chargeback and refund report.",
          icon: <Scale size={28} />,
          gradient: "from-green-600 to-emerald-500",
          onClick: () => navigate("/chargeback-report"),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#1e293b] text-gray-100 px-6 py-10">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-gray-400 mt-2 text-sm">
          Manage your team, operations, and performance — all in one place.
        </p>
      </div>

      {/* Sections */}
      <div className="max-w-6xl mx-auto space-y-16">
        {sections.map((section, idx) => (
          <div key={idx}>
            {/* Section Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">
                {section.title}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {section.subtitle}
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {section.items.map((card, i) => (
                <div
                  key={i}
                  onClick={card.onClick}
                  className="relative group cursor-pointer rounded-2xl bg-[#1e293b]/70 
                  border border-gray-700 hover:border-cyan-400 shadow-lg 
                  hover:shadow-cyan-600/20 transition-all duration-300 
                  backdrop-blur-xl p-8"
                >
                  {/* Gradient Hover */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-20 
                    bg-gradient-to-br ${card.gradient} transition-opacity duration-300`}
                  />

                  {/* Icon */}
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} 
                    text-white shadow-lg mb-5`}
                  >
                    {card.icon}
                  </div>

                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{card.desc}</p>

                  {/* Bottom Accent */}
                  <div
                    className={`absolute bottom-0 left-0 h-[3px] w-0 
                    group-hover:w-full bg-gradient-to-r ${card.gradient} 
                    transition-all duration-300`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-20 text-center text-gray-500 text-xs">
        © {new Date().getFullYear()} Calling Dashboard — Admin Control Center
      </div>
    </div>
  );
};

export default AdminPanel;
