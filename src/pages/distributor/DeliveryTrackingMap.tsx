import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Truck, Navigation, DollarSign, MessageSquare, Car, Settings, Loader2, Radio } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import DeliveryCard from "@/components/distributor/DeliveryCard";
import DriverMarker from "@/components/distributor/DriverMarker";
import RouteLines from "@/components/distributor/RouteLines";

const AnyMapContainer = MapContainer as any;
const AnyTileLayer = TileLayer as any;
const AnyMarker = Marker as any;
const AnyPopup = Popup as any;

const navItems = [
  { title: "Deliveries", url: "/dashboard/distributor", icon: Truck },
  { title: "Route Map", url: "/dashboard/distributor/routes", icon: Navigation },
  { title: "Earnings", url: "/dashboard/distributor/earnings", icon: DollarSign },
  { title: "Messages", url: "/dashboard/distributor/messages", icon: MessageSquare },
  { title: "Vehicles", url: "/dashboard/distributor/vehicles", icon: Car },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const dropoffIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function DeliveryTrackingMap() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPosition, setMyPosition] = useState<[number, number] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"starting" | "active" | "error">("starting");
  const watchIdRef = useRef<number | null>(null);

  const fetchDeliveries = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("deliveries")
      .select("*, orders(order_number, delivery_address, total_amount)")
      .eq("distributor_id", user.id)
      .in("status", ["pending", "picked_up", "in_transit"])
      .order("created_at", { ascending: false });
    setDeliveries(data || []);
    setLoading(false);
  }, [user]);

  // Auto-start GPS tracking on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      toast.error("Geolocation not supported");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMyPosition([latitude, longitude]);
        setGpsStatus("active");
      },
      (err) => {
        setGpsStatus("error");
        console.error("GPS error:", err.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Push location to DB every 10s when we have active deliveries
  useEffect(() => {
    if (!myPosition || !user) return;
    const activeInTransit = deliveries.filter(d => ["picked_up", "in_transit"].includes(d.status));
    if (activeInTransit.length === 0) return;

    const interval = setInterval(async () => {
      if (!myPosition) return;
      await supabase
        .from("deliveries")
        .update({
          current_lat: myPosition[0],
          current_lng: myPosition[1],
          last_location_update: new Date().toISOString(),
        } as any)
        .eq("distributor_id", user.id)
        .in("status", ["picked_up", "in_transit"]);
    }, 10000);

    // Push immediately
    supabase
      .from("deliveries")
      .update({
        current_lat: myPosition[0],
        current_lng: myPosition[1],
        last_location_update: new Date().toISOString(),
      } as any)
      .eq("distributor_id", user.id)
      .in("status", ["picked_up", "in_transit"]);

    return () => clearInterval(interval);
  }, [myPosition, user, deliveries]);

  // Fetch deliveries + realtime
  useEffect(() => {
    fetchDeliveries();
    if (!user) return;
    const channel = supabase
      .channel("delivery-tracking")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "deliveries",
        filter: `distributor_id=eq.${user.id}`,
      }, () => fetchDeliveries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchDeliveries]);

  const updateDeliveryStatus = async (delivery: any, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "picked_up") updates.picked_up_at = new Date().toISOString();
    if (newStatus === "delivered") updates.delivered_at = new Date().toISOString();

    await supabase.from("deliveries").update(updates).eq("id", delivery.id);

    const orderStatusMap: Record<string, string> = {
      picked_up: "picked_up",
      in_transit: "in_transit",
      delivered: "delivered",
    };
    if (orderStatusMap[newStatus]) {
      await supabase.from("orders").update({ status: orderStatusMap[newStatus] as any }).eq("id", delivery.order_id);
    }

    const labels: Record<string, string> = {
      picked_up: "Picked up! Start delivery when ready.",
      in_transit: "On the way! Drive safely.",
      delivered: "Delivered! Great job 🎉",
    };
    toast.success(labels[newStatus] || "Status updated");
    fetchDeliveries();
  };

  const defaultCenter: [number, number] = [-6.7924, 39.2083];
  const mapCenter = myPosition || defaultCenter;

  return (
    <DashboardLayout navItems={navItems} title="Distributor Dashboard">
      <div className="relative">
        {/* GPS Status indicator */}
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border shadow-lg">
          <div className={`w-2 h-2 rounded-full ${
            gpsStatus === "active" ? "bg-emerald animate-pulse" : 
            gpsStatus === "starting" ? "bg-amber-500 animate-pulse" : "bg-destructive"
          }`} />
          <span className="text-xs font-medium text-foreground">
            {gpsStatus === "active" ? "Live" : gpsStatus === "starting" ? "Connecting..." : "GPS Off"}
          </span>
          {gpsStatus === "active" && <Radio className="w-3 h-3 text-emerald" />}
        </div>

        {/* Map */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-border shadow-card" style={{ height: "55vh", minHeight: 400 }}>
            <AnyMapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom zoomControl={false}>
              <AnyTileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {myPosition && <DriverMarker position={myPosition} followDriver={!selectedId} />}
              {myPosition && <RouteLines driverPosition={myPosition} deliveries={deliveries} />}

              {deliveries.filter(d => d.current_lat && d.current_lng).map(d => (
                <AnyMarker key={d.id} position={[d.current_lat, d.current_lng]} icon={dropoffIcon}>
                  <AnyPopup>
                    <div className="text-sm space-y-1">
                      <p className="font-semibold">🚚 {d.orders?.order_number || "Delivery"}</p>
                      <p className="text-xs capitalize">{d.status.replace("_", " ")}</p>
                    </div>
                  </AnyPopup>
                </AnyMarker>
              ))}
            </AnyMapContainer>
          </div>
        )}

        {/* Delivery Cards - Bolt style bottom panel */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-foreground text-base">
              Active Deliveries ({deliveries.length})
            </h3>
            {deliveries.some(d => d.status === "in_transit") && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald bg-emerald/10 px-2.5 py-1 rounded-full">
                <Radio className="w-3 h-3 animate-pulse" /> On Route
              </span>
            )}
          </div>

          {deliveries.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <Truck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active deliveries. Claim orders from the dashboard!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deliveries.map(d => (
                <DeliveryCard
                  key={d.id}
                  delivery={d}
                  isActive={selectedId === d.id}
                  onSelect={() => setSelectedId(selectedId === d.id ? null : d.id)}
                  onStatusUpdate={(newStatus) => updateDeliveryStatus(d, newStatus)}
                  driverPosition={myPosition}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
