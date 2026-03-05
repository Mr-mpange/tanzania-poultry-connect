import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FarmerDashboard from "./pages/FarmerDashboard";
import BuyerMarketplace from "./pages/BuyerMarketplace";
import AdminDashboard from "./pages/AdminDashboard";
import DistributorDashboard from "./pages/DistributorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function NotificationListener() {
  useOrderNotifications();
  return null;
}

function DashboardRedirect() {
  const { role, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-emerald border-t-transparent rounded-full animate-spin" /></div>;
  if (!role) return <Navigate to="/auth" replace />;
  return <Navigate to={`/dashboard/${role}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationListener />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/dashboard/farmer" element={<ProtectedRoute allowedRoles={["farmer"]}><FarmerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/farmer/orders" element={<ProtectedRoute allowedRoles={["farmer"]}><FarmerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/buyer" element={<ProtectedRoute allowedRoles={["buyer"]}><BuyerMarketplace /></ProtectedRoute>} />
            <Route path="/dashboard/buyer/orders" element={<ProtectedRoute allowedRoles={["buyer"]}><BuyerMarketplace /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/admin/orders" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/distributor" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/distributor/routes" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
