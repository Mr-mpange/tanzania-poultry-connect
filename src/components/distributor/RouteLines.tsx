import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

interface RouteLinesProps {
  driverPosition: [number, number];
  deliveries: Array<{
    id: string;
    current_lat: number | null;
    current_lng: number | null;
    delivery_location: string | null;
    status: string;
  }>;
}

export default function RouteLines({ driverPosition, deliveries }: RouteLinesProps) {
  const map = useMap();
  const linesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    // Clear old lines
    linesRef.current.forEach(l => l.remove());
    linesRef.current = [];

    const activeDeliveries = deliveries.filter(
      d => ["picked_up", "in_transit"].includes(d.status) && d.current_lat && d.current_lng
    );

    activeDeliveries.forEach((d, i) => {
      const color = i === 0 ? "#10b981" : "#3b82f6";
      const line = L.polyline(
        [driverPosition, [d.current_lat!, d.current_lng!]],
        {
          color,
          weight: 3,
          opacity: 0.7,
          dashArray: "8, 8",
          className: "route-line-animated",
        }
      ).addTo(map);
      linesRef.current.push(line);
    });

    return () => {
      linesRef.current.forEach(l => l.remove());
      linesRef.current = [];
    };
  }, [driverPosition, deliveries, map]);

  return null;
}
