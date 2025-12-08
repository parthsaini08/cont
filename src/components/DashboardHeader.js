import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  DollarSign,
  BarChart3,
  FileBarChart,
  PhoneCall,
  AlertTriangle,
} from "lucide-react";
import { FaUser, FaBars, FaTimes } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { BASE_URL } from "../config";
import { BsSpeedometer } from "react-icons/bs";

const DashboardHeader = () => {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch(`${BASE_URL}session.php`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch(`${BASE_URL}logout.php`, {
      method: "POST",
      credentials: "include",
    });
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Admin options
  const cards = [
    { title: "Dashboard", icon: <BsSpeedometer size={18} />, to: "/admin" },
    { title: "Add Users", icon: <Users size={18} />, to: "/users" },
    { title: "Operation Cost", icon: <DollarSign size={18} />, to: "/operationscost" },
    { title: "Marketing Cost", icon: <BarChart3 size={18} />, to: "/marketingcost" },
    { title: "Productivity", icon: <FileBarChart size={18} />, to: "/marketing-expense-table" },
    { title: "Call Analytics", icon: <PhoneCall size={18} />, to: "/call-logs" },
    { title: "Chargebacks", icon: <AlertTriangle size={18} />, to: "/chargeback" },
  ];

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isRick = user?.name === "Rick";

  // Close user dropdown if clicked outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="w-full bg-[#11182b] border-b border-gray-800 shadow-lg px-4 py-3">

      {/* ================= DESKTOP HEADER (SINGLE ROW ALWAYS) ================= */}
      <div className="hidden lg:flex items-center w-full gap-6">

        {/* LEFT: LOGO */}
        <a href="/" className="flex-shrink-0">
          <img src="/assets/CallTracklogo.png" className="h-9" alt="CallTrack" />
        </a>

        {/* CENTER: ADMIN BUTTONS OR EMPTY SPACE */}
        {isAdmin ? (
          <div
            className="
              flex flex-nowrap whitespace-nowrap
              overflow-x-auto scrollbar-hide
              gap-3 flex-1 min-w-0 justify-center
            "
          >
            {cards.map((card, i) => {
              const active = location.pathname === card.to;
              return (
                <button
                  key={i}
                  onClick={() => navigate(card.to)}
                  className={`
                    shrink-0 flex items-center gap-2 px-4 py-2 rounded-md
                    text-sm transition-all border
                    ${
                      active
                        ? "text-cyan-400 border-cyan-600 bg-[#1a2337]"
                        : "text-gray-300 border-transparent hover:bg-[#1a2337] hover:text-white"
                    }
                  `}
                >
                  {card.icon}
                  {card.title}
                </button>
              );
            })}
          </div>
        ) : (
          // Non-admin: add spacer so layout stays aligned...
          <div className="flex-1" />
        )}

        {/* RIGHT: USER PROFILE */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f2a48] rounded-full cursor-pointer hover:bg-[#2a365c]"
          >
            <FaUser className="text-blue-400 text-lg" />
            <span className="text-gray-200 font-semibold">{user?.name}</span>
          </div>

          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-40">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE VIEW ================= */}
      <div className="lg:hidden flex items-center justify-between w-full">
        <button className="text-white text-2xl" onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <FaTimes /> : <FaBars />}
        </button>

        <img src="/assets/CallTracklogo.png" className="h-9" alt="Logo" />

        <div
          className="flex items-center gap-2 px-4 py-2 bg-[#1f2a48] rounded-full cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <FaUser className="text-blue-400 text-lg" />
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenu && isAdmin && (
        <div className="mt-3 bg-[#0f1629] p-3 rounded-lg border border-gray-700 lg:hidden">
          {cards.map((card, i) => (
            <button
              key={i}
              onClick={() => {
                navigate(card.to);
                setMobileMenu(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 text-left text-gray-300 hover:bg-[#1a2337] hover:text-white rounded-md border border-transparent mb-2"
            >
              {card.icon}
              {card.title}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </header>
  );
};

export default DashboardHeader;
