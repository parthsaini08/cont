export default function Header({ onToggleSidebar, dateRange, onDateRangeChange }) {
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).toUpperCase();
  };

  return (
    <header className="ml-64 bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onToggleSidebar}
            className="md:hidden text-muted-foreground hover:text-foreground"
            data-testid="sidebar-toggle"
          >
            <i className="fas fa-bars"></i>
          </button>
          <h1 className="text-xl font-semibold text-foreground">Analytics Dashboard</h1>
          <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">LIVE</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-calendar text-muted-foreground"></i>
            <span className="text-sm text-muted-foreground">
              {formatDateForDisplay(dateRange.startDate)} 00:00 - {formatDateForDisplay(dateRange.endDate)} 23:59
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
              className="bg-input border border-border rounded px-2 py-1 text-sm text-foreground"
              data-testid="input-start-date"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
              className="bg-input border border-border rounded px-2 py-1 text-sm text-foreground"
              data-testid="input-end-date"
            />
          </div>
          
          <button 
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-notifications"
          >
            <i className="fas fa-bell"></i>
          </button>
          <button 
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-help"
          >
            <i className="fas fa-question-circle"></i>
          </button>
          <button 
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-profile"
          >
            <i className="fas fa-user-circle"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
