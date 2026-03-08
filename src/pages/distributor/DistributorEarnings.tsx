import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Truck, Navigation, DollarSign, MessageSquare, Car, Settings, Loader2 } from "lucide-react";

const navItems = [
  { title: "Deliveries", url: "/dashboard/distributor", icon: Truck },
  { title: "Route Map", url: "/dashboard/distributor/routes", icon: Navigation },
  { title: "Earnings", url: "/dashboard/distributor/earnings", icon: DollarSign },
  { title: "Messages", url: "/dashboard/distributor/messages", icon: MessageSquare },
  { title: "Vehicles", url: "/dashboard/distributor/vehicles", icon: Car },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function DistributorEarnings() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("deliveries").select("*").eq("distributor_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("distributor_id", user.id),
    ]).then(([{ data: d }, { data: o }]) => {
      setDeliveries(d || []);
      setOrders(o || []);
      setLoading(false);
    });
  }, [user]);

  const completed = deliveries.filter(d => d.status === "delivered");
  const totalEarned = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total_amount || 0) * 0.1, 0); // 10% delivery fee estimate

  if (loading) return <DashboardLayout navItems={navItems} title="Distributor Dashboard"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Distributor Dashboard">
      <div className="space-y-6">
        <h2 className="font-display font-semibold text-lg text-foreground">Earnings & History</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Est. Earnings</p>
            <p className="text-2xl font-display font-bold text-secondary mt-1">TZS {Math.round(totalEarned).toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Completed Deliveries</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{completed.length}</p>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-card border border-border">
            <p className="text-sm text-muted-foreground">Active Deliveries</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{deliveries.filter(d => d.status !== "delivered").length}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Delivery History</h3>
          {completed.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No completed deliveries yet.</p>
          ) : (
            <div className="space-y-3">
              {completed.map(d => (
                <div key={d.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.pickup_location} → {d.delivery_location}</p>
                    <p className="text-xs text-muted-foreground">{d.delivered_at ? new Date(d.delivered_at).toLocaleDateString() : "—"}</p>
                  </div>
                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">Completed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
