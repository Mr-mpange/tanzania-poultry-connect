import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Truck, Package, MapPin, CheckCircle, Clock, Navigation, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { title: "Deliveries", url: "/dashboard/distributor", icon: Truck },
  { title: "Route Map", url: "/dashboard/distributor/routes", icon: Navigation },
];

function KPICard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card rounded-xl p-5 shadow-card border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

const STATUS_FLOW = ["pending", "picked_up", "in_transit", "delivered"] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Pickup",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  picked_up: "bg-blue-100 text-blue-600",
  in_transit: "bg-purple-100 text-purple-600",
  delivered: "bg-emerald/10 text-emerald",
};

export default function DistributorDashboard() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isRoutesPage = window.location.pathname.includes("/routes");

  const fetchData = async () => {
    if (!user) return;
    const [{ data: dels }, { data: orders }] = await Promise.all([
      supabase.from("deliveries").select("*").eq("distributor_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").is("distributor_id", null).in("status", ["confirmed", "processing"]).order("created_at", { ascending: false }),
    ]);
    setDeliveries(dels || []);
    setAvailableOrders(orders || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const claimOrder = async (order: any) => {
    try {
      // Assign distributor to order
      await supabase.from("orders").update({ distributor_id: user!.id, status: "processing" as const }).eq("id", order.id);
      // Create delivery record
      await supabase.from("deliveries").insert({
        order_id: order.id,
        distributor_id: user!.id,
        pickup_location: order.delivery_address || "TBD",
        delivery_location: order.delivery_address || "TBD",
        status: "pending",
      });
      toast.success(`Claimed order ${order.order_number}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateDeliveryStatus = async (delivery: any, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "picked_up") updates.picked_up_at = new Date().toISOString();
    if (newStatus === "delivered") updates.delivered_at = new Date().toISOString();

    await supabase.from("deliveries").update(updates).eq("id", delivery.id);

    // Also update order status
    const orderStatusMap: Record<string, string> = {
      picked_up: "picked_up",
      in_transit: "in_transit",
      delivered: "delivered",
    };
    if (orderStatusMap[newStatus]) {
      await supabase.from("orders").update({ status: orderStatusMap[newStatus] as any }).eq("id", delivery.order_id);
    }

    toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
    fetchData();
  };

  const activeDeliveries = deliveries.filter(d => d.status !== "delivered");
  const completedDeliveries = deliveries.filter(d => d.status === "delivered");

  return (
    <DashboardLayout navItems={navItems} title="Distributor Dashboard">
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald" /></div>
      ) : isRoutesPage ? (
        <div className="space-y-6">
          <h2 className="font-display font-semibold text-lg text-foreground">Active Routes</h2>
          {activeDeliveries.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card">
              <Navigation className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No active routes. Claim orders to start delivering!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDeliveries.map((d, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-5 shadow-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-display font-semibold text-foreground">Delivery #{d.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Order: {d.order_id.slice(0, 8)}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[d.status]}`}>
                      {STATUS_LABELS[d.status]}
                    </span>
                  </div>

                  {/* Route visualization */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-1 bg-muted/50 rounded-lg p-3">
                      <MapPin className="w-4 h-4 text-emerald flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pickup</p>
                        <p className="text-sm text-foreground font-medium">{d.pickup_location || "—"}</p>
                      </div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="flex items-center gap-2 flex-1 bg-muted/50 rounded-lg p-3">
                      <MapPin className="w-4 h-4 text-destructive flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Delivery</p>
                        <p className="text-sm text-foreground font-medium">{d.delivery_location || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status progression */}
                  <div className="flex gap-1">
                    {STATUS_FLOW.map((s, idx) => {
                      const currentIdx = STATUS_FLOW.indexOf(d.status as any);
                      const isNext = idx === currentIdx + 1;
                      const isDone = idx <= currentIdx;
                      return (
                        <button key={s} disabled={!isNext}
                          onClick={() => isNext && updateDeliveryStatus(d, s)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                            isDone ? "bg-emerald/20 text-emerald" : isNext ? "bg-emerald text-accent-foreground hover:bg-emerald-light cursor-pointer" : "bg-muted text-muted-foreground"
                          }`}>
                          {STATUS_LABELS[s]}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Active Deliveries" value={activeDeliveries.length} icon={Truck} color="bg-emerald/10 text-emerald" />
            <KPICard label="Completed" value={completedDeliveries.length} icon={CheckCircle} color="bg-blue-100 text-blue-600" />
            <KPICard label="Available Orders" value={availableOrders.length} icon={Package} color="bg-amber-100 text-amber-600" />
            <KPICard label="Pending Pickup" value={activeDeliveries.filter(d => d.status === "pending").length} icon={Clock} color="bg-purple-100 text-purple-600" />
          </div>

          {/* Available Orders to Claim */}
          {availableOrders.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-semibold text-lg text-foreground">Available Orders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableOrders.map((order) => (
                  <div key={order.id} className="bg-card border border-border rounded-xl p-4 shadow-card">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-foreground text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.delivery_address || "No address"}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">TZS {order.total_amount.toLocaleString()}</p>
                    </div>
                    <button onClick={() => claimOrder(order)}
                      className="w-full mt-2 bg-emerald text-accent-foreground py-2 rounded-lg text-xs font-medium hover:bg-emerald-light transition-colors">
                      Claim Delivery
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Deliveries */}
          <div className="space-y-3">
            <h2 className="font-display font-semibold text-lg text-foreground">My Deliveries</h2>
            {deliveries.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
                <Truck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No deliveries yet. Claim available orders above!</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Delivery</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Pickup</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Destination</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map((d) => {
                        const currentIdx = STATUS_FLOW.indexOf(d.status as any);
                        const nextStatus = STATUS_FLOW[currentIdx + 1];
                        return (
                          <tr key={d.id} className="border-b border-border hover:bg-muted/30">
                            <td className="p-3 font-medium text-foreground">#{d.id.slice(0, 8)}</td>
                            <td className="p-3 text-muted-foreground">{d.pickup_location || "—"}</td>
                            <td className="p-3 text-muted-foreground">{d.delivery_location || "—"}</td>
                            <td className="p-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>
                                {STATUS_LABELS[d.status]}
                              </span>
                            </td>
                            <td className="p-3">
                              {nextStatus ? (
                                <button onClick={() => updateDeliveryStatus(d, nextStatus)}
                                  className="bg-emerald text-accent-foreground px-3 py-1 rounded-lg text-xs font-medium hover:bg-emerald-light transition-colors">
                                  {STATUS_LABELS[nextStatus]}
                                </button>
                              ) : (
                                <span className="text-xs text-emerald font-medium">✓ Done</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
