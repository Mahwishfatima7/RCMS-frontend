import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import LoginPage from "./pages/LoginPage";
import AgentNewComplaint from "./pages/AgentNewComplaint";
import AgentTickets from "./pages/AgentTickets";
import AgentAllTicketsWithSLA from "./pages/AgentAllTicketsWithSLA";
import AdminComplaints from "./pages/AdminComplaints";
import AdminBookings from "./pages/AdminBookings";
import ManagementDashboard from "./pages/ManagementDashboard";
import ManagementReports from "./pages/ManagementReports";
import ManagersList from "./pages/ManagersList";
import RegisterAgent from "./pages/RegisterAgent";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        <Navigate to={
          user?.role === 'agent' ? '/agent/new' :
          user?.role === 'admin' ? '/admin/complaints' :
          '/management/dashboard'
        } replace />
      } />
      <Route path="/agent/new" element={<AgentNewComplaint />} />
      <Route path="/agent/tickets" element={<AgentTickets />} />
      <Route path="/agent/all-tickets" element={<AgentAllTicketsWithSLA />} />
      <Route path="/admin/complaints" element={<AdminComplaints />} />
      <Route path="/admin/bookings" element={<AdminBookings />} />
      <Route path="/management/dashboard" element={<ManagementDashboard />} />
      <Route path="/management/reports" element={<ManagementReports />} />
      <Route path="/management/managers" element={<ManagersList />} />
      <Route path="/management/register-agent" element={<RegisterAgent />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
