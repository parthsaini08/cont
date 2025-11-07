import React, { useState } from "react";

export default function HeaderWithBar({
  onToggleSidebar = () => {},
  dateRange = { startDate: new Date().toISOString().slice(0,10), endDate: new Date().toISOString().slice(0,10) },
  onDateRangeChange = () => {},
  messagesCount = 0,
  newsCount = 0,
  liveCount = 0,
  completedPercent = 0, // number 0-100
  onTabChange = () => {}
}) {
  const [activeTab, setActiveTab] = useState("live");

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }).toUpperCase();
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <header className="bg-card border-b border-border px-6 py-3">
    {/* //   <div className="flex items-center justify-between"> */}
        {/* <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-muted-foreground hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            <i className="fas fa-bars"></i>
          </button>

          <div>
            <h1 className="text-lg md:text-xl font-semibold text-foreground">Analytics Dashboard</h1>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatDateForDisplay(dateRange.startDate)} 00:00 — {formatDateForDisplay(dateRange.endDate)} 23:59
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <button className="text-muted-foreground hover:text-foreground" aria-label="Notifications">
              <i className="fas fa-bell"></i>
            </button>
            <button className="text-muted-foreground hover:text-foreground" aria-label="Help">
              <i className="fas fa-question-circle"></i>
            </button>
            <button className="text-muted-foreground hover:text-foreground" aria-label="Profile">
              <i className="fas fa-user-circle"></i>
            </button>
          </div> */}

          {/* <div className="flex items-center">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
              className="bg-input border border-border rounded px-2 py-1 text-sm text-foreground mr-2"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
              className="bg-input border border-border rounded px-2 py-1 text-sm text-foreground"
            />
          </div> */}
    {/* //     </div> */}
    {/* //   </div> */}

      {/* Segmented bar */}
      <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          {/* Messages */}
          <button
            onClick={() => handleTabClick("messages")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${activeTab === "messages" ? "bg-muted/30" : "hover:bg-muted/10"}`}
          >
            <i className="fas fa-envelope text-sm"></i>
            <span className="text-sm font-medium">Messages</span>
            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-[#0f172a] text-gray-200">
              {messagesCount}
            </span>
          </button>

          {/* News */}
          <button
            onClick={() => handleTabClick("news")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${activeTab === "news" ? "bg-muted/30" : "hover:bg-muted/10"}`}
          >
            <i className="fas fa-newspaper text-sm"></i>
            <span className="text-sm font-medium">News</span>
            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-[#0f172a] text-gray-200">
              {newsCount}
            </span>
          </button>

          {/* Live */}
          <button
            onClick={() => handleTabClick("live")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${activeTab === "live" ? "bg-red-600/10 ring-1 ring-red-500" : "hover:bg-red-600/5"}`}
          >
            <i className="fas fa-broadcast-tower text-sm text-red-500"></i>
            <span className="text-sm font-semibold">LIVE</span>
            <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">
              {liveCount}
            </span>
          </button>

          {/* Completed summary with progress */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-md">
            <div className="min-w-[90px]">
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="w-36 h-2 bg-[#0b1220] rounded-full mt-1 overflow-hidden">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, completedPercent))}%` }}
                />
              </div>
            </div>
            <div className="text-sm font-medium">{Math.round(completedPercent)}%</div>
          </div>
        </div>

        {/* Right side quick action or small summary */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground hidden md:block">
            <span className="font-medium text-foreground">Overview:</span> {messagesCount} messages • {newsCount} news • {liveCount} live
          </div>
        </div>
      </div>
    </header>
  );
}
