import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FarmerDashboard from "./pages/FarmerDashboard";
import BuyerMarketplace from "./pages/BuyerMarketplace";
import AdminDashboard from "./pages/AdminDashboard";
import DistributorDashboard from "./pages/DistributorDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import WelcomeDashboard from "./pages/WelcomeDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><WelcomeDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/farmer" element={<ProtectedRoute allowedRoles={["farmer"]}><FarmerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/farmer/orders" element={<ProtectedRoute allowedRoles={["farmer"]}><FarmerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/buyer" element={<ProtectedRoute allowedRoles={["buyer"]}><BuyerMarketplace /></ProtectedRoute>} />
              <Route path="/dashboard/buyer/orders" element={<ProtectedRoute allowedRoles={["buyer"]}><BuyerMarketplace /></ProtectedRoute>} />
              <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/admin/orders" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/distributor" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/distributor/routes" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
