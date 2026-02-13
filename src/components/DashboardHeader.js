import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  DollarSign,
  BarChart3,
  FileBarChart,
  PhoneCall,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { FaUser, FaBars, FaTimes, FaChevronDown } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { BASE_URL } from "../config";
import { BsSpeedometer } from "react-icons/bs";

const DashboardHeader = () => {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const dropdownRef = useRef();
  const reportsRef = useRef();

  const navigate = useNavigate();
  const location = useLocation();

  /* ================= FETCH USER ================= */
  //Called on every render to keep user info updated
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
    navigate("/login");
  };

  const cards = [
    { title: "Dashboard", icon: <BsSpeedometer size={18} />, to: "/admin" },
    { title: "Add Users", icon: <Users size={18} />, to: "/users" },
    { title: "Operation Cost", icon: <DollarSign size={18} />, to: "/operationscost" },
    { title: "Marketing Cost", icon: <BarChart3 size={18} />, to: "/marketingcost" },
    { title: "Productivity", icon: <FileBarChart size={18} />, to: "/marketing-expense-table" },
    { title: "Call Analytics", icon: <PhoneCall size={18} />, to: "/call-logs" },
    { title: "Chargebacks", icon: <AlertTriangle size={18} />, to: "/chargeback" },
  ];

  const reportLinks = [
    { title: "Gateway Report", to: "/gateway-report" },
    { title: "Agent Report", to: "/agent-report" },
    { title: "Queue Report", to: "/queue-report" },
    { title: "Chargeback Report", to: "/chargeback-report" },
  ];

  const isAdmin = user?.role?.toLowerCase() === "admin";

  /* ================= CLOSE DROPDOWNS ON OUTSIDE CLICK ================= */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (reportsRef.current && !reportsRef.current.contains(e.target)) {
        setReportsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="w-full bg-[#11182b] border-b border-gray-800 shadow-lg px-4 py-3">

      {/* ================= DESKTOP ================= */}
      <div className="hidden lg:flex items-center w-full gap-6">

        {/* LOGO */}
        <a href="/" className="flex-shrink-0">
          <img src="/assets/CallTracklogo.png" className="h-9" alt="CallTrack" />
        </a>

        {/* CENTER NAV */}
        {isAdmin ? (
          <div className="flex flex-nowrap gap-3 flex-1 justify-center">

            {cards.map((card, i) => {
              const active = location.pathname === card.to;
              return (
                <button
                  key={i}
                  onClick={() => navigate(card.to)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs border transition
                    ${
                      active
                        ? "text-cyan-400 border-cyan-600 bg-[#1a2337]"
                        : "text-gray-300 border-transparent hover:bg-[#1a2337] hover:text-white"
                    }`}
                >
                  {card.icon}
                  {card.title}
                </button>
              );
            })}

           
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* USER */}
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f2a48] rounded-full cursor-pointer hover:bg-[#2a365c]"
          >
            <FaUser className="text-blue-400" />
            <span className="text-gray-200 font-semibold">{user?.name}</span>
          </div>

          {open && (
            <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
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

      {/* ================= MOBILE ================= */}
      <div className="lg:hidden flex items-center justify-between">
        <button onClick={() => setMobileMenu(!mobileMenu)}>
          {mobileMenu ? <FaTimes /> : <FaBars />}
        </button>
        <img src="/assets/CallTracklogo.png" className="h-9" alt="Logo" />
      </div>

      {mobileMenu && isAdmin && (
        <div className="mt-3 bg-[#0f1629] p-3 rounded-lg border border-gray-700 lg:hidden">
          {[...cards, ...reportLinks].map((item, i) => (
            <button
              key={i}
              onClick={() => {
                navigate(item.to);
                setMobileMenu(false);
              }}
              className="w-full text-left px-3 py-3 text-gray-300 hover:bg-[#1a2337] hover:text-white rounded-md mb-2"
            >
              {item.title}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
