import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import About from "./pages/About";
import Industrial from "./pages/Industrial";
import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import NotFound from "./pages/NotFound";

import { DashboardLayout } from "./layouts/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Leads from "./pages/dashboard/Leads";
import Customers from "./pages/dashboard/Customers";
import Shipments from "./pages/dashboard/Shipments";
import TrackingEvents from "./pages/dashboard/TrackingEvents";
import Invoices from "./pages/dashboard/Invoices";
import Appointments from "./pages/dashboard/Appointments";
import UserManagement from "./pages/dashboard/UserManagement";
import DashboardSettings from "./pages/dashboard/Settings";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/industrial" element={<Industrial />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/set-password" element={<SetPassword />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route path="leads" element={<ProtectedRoute staffOnly><Leads /></ProtectedRoute>} />
                <Route path="customers" element={<Customers />} />
                <Route path="shipments" element={<Shipments />} />
                <Route path="tracking-events" element={<ProtectedRoute staffOnly><TrackingEvents /></ProtectedRoute>} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="appointments" element={<ProtectedRoute staffOnly><Appointments /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute requiredRole="admin"><DashboardSettings /></ProtectedRoute>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;


