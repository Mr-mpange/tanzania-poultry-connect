import { Package, CheckCircle2, Truck, Clock, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { estimateEtaMinutes, haversineKm } from "@/lib/routeOptimizer";

const STATUS_FLOW = ["pending", "picked_up", "in_transit", "delivered"] as const;
const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: "Pick Up", icon: Package, color: "text-amber-600", bg: "bg-amber-500" },
  picked_up: { label: "Start Ride", icon: Truck, color: "text-blue-600", bg: "bg-blue-500" },
  in_transit: { label: "Complete", icon: CheckCircle2, color: "text-emerald", bg: "bg-emerald" },
  delivered: { label: "Done", icon: CheckCircle2, color: "text-emerald", bg: "bg-emerald" },
};

interface DeliveryCardProps {
  delivery: any;
  isActive: boolean;
  onSelect: () => void;
  onStatusUpdate: (newStatus: string) => void;
  driverPosition?: [number, number] | null;
}

export default function DeliveryCard({ delivery, isActive, onSelect, onStatusUpdate, driverPosition }: DeliveryCardProps) {
  const d = delivery;
  const currentIdx = STATUS_FLOW.indexOf(d.status);
  const nextStatus = STATUS_FLOW[currentIdx + 1];
  const nextConfig = nextStatus ? STATUS_CONFIG[nextStatus] : null;

  // Calculate distance & ETA
  let distanceKm: number | undefined;
  if (driverPosition && d.current_lat && d.current_lng) {
    distanceKm = haversineKm(driverPosition, [d.current_lat, d.current_lng]);
  }
  const etaMinutes = estimateEtaMinutes(d.status, distanceKm);

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`rounded-2xl border-2 transition-all cursor-pointer ${
        isActive ? "border-primary bg-card shadow-lg" : "border-border bg-card/80 shadow-card"
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${d.status === "in_transit" ? "bg-emerald animate-pulse" : d.status === "delivered" ? "bg-emerald" : "bg-amber-500"}`} />
            <span className="font-display font-bold text-foreground text-sm">
              {d.orders?.order_number || `#${d.id.slice(0, 8)}`}
            </span>
          </div>
          {d.orders?.total_amount && (
            <span className="text-sm font-bold text-foreground">
              TZS {d.orders.total_amount.toLocaleString()}
            </span>
          )}
        </div>

        {/* ETA Badge */}
        {etaMinutes !== null && (
          <div className="flex items-center gap-2 bg-secondary/10 rounded-lg px-3 py-1.5 mb-3">
            <Timer className="w-3.5 h-3.5 text-secondary" />
            <span className="text-xs font-semibold text-secondary">
              ETA: {etaMinutes >= 60 ? `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m` : `${etaMinutes} min`}
            </span>
            {distanceKm !== undefined && (
              <span className="text-xs text-muted-foreground ml-auto">
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)} km`}
              </span>
            )}
          </div>
        )}

        {/* Route */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex flex-col items-center gap-0.5 pt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald" />
            <div className="w-0.5 h-6 bg-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pickup</p>
              <p className="text-xs font-medium text-foreground truncate">{d.pickup_location || d.orders?.delivery_address || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Drop-off</p>
              <p className="text-xs font-medium text-foreground truncate">{d.delivery_location || d.orders?.delivery_address || "—"}</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-3">
          {STATUS_FLOW.map((s, idx) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                idx <= currentIdx ? "bg-emerald" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Action button */}
        {nextStatus && nextConfig && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(nextStatus);
            }}
            className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] ${nextConfig.bg} hover:opacity-90`}
          >
            <div className="flex items-center justify-center gap-2">
              <nextConfig.icon className="w-4 h-4" />
              {nextConfig.label === "Pick Up" ? "Confirm Pickup" :
               nextConfig.label === "Start Ride" ? "Start Delivery" :
               nextConfig.label === "Complete" ? "Complete Delivery" : nextConfig.label}
            </div>
          </button>
        )}

        {d.status === "delivered" && (
          <div className="flex items-center justify-center gap-2 py-2 text-emerald">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-bold">Delivered</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
