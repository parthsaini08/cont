import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import CallsTable from "./components/CallsTable";
import TimelineChart from "./components/TimelineChart";
import DashboardHeader from "./components/DashboardHeader";
import Signup from "./components/Signup";
import Login from "./components/Login";
import CallsPage from "./components/Tempcallpage";
import TempCallsTable from "./components/TemplateCalls";
import AdminPage from "./components/Adminpage";
import ForgotPassword from "./components/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import ResetPassword from "./components/ResetPassword";
import {BASE_URL} from "./config";
import CallDashboard from "./components/CallDashboard";
import OperationsExpensePage from "./components/operations/OperationsExpensePage";
import AdminPanel from "./components/AdminDashboard";
import MarketingCost from "./components/marketing/MarketingExpense";
import MarketingExpenseTable from "./components/marketing/MarketingExpenseTable";
import ReportsPage from "./components/marketing/MarketingDashboard";
import AgentPerformanceDashboard from "./components/AgentPerformanceDashboard";
import ChargebackTracker from "./components/chargeback/ChargebackTracker";

function App() {
  const [data, setData] = useState({ stats: {}, calls: [] });
  const [dateRange, setDateRange] = useState({
    startDate: "2025-08-01",
    endDate: "2025-08-29",
  });
   const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

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
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  const handleToggleSidebar = () => {};
  const handleDateRangeChange = (range) => setDateRange(range);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-300 text-lg">
        Checking session...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/operationscost" 
        element={
        <ProtectedRoute
              allowedRole="admin"
              element={
              <div>
                <DashboardHeader/>
                <OperationsExpensePage />
              </div>} 
              />}/>
        <Route path="/marketingcost" 
        element={
        <ProtectedRoute
              allowedRole="admin"
              element={
              <div>
                <DashboardHeader/>
                <MarketingCost />
              </div>} 
              />}/>
        <Route
          path="/admin" 
          element={
            <ProtectedRoute
              allowedRole="admin"
              element={
              <div>
                <DashboardHeader/>
                <AdminPanel/> 
                </div>}
            />
          }
        />
        <Route
          path="/users" 
          element={
            <ProtectedRoute
              allowedRole="admin"
              element={
               <div>
                <DashboardHeader/>
                <AdminPage />
                </div>}
            />
          }
        />
        <Route
          path="/agentdash" 
          element={
            <ProtectedRoute
              allowedRole="user"
              element={
               <div>
                <DashboardHeader/>  
                <AgentPerformanceDashboard />
                </div>}
            />
          }
        />
        <Route path="/call-logs" element={
            <div className="flex flex-col min-h-screen bg-primary text-gray-100">
                <DashboardHeader />
                {/* <div className="hidden md:block">
            <Sidebar /></div> */}
              <main className="flex-1 p-6">
                {/* <h1 className="text-2xl font-bold text-secondary">📊 Call Dashboard</h1> */}
                <div className="">
                  <AgentPerformanceDashboard />
                </div>
                <div>
                  
                </div>
                <TempCallsTable />
              </main>
            </div>
          } />
        <Route
          path="/"
          element={
            user ? <Navigate to="/call-logs" replace /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/chargeback" element={
          <div><DashboardHeader /><ChargebackTracker /></div>} />
        <Route path="/analytics" element={<CallDashboard />}/>
        <Route path="/marketing-expense-table" element={<ReportsPage />}/>
        <Route path="/reports" element={<ReportsPage />}/>
      </Routes>
    </Router>
  );
}

export default App;
