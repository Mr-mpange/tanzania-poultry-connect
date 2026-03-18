import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import WelcomeDashboard from "./pages/WelcomeDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import NotFound from "./pages/NotFound";

// Farmer
import FarmerDashboard from "./pages/FarmerDashboard";
import FarmerAnalytics from "./pages/farmer/FarmerAnalytics";
import FarmerEarnings from "./pages/farmer/FarmerEarnings";
import FarmerMessages from "./pages/farmer/FarmerMessages";

// Buyer
import BuyerMarketplace from "./pages/BuyerMarketplace";
import BuyerOrderTracking from "./pages/buyer/BuyerOrderTracking";
import BuyerFavorites from "./pages/buyer/BuyerFavorites";
import BuyerMessages from "./pages/buyer/BuyerMessages";

// Distributor
import DistributorDashboard from "./pages/DistributorDashboard";
import DistributorEarnings from "./pages/distributor/DistributorEarnings";
import DistributorMessages from "./pages/distributor/DistributorMessages";
import VehicleManagement from "./pages/distributor/VehicleManagement";
import DeliveryTrackingMap from "./pages/distributor/DeliveryTrackingMap";

// Admin
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/admin/AdminReports";
import AdminAdvancedAnalytics from "./pages/admin/AdminAdvancedAnalytics";
import PlatformSettings from "./pages/admin/PlatformSettings";
import NotificationPreferences from "./pages/NotificationPreferences";

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
              <Route path="/dashboard/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />

              {/* Farmer */}
              <Route path="/dashboard/farmer" element={<ProtectedRoute allowedRoles={["farmer"]}><FarmerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/farmer/orders" element={<ProtectedRoute allowedRoles={["farmer"]}><FarmerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/farmer/analytics" element={<ProtectedRoute allowedRoles={["farmer"]}><FarmerAnalytics /></ProtectedRoute>} />
              <Route path="/dashboard/farmer/earnings" element={<ProtectedRoute allowedRoles={["farmer"]}><FarmerEarnings /></ProtectedRoute>} />
              <Route path="/dashboard/farmer/messages" element={<ProtectedRoute allowedRoles={["farmer"]}><FarmerMessages /></ProtectedRoute>} />

              {/* Buyer */}
              <Route path="/dashboard/buyer" element={<ProtectedRoute allowedRoles={["buyer"]}><BuyerMarketplace /></ProtectedRoute>} />
              <Route path="/dashboard/buyer/orders" element={<ProtectedRoute allowedRoles={["buyer"]}><BuyerMarketplace /></ProtectedRoute>} />
              <Route path="/dashboard/buyer/tracking" element={<ProtectedRoute allowedRoles={["buyer"]}><BuyerOrderTracking /></ProtectedRoute>} />
              <Route path="/dashboard/buyer/favorites" element={<ProtectedRoute allowedRoles={["buyer"]}><BuyerFavorites /></ProtectedRoute>} />
              <Route path="/dashboard/buyer/messages" element={<ProtectedRoute allowedRoles={["buyer"]}><BuyerMessages /></ProtectedRoute>} />

              {/* Distributor */}
              <Route path="/dashboard/distributor" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/distributor/routes" element={<ProtectedRoute allowedRoles={["distributor"]}><DeliveryTrackingMap /></ProtectedRoute>} />
              <Route path="/dashboard/distributor/earnings" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorEarnings /></ProtectedRoute>} />
              <Route path="/dashboard/distributor/messages" element={<ProtectedRoute allowedRoles={["distributor"]}><DistributorMessages /></ProtectedRoute>} />
              <Route path="/dashboard/distributor/vehicles" element={<ProtectedRoute allowedRoles={["distributor"]}><VehicleManagement /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/admin/orders" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />
              <Route path="/dashboard/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAdvancedAnalytics /></ProtectedRoute>} />
              <Route path="/dashboard/admin/platform" element={<ProtectedRoute allowedRoles={["admin"]}><PlatformSettings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
