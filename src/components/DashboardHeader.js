import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaTachometerAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";

const DashboardHeader = () => {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${BASE_URL}session.php`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.status === "success") {
          setUser(data.user);
        } else {
          console.log(data.message);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}logout.php`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full top-0 left-0 z-50 bg-[#11182b] shadow-lg border-b border-gray-800 backdrop-blur-md h-16 flex items-center animate-gradient-x">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 flex items-center justify-between">
        {/* Left - Logo */}
        <a href="/">
          <img src="/assets/CallTracklogo.png" className="h-8" alt="CallTrack Logo" />
        </a>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Show Dashboard Panel Button if user is admin */}
          {user?.role?.toLowerCase() === "admin" && (
            <motion.button
              onClick={() => navigate("/admin")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold px-4 py-2 rounded-full shadow-md hover:shadow-cyan-500/30 transition-all duration-300 text-sm sm:text-base"
            >
              <FaTachometerAlt className="text-white" />
              <span>Dashboard Panel</span>
            </motion.button>
          )}

          {/* User Profile Dropdown */}
          <motion.div
            initial={{ x: 50, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 8px 20px rgba(0,0,0,0.3)",
            }}
            className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 bg-[#1f2a48]/70 hover:bg-[#2a365c]/80 rounded-full transition-colors duration-300 shadow-md cursor-pointer text-sm sm:text-base"
          >
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <FaUser className="text-blue-400 text-lg sm:text-xl" />
                <span className="font-semibold text-gray-200 truncate max-w-[100px] sm:max-w-[150px]">
                  {user?.name || "Loading..."}
                </span>
              </div>

              {open && (
                <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </header>
  );
};

export default DashboardHeader;
