import React, { useState } from "react";
import {
  Users,
  DollarSign,
  BarChart3,
  FileBarChart,
  PhoneCall,
  RefreshCcw,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Menu
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar States
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Submenu states
  const [openMenus, setOpenMenus] = useState({
    reports: false,
  });

  const toggleMenu = (menu) =>
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));

  const navItems = [
    {
      title: "Users",
      icon: <Users size={20} />,
      to: "/users",
    },
    {
      title: "Operations",
      icon: <DollarSign size={20} />,
      to: "/operationscost",
    },
    {
      title: "Marketing",
      icon: <BarChart3 size={20} />,
      to: "/marketingcost",
    },
  ];

  const reportSubItems = [
    {
      title: "Productivity Summary",
      to: "/marketing-expense-table",
      icon: <FileBarChart size={18} />,
    },
    {
      title: "Call Analytics",
      to: "/call-logs",
      icon: <PhoneCall size={18} />,
    },
    {
      title: "Chargebacks",
      to: "/chargeback",
      icon: <AlertTriangle size={18} />,
    },
  ];

  return (
    <>
      {/* MOBILE HEADER BURGER */}
      <div className="lg:hidden p-3 bg-[#11182b] border-b border-gray-800 flex">
        <Menu size={28} className="text-white cursor-pointer" onClick={() => setMobileOpen(true)} />
      </div>

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 70 : 240 }}
        className={`
          h-screen bg-[#11182b] border-r border-gray-800 fixed top-0 left-0 
          shadow-xl flex flex-col z-50
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          transition-all duration-300
        `}
      >
        {/* Logo + Collapse Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {!collapsed && (
            <img src="/assets/CallTracklogo.png" className="h-8" alt="logo" />
          )}

          <button
            className="text-gray-300 hover:text-white"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {/* MAIN NAV */}
        <nav className="flex flex-col mt-2">
          {navItems.map((item) => {
            const active = location.pathname === item.to;

            return (
              <SidebarItem
                key={item.title}
                collapsed={collapsed}
                active={active}
                icon={item.icon}
                title={item.title}
                onClick={() => navigate(item.to)}
              />
            );
          })}

          {/* Submenu */}
          <div>
            <SidebarItem
              collapsed={collapsed}
              title="Reports"
              icon={<BarChart3 />}
              onClick={() => toggleMenu("reports")}
              isSubmenuToggle
              isOpen={openMenus.reports}
            />

            {/* Dropdown submenu */}
            <AnimatePresence>
              {openMenus.reports && !collapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-8 mt-1 flex flex-col gap-1 overflow-hidden"
                >
                  {reportSubItems.map((sub) => {
                    const active = location.pathname === sub.to;
                    return (
                      <SidebarItem
                        key={sub.title}
                        collapsed={false}
                        active={active}
                        small
                        icon={sub.icon}
                        title={sub.title}
                        onClick={() => navigate(sub.to)}
                      />
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* MOBILE CLOSE BUTTON */}
        <div className="lg:hidden mt-auto p-4">
          <button
            onClick={() => setMobileOpen(false)}
            className="bg-red-500 w-full py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </motion.aside>
    </>
  );
};

// Reusable Sidebar Item Component
const SidebarItem = ({ title, icon, collapsed, active, onClick, small, isSubmenuToggle, isOpen }) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center cursor-pointer px-4 py-2 my-1 rounded-md transition-all
        ${active ? "bg-[#1d2738] text-cyan-400 border border-cyan-600" :
        "text-gray-300 hover:bg-[#1d2738] hover:text-white"}
        ${small ? "text-sm ml-2" : ""}
      `}
      title={collapsed ? title : ""}
    >
      <span className="text-cyan-400">{icon}</span>

      {!collapsed && (
        <span className="ml-3 flex-1">{title}</span>
      )}

      {isSubmenuToggle && !collapsed && (
        <ChevronDown
          size={18}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      )}
    </div>
  );
};

export default Sidebar;
