import { useMemo } from "react";
import { optimizeRoute, DeliveryStop } from "@/lib/routeOptimizer";
import { Route, ArrowRight } from "lucide-react";

interface RouteOptimizerProps {
  origin: [number, number] | null;
  deliveries: any[];
  onSelectOrder: (ordered: DeliveryStop[]) => void;
}

export default function RouteOptimizer({ origin, deliveries, onSelectOrder }: RouteOptimizerProps) {
  const stops: DeliveryStop[] = useMemo(
    () =>
      deliveries
        .filter((d) => d.current_lat && d.current_lng)
        .map((d) => ({
          id: d.id,
          label: d.orders?.order_number || "Delivery",
          lat: Number(d.current_lat),
          lng: Number(d.current_lng),
        })),
    [deliveries]
  );

  const result = useMemo(() => {
    if (!origin || stops.length === 0) return null;
    return optimizeRoute(origin, stops);
  }, [origin, stops]);

  if (!result || result.ordered.length < 2) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Route className="w-4 h-4 text-secondary" /> Optimized Route
        </h3>
        <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
          {result.totalKm.toFixed(1)} km total
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Best delivery order based on nearest-neighbor distance optimization:
      </p>
      <div className="flex items-center flex-wrap gap-1.5">
        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">📍 You</span>
        {result.ordered.map((stop, i) => (
          <div key={stop.id} className="flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium bg-muted text-foreground px-2 py-1 rounded-md">
              {i + 1}. {stop.label}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => onSelectOrder(result.ordered)}
        className="mt-3 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        Apply This Route
      </button>
    </div>
  );
}
