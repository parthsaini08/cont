import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, PhoneCall, RefreshCcw, BarChart3,FileBarChart} from "lucide-react";

const AdminPanel = () => {
const navigate = useNavigate();


const handleUpdateUsers = async () => {
  try {
    const response = await fetch("https://gettrip4me.com/test-api/update_extension.php", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.text();
    alert(result || "✅ Users updated successfully!");
  } catch (error) {
    console.log(error.message);
    alert("❌ Error updating users: " + error.message);
  }
};


const cards = [
  {
    title: "Add Users",
    desc: "Create, manage, and assign roles to your agents effortlessly.",
    icon: <Users size={30} />,
    gradient: "from-blue-500 to-cyan-400",
    onClick: () => navigate("/users"),
  },
  {
    title: "Operation Cost Management",
    desc: "Track and analyze daily operational costs and profits.",
    icon: <DollarSign size={30} />,
    gradient: "from-green-500 to-lime-400",
    onClick: () => navigate("/operationscost"),
  },
  {
    title: "Marketing Cost Management",
    desc: "Manage and monitor marketing spends by call queue or channel.",
    icon: <BarChart3 size={30} />,
    gradient: "from-indigo-500 to-sky-400",
    onClick: () => navigate("/marketingcost"),
  },
  {
    title: "Prodictivity Summary",
    desc: "View summarized marketing cost and MCO reports by date range.",
    icon: <FileBarChart size={30} />,
    gradient: "from-teal-500 to-emerald-400",
    onClick: () => navigate("/marketing-expense-table"), // ✅ new route
  },
  {
    title: "Call Analytics",
    desc: "Monitor total calls, productivity, and call conversion trends.",
    icon: <PhoneCall size={30} />,
    gradient: "from-purple-500 to-pink-400",
    onClick: () => navigate("/call-logs"),
  },
  {
    title: "Update Users",
    desc: "Fetch the latest user data from the server instantly.",
    icon: <RefreshCcw size={30} />,
    gradient: "from-orange-500 to-yellow-400",
    onClick: handleUpdateUsers,
  },
];


return (
<div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#1e293b] text-gray-100 flex flex-col items-center px-6 py-10">
{/* Header */}
<div className="text-center mb-10">
<h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-md">
Admin Dashboard
</h1>
<p className="text-gray-400 mt-2 text-sm">
Manage your team, operations, and performance — all in one place.
</p>
</div>

  {/* Main Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
    {cards.map((card, i) => (
      <div
        key={i}
        onClick={card.onClick}
        className="relative group cursor-pointer rounded-2xl overflow-hidden bg-[#1e293b]/70 
        border border-gray-700 hover:border-cyan-400 shadow-lg hover:shadow-cyan-600/20 
        transition-all duration-300 backdrop-blur-xl p-8 flex flex-col items-start justify-between"
      >
        {/* Gradient Glow */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-br ${card.gradient} transition-opacity duration-300`}
        ></div>

        {/* Icon */}
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg mb-5`}
        >
          {card.icon}
        </div>

        {/* Content */}
        <div>
          <h2 className="text-xl font-semibold mb-1">{card.title}</h2>
          <p className="text-gray-400 text-sm">{card.desc}</p>
        </div>

        {/* Hover Line */}
        <div
          className={`absolute bottom-0 left-0 h-[3px] w-0 group-hover:w-full bg-gradient-to-r ${card.gradient} transition-all duration-300`}
        ></div>
      </div>
    ))}
  </div>

  {/* Footer */}
  <div className="mt-16 text-gray-500 text-xs">
    © {new Date().getFullYear()} Calling Dashboard — Admin Control Center
  </div>
</div>


);
};

export default AdminPanel;