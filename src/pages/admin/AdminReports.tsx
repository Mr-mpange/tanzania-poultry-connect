import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3, Users, ShoppingCart, FileText, Sliders, TrendingUp, Settings, Loader2 } from "lucide-react";

const navItems = [
  { title: "Overview", url: "/dashboard/admin", icon: BarChart3 },
  { title: "Users", url: "/dashboard/admin/users", icon: Users },
  { title: "Orders", url: "/dashboard/admin/orders", icon: ShoppingCart },
  { title: "Reports", url: "/dashboard/admin/reports", icon: FileText },
  { title: "Analytics", url: "/dashboard/admin/analytics", icon: TrendingUp },
  { title: "Platform", url: "/dashboard/admin/platform", icon: Sliders },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function AdminReports() {
  const [orders, setOrders] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]).then(([{ data: o }, { data: p }]) => {
      setOrders(o || []);
      setProfiles(p || []);
      setLoading(false);
    });
  }, []);

  const recentActivity = [
    ...orders.slice(0, 10).map(o => ({ type: "order", text: `Order ${o.order_number} — ${o.status}`, date: o.created_at })),
    ...profiles.slice(0, 5).map(p => ({ type: "user", text: `${p.full_name || "User"} joined`, date: p.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15);

  if (loading) return <DashboardLayout navItems={navItems} title="Admin Dashboard"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Admin Dashboard">
      <div className="space-y-6">
        <h2 className="font-display font-semibold text-lg text-foreground">Reports & Activity Logs</h2>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${a.type === "order" ? "bg-secondary" : "bg-blue-500"}`} />
                    <p className="text-sm text-foreground">{a.text}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{orders.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{profiles.length}</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
