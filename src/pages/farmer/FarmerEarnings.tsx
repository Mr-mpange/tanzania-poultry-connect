import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, ShoppingCart, BarChart3, MessageSquare, DollarSign, Settings, Loader2 } from "lucide-react";

const navItems = [
  { title: "Inventory", url: "/dashboard/farmer", icon: Package },
  { title: "Orders", url: "/dashboard/farmer/orders", icon: ShoppingCart },
  { title: "Analytics", url: "/dashboard/farmer/analytics", icon: BarChart3 },
  { title: "Earnings", url: "/dashboard/farmer/earnings", icon: DollarSign },
  { title: "Messages", url: "/dashboard/farmer/messages", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function FarmerEarnings() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*").eq("farmer_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, [user]);

  const delivered = orders.filter(o => o.status === "delivered");
  const pending = orders.filter(o => !["delivered", "cancelled"].includes(o.status));
  const totalEarned = delivered.reduce((s, o) => s + (o.total_amount || 0), 0);
  const pendingAmount = pending.reduce((s, o) => s + (o.total_amount || 0), 0);

  const monthlyEarnings = useMemo(() => {
    const map: Record<string, number> = {};
    delivered.forEach(o => {
      const m = new Date(o.created_at).toLocaleDateString("en", { month: "short", year: "2-digit" });
      map[m] = (map[m] || 0) + (o.total_amount || 0);
    });
    return Object.entries(map).map(([month, amount]) => ({ month, amount }));
  }, [delivered]);

  if (loading) return <DashboardLayout navItems={navItems} title="Farmer Dashboard"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Farmer Dashboard">
      <div className="space-y-6">
        <h2 className="font-display font-semibold text-lg text-foreground">Earnings & Payments</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="text-2xl font-display font-bold text-secondary mt-1">TZS {totalEarned.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Pending Payments</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">TZS {pendingAmount.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Completed Orders</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{delivered.length}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Payment History</h3>
          {delivered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No completed orders yet.</p>
          ) : (
            <div className="space-y-3">
              {delivered.map(o => (
                <div key={o.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-secondary">+ TZS {o.total_amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
