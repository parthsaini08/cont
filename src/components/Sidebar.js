import React from "react";
import {
  FaTachometerAlt,
  FaChartBar,
  FaBullhorn,
  FaUsers,
  FaBullseye,
  FaProjectDiagram,
  FaPhone,
  FaTasks,
  FaPlug,
  FaCog,
  FaShieldAlt,
  FaSignOutAlt,
} from "react-icons/fa";

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black text-gray-400 flex flex-col justify-between border-r border-gray-700">
      {/* Top Section */}
      <div>
        {/* Logo */}
        <div className="flex items-center font-extrabold text-white px-6 py-5 border-b border-gray-700">
          Call Track 
        </div>

        {/* Menu */}
        <nav className="mt-2">
          <ul className="space-y-1">
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaTachometerAlt className="text-lg" />
              <span>Dashboard</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 bg-[#2563eb] text-white rounded-r-full cursor-pointer">
              <FaChartBar className="text-lg" />
              <span>Reporting</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaBullhorn className="text-lg" />
              <span>Campaigns</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaUsers className="text-lg" />
              <span>Publishers</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaBullseye className="text-lg" />
              <span>Targets</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaProjectDiagram className="text-lg" />
              <span>Call Flows</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaPhone className="text-lg" />
              <span>Numbers</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaTasks className="text-lg" />
              <span>Tasks</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaPlug className="text-lg" />
              <span>Integrations</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaCog className="text-lg" />
              <span>Settings</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaShieldAlt className="text-lg" />
              <span>Security</span>
            </li>
            <li className="px-6 py-3 flex items-center space-x-3 hover:bg-[#1f2937] cursor-pointer">
              <FaSignOutAlt className="text-lg" />
              <span>Logout</span>
            </li>
          </ul>
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="px-6 py-4 border-t border-gray-700 text-green-500 text-sm">
        ● All Systems Go
      </div>
    </aside>
  );
};

export default Sidebar;
