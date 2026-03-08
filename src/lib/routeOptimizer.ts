/**
 * Haversine distance between two lat/lng points in km.
 */
export function haversineKm(
  a: [number, number],
  b: [number, number]
): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export interface DeliveryStop {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

/**
 * Nearest-neighbor greedy route optimization.
 * Returns stops in optimized order + total distance in km.
 */
export function optimizeRoute(
  origin: [number, number],
  stops: DeliveryStop[]
): { ordered: DeliveryStop[]; totalKm: number } {
  if (stops.length <= 1) {
    const totalKm = stops.length === 1 ? haversineKm(origin, [stops[0].lat, stops[0].lng]) : 0;
    return { ordered: [...stops], totalKm };
  }

  const remaining = [...stops];
  const ordered: DeliveryStop[] = [];
  let current: [number, number] = origin;
  let totalKm = 0;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current, [remaining[i].lat, remaining[i].lng]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    totalKm += bestDist;
    current = [remaining[bestIdx].lat, remaining[bestIdx].lng];
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }

  return { ordered, totalKm };
}

/**
 * Estimate delivery time based on status and distance.
 * Returns minutes estimate or null if delivered/cancelled.
 */
export function estimateEtaMinutes(
  status: string,
  distanceKm?: number
): number | null {
  // Average speed ~30 km/h in urban Tanzania + buffer
  const AVG_SPEED_KMH = 25;
  const STATUS_BASE_MINUTES: Record<string, number> = {
    pending: 120,
    confirmed: 90,
    processing: 60,
    picked_up: 45,
    in_transit: 0,
  };

  if (["delivered", "cancelled"].includes(status)) return null;

  const base = STATUS_BASE_MINUTES[status] ?? 60;
  const travelMin = distanceKm ? (distanceKm / AVG_SPEED_KMH) * 60 : 30;

  return Math.round(base + (status === "in_transit" ? travelMin : travelMin * 0.5));
}
