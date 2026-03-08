import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3, Users, ShoppingCart, FileText, Sliders, TrendingUp, Settings } from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { title: "Overview", url: "/dashboard/admin", icon: BarChart3 },
  { title: "Users", url: "/dashboard/admin/users", icon: Users },
  { title: "Orders", url: "/dashboard/admin/orders", icon: ShoppingCart },
  { title: "Reports", url: "/dashboard/admin/reports", icon: FileText },
  { title: "Analytics", url: "/dashboard/admin/analytics", icon: TrendingUp },
  { title: "Platform", url: "/dashboard/admin/platform", icon: Sliders },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function PlatformSettings() {
  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard">
      <div className="space-y-6">
        <h2 className="font-display font-semibold text-lg text-foreground">Platform Settings</h2>

        <div className="grid grid-cols-1 gap-6 max-w-2xl">
          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-4">General</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Platform Name</label>
                <input defaultValue="KukuConnect" className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Default Currency</label>
                <input defaultValue="TZS" disabled className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Delivery Fees</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Delivery Fee (%)</label>
                <input type="number" defaultValue="10" className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Minimum Order (TZS)</label>
                <input type="number" defaultValue="5000" className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-display font-semibold text-foreground mb-4">Notifications</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-secondary focus:ring-ring" />
                <span className="text-sm text-foreground">Email notifications for new orders</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-secondary focus:ring-ring" />
                <span className="text-sm text-foreground">Auto-approve verified farmers</span>
              </label>
            </div>
          </div>

          <button onClick={() => toast.success("Settings saved")}
            className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity w-fit">
            Save Settings
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
