import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Truck, Navigation, DollarSign, MessageSquare, Car, Settings, Loader2, MapPin, Radio } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

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

const deliveryIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
}

export default function DeliveryTrackingMap() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const [myPosition, setMyPosition] = useState<[number, number] | null>(null);

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

  useEffect(() => {
    fetchDeliveries();

    // Subscribe to realtime changes
    if (!user) return;
    const channel = supabase
      .channel("delivery-tracking")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "deliveries",
        filter: `distributor_id=eq.${user.id}`,
      }, () => fetchDeliveries())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchDeliveries]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }
    setTracking(true);
    toast.success("Live tracking started");

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMyPosition([latitude, longitude]);

        // Update all active deliveries with current position
        if (user) {
          await supabase
            .from("deliveries")
            .update({
              current_lat: latitude,
              current_lng: longitude,
              last_location_update: new Date().toISOString(),
            } as any)
            .eq("distributor_id", user.id)
            .in("status", ["picked_up", "in_transit"]);
        }
      },
      (err) => {
        toast.error(`Location error: ${err.message}`);
        setTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    toast.info("Tracking stopped");
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Default center: Dar es Salaam, Tanzania
  const defaultCenter: [number, number] = [-6.7924, 39.2083];
  const mapCenter = myPosition || defaultCenter;

  const markerPositions: [number, number][] = [];
  if (myPosition) markerPositions.push(myPosition);
  deliveries.forEach(d => {
    if (d.current_lat && d.current_lng) markerPositions.push([d.current_lat, d.current_lng]);
  });

  return (
    <DashboardLayout navItems={navItems} title="Distributor Dashboard">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
            <Navigation className="w-5 h-5 text-secondary" /> Delivery Tracking Map
          </h2>
          <div className="flex items-center gap-2">
            {tracking ? (
              <button onClick={stopTracking}
                className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                <Radio className="w-4 h-4 animate-pulse" /> Stop Tracking
              </button>
            ) : (
              <button onClick={startTracking}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
                <MapPin className="w-4 h-4" /> Start Live Tracking
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card" style={{ height: "500px" }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markerPositions.length > 0 && <FitBounds positions={markerPositions} />}

              {myPosition && (
                <Marker position={myPosition} icon={deliveryIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">📍 Your Location</p>
                      <p className="text-xs text-gray-500">
                        {myPosition[0].toFixed(5)}, {myPosition[1].toFixed(5)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {deliveries.filter(d => d.current_lat && d.current_lng).map(d => (
                <Marker key={d.id} position={[d.current_lat, d.current_lng]} icon={deliveryIcon}>
                  <Popup>
                    <div className="text-sm space-y-1">
                      <p className="font-semibold">🚚 {d.orders?.order_number || "Delivery"}</p>
                      <p className="text-xs">Status: <span className="capitalize">{d.status.replace("_", " ")}</span></p>
                      {d.orders?.delivery_address && (
                        <p className="text-xs">To: {d.orders.delivery_address}</p>
                      )}
                      {d.orders?.total_amount && (
                        <p className="text-xs">Amount: TZS {d.orders.total_amount.toLocaleString()}</p>
                      )}
                      {d.last_location_update && (
                        <p className="text-xs text-gray-400">
                          Updated: {new Date(d.last_location_update).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Active deliveries list */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-3">Active Deliveries ({deliveries.length})</h3>
          {deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No active deliveries at the moment.</p>
          ) : (
            <div className="space-y-2">
              {deliveries.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.orders?.order_number || "Delivery"}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.orders?.delivery_address || "No address"} · <span className="capitalize">{d.status.replace("_", " ")}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    {d.last_location_update ? (
                      <p className="text-xs text-muted-foreground">
                        Last update: {new Date(d.last_location_update).toLocaleTimeString()}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/50">No GPS data</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
