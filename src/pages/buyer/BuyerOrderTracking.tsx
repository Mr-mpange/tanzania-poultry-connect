import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { ShoppingCart, ShoppingBag, MapPin, Heart, MessageSquare, Settings, Loader2, Clock, CheckCircle, Truck, Package, XCircle, Timer } from "lucide-react";
import { estimateEtaMinutes } from "@/lib/routeOptimizer";

const navItems = [
  { title: "Marketplace", url: "/dashboard/buyer", icon: ShoppingCart },
  { title: "My Orders", url: "/dashboard/buyer/orders", icon: ShoppingBag },
  { title: "Order Tracking", url: "/dashboard/buyer/tracking", icon: MapPin },
  { title: "Favorites", url: "/dashboard/buyer/favorites", icon: Heart },
  { title: "Messages", url: "/dashboard/buyer/messages", icon: MessageSquare },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const STATUS_STEPS = ["pending", "confirmed", "processing", "picked_up", "in_transit", "delivered"];
const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock, confirmed: CheckCircle, processing: Package, picked_up: Truck, in_transit: Truck, delivered: CheckCircle, cancelled: XCircle,
};

export default function BuyerOrderTracking() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, [user]);

  const activeOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.status));

  if (loading) return <DashboardLayout navItems={navItems} title="Buyer Dashboard"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Buyer Dashboard">
      <div className="space-y-6">
        <h2 className="font-display font-semibold text-lg text-foreground">Order Tracking</h2>

        {activeOrders.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active orders to track.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Order list */}
            <div className="space-y-3">
              {activeOrders.map(o => (
                <button key={o.id} onClick={() => setSelected(o)}
                  className={`w-full text-left bg-card border rounded-xl p-4 shadow-card transition-all hover:border-secondary/30 ${selected?.id === o.id ? "border-secondary" : "border-border"}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{o.order_number}</p>
                    <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full capitalize">{o.status.replace("_", " ")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">TZS {o.total_amount.toLocaleString()}</p>
                </button>
              ))}
            </div>

            {/* Timeline */}
            {selected && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-card">
                <h3 className="font-display font-semibold text-foreground mb-1">{selected.order_number}</h3>
                <p className="text-sm text-muted-foreground mb-6">TZS {selected.total_amount.toLocaleString()} • {new Date(selected.created_at).toLocaleDateString()}</p>

                <div className="space-y-0">
                  {STATUS_STEPS.map((step, i) => {
                    const currentIdx = STATUS_STEPS.indexOf(selected.status);
                    const isComplete = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    const Icon = STATUS_ICONS[step] || Clock;
                    return (
                      <div key={step} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCurrent ? "bg-secondary text-secondary-foreground" : isComplete ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 ${isComplete ? "bg-secondary/30" : "bg-border"}`} />
                          )}
                        </div>
                        <div className="pt-1">
                          <p className={`text-sm capitalize ${isCurrent ? "font-semibold text-foreground" : isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
