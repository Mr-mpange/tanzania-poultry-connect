import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { ShoppingCart, ShoppingBag, MapPin, Heart, MessageSquare, Settings, Loader2, Clock, CheckCircle, Truck, Package, XCircle, Timer, Radio } from "lucide-react";
import { estimateEtaMinutes, haversineKm } from "@/lib/routeOptimizer";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const AnyMapContainer = MapContainer as any;
const AnyTileLayer = TileLayer as any;

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

// Simple map component showing driver location
function DriverLocationMap({ delivery }: { delivery: any }) {
  if (!delivery?.current_lat || !delivery?.current_lng) {
    return (
      <div className="bg-muted/50 rounded-xl p-6 text-center border border-border">
        <Truck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Driver location will appear once delivery starts</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height: 200 }}>
      <AnyMapContainer
        center={[delivery.current_lat, delivery.current_lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <AnyTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </AnyMapContainer>
    </div>
  );
}

export default function BuyerOrderTracking() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: ordersData }, { data: delsData }] = await Promise.all([
      supabase.from("orders").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("deliveries").select("*").in("status", ["pending", "picked_up", "in_transit"]),
    ]);
    setOrders(ordersData || []);
    setDeliveries(delsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (!user) return;

    // Subscribe to realtime delivery updates for buyer's orders
    const channel = supabase
      .channel("buyer-tracking")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "deliveries",
      }, () => fetchData())
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `buyer_id=eq.${user.id}`,
      }, () => fetchData())
      .subscribe();

    // Poll for driver location updates every 15s
    const poll = setInterval(fetchData, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [user]);

  const getDeliveryForOrder = (orderId: string) => {
    return deliveries.find(d => d.order_id === orderId);
  };

  const activeOrders = orders.filter(o => !["delivered", "cancelled"].includes(o.status));

  if (loading) return <DashboardLayout navItems={navItems} title="Buyer Dashboard"><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div></DashboardLayout>;

  const selectedDelivery = selected ? getDeliveryForOrder(selected.id) : null;

  // Calculate ETA with distance if driver location is available
  const getEtaForOrder = (order: any) => {
    const del = getDeliveryForOrder(order.id);
    let distKm: number | undefined;
    if (del?.current_lat && del?.current_lng) {
      // Approximate: use distance from driver to some reference
      distKm = undefined; // We don't know buyer location, use status-based ETA
    }
    return estimateEtaMinutes(order.status, distKm);
  };

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
              {activeOrders.map(o => {
                const del = getDeliveryForOrder(o.id);
                const eta = getEtaForOrder(o);
                const isInTransit = ["picked_up", "in_transit"].includes(o.status);
                return (
                  <button key={o.id} onClick={() => setSelected(o)}
                    className={`w-full text-left bg-card border rounded-xl p-4 shadow-card transition-all hover:border-secondary/30 ${selected?.id === o.id ? "border-secondary" : "border-border"}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{o.order_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        isInTransit ? "bg-emerald/10 text-emerald" : "bg-secondary/10 text-secondary"
                      }`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">TZS {o.total_amount.toLocaleString()}</p>
                    
                    {/* Live driver indicator */}
                    {isInTransit && del?.current_lat && (
                      <div className="flex items-center gap-1.5 mt-2 text-emerald">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span className="text-xs font-medium">Driver is live</span>
                        {del.last_location_update && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(del.last_location_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {eta !== null && (
                      <p className="text-xs text-secondary flex items-center gap-1 mt-1">
                        <Timer className="w-3 h-3" />
                        ETA: {eta >= 60 ? `${Math.floor(eta / 60)}h ${eta % 60}m` : `${eta} min`}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{selected.order_number}</h3>
                  <p className="text-sm text-muted-foreground">TZS {selected.total_amount.toLocaleString()} • {new Date(selected.created_at).toLocaleDateString()}</p>
                </div>

                {/* ETA banner */}
                {(() => {
                  const eta = getEtaForOrder(selected);
                  return eta !== null ? (
                    <div className="flex items-center gap-2 bg-secondary/10 text-secondary rounded-lg px-3 py-2">
                      <Timer className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Estimated delivery: {eta >= 60 ? `${Math.floor(eta / 60)}h ${eta % 60}m` : `${eta} min`}
                      </span>
                    </div>
                  ) : null;
                })()}

                {/* Live driver map */}
                {["picked_up", "in_transit"].includes(selected.status) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Driver Location</p>
                    <DriverLocationMap delivery={selectedDelivery} />
                  </div>
                )}

                {/* Timeline */}
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
