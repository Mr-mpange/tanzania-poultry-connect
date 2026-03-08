import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package, ShoppingCart, Truck, BarChart3, Settings, Users,
  ArrowRight, Leaf, TrendingUp, MapPin
} from "lucide-react";

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const roleConfig: Record<string, { greeting: string; subtitle: string; actions: QuickAction[] }> = {
  farmer: {
    greeting: "Welcome back, Farmer",
    subtitle: "Manage your inventory, track orders, and grow your business.",
    actions: [
      { label: "My Inventory", description: "Add or manage your products", icon: Package, path: "/dashboard/farmer", color: "bg-secondary/10 text-secondary" },
      { label: "Orders", description: "View and process incoming orders", icon: ShoppingCart, path: "/dashboard/farmer/orders", color: "bg-blue-100 text-blue-600" },
      { label: "Profile Settings", description: "Update your profile info", icon: Settings, path: "/dashboard/settings", color: "bg-muted text-muted-foreground" },
    ],
  },
  buyer: {
    greeting: "Welcome back, Buyer",
    subtitle: "Browse the marketplace and track your orders.",
    actions: [
      { label: "Marketplace", description: "Browse products from local farmers", icon: ShoppingCart, path: "/dashboard/buyer", color: "bg-secondary/10 text-secondary" },
      { label: "My Orders", description: "Track your order history", icon: Package, path: "/dashboard/buyer/orders", color: "bg-blue-100 text-blue-600" },
      { label: "Profile Settings", description: "Update your profile info", icon: Settings, path: "/dashboard/settings", color: "bg-muted text-muted-foreground" },
    ],
  },
  distributor: {
    greeting: "Welcome back, Driver",
    subtitle: "Claim deliveries and manage your routes.",
    actions: [
      { label: "Deliveries", description: "View and claim available deliveries", icon: Truck, path: "/dashboard/distributor", color: "bg-secondary/10 text-secondary" },
      { label: "Route Map", description: "Plan your delivery routes", icon: MapPin, path: "/dashboard/distributor/routes", color: "bg-amber-100 text-amber-600" },
      { label: "Profile Settings", description: "Update your profile info", icon: Settings, path: "/dashboard/settings", color: "bg-muted text-muted-foreground" },
    ],
  },
  admin: {
    greeting: "Welcome back, Admin",
    subtitle: "Monitor the platform, manage users, and review analytics.",
    actions: [
      { label: "Overview", description: "Platform analytics & charts", icon: BarChart3, path: "/dashboard/admin", color: "bg-secondary/10 text-secondary" },
      { label: "Users", description: "Manage and approve users", icon: Users, path: "/dashboard/admin/users", color: "bg-blue-100 text-blue-600" },
      { label: "Orders", description: "Review all platform orders", icon: ShoppingCart, path: "/dashboard/admin/orders", color: "bg-amber-100 text-amber-600" },
      { label: "Profile Settings", description: "Update your profile info", icon: Settings, path: "/dashboard/settings", color: "bg-muted text-muted-foreground" },
    ],
  },
};

export default function WelcomeDashboard() {
  const { profile, role } = useAuth();
  const navigate = useNavigate();
  const config = roleConfig[role || "buyer"];
  const displayName = profile?.full_name || "there";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-secondary rounded-lg flex items-center justify-center">
          <Leaf className="w-5 h-5 text-secondary-foreground" />
        </div>
        <span className="font-display font-bold text-foreground">KukuConnect</span>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl space-y-8"
        >
          {/* Greeting */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              {config.greeting}, <span className="text-secondary">{displayName}</span> 👋
            </h1>
            <p className="text-muted-foreground text-lg">{config.subtitle}</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {config.actions.map((action, i) => (
              <motion.button
                key={action.path}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.07 }}
                onClick={() => navigate(action.path)}
                className="group bg-card border border-border rounded-xl p-5 text-left hover:shadow-card hover:border-secondary/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-semibold text-foreground">{action.label}</p>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Stat hint */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tip: Check your dashboard regularly to stay on top of activity.</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
