import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const DRIVER_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="#10b981" stroke="#fff" stroke-width="3"/>
  <circle cx="24" cy="24" r="8" fill="#fff"/>
  <circle cx="24" cy="24" r="4" fill="#10b981"/>
</svg>`;

const driverIcon = L.divIcon({
  html: DRIVER_ICON_SVG,
  className: "driver-marker-icon",
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

interface DriverMarkerProps {
  position: [number, number];
  followDriver?: boolean;
}

export default function DriverMarker({ position, followDriver = true }: DriverMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!markerRef.current) {
      markerRef.current = L.marker(position, { icon: driverIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup("You are here");
    } else {
      // Smooth move
      const current = markerRef.current.getLatLng();
      const target = L.latLng(position[0], position[1]);
      if (current.distanceTo(target) > 1) {
        markerRef.current.setLatLng(target);
      }
    }

    if (followDriver) {
      map.setView(position, map.getZoom(), { animate: true });
    }

    return () => {};
  }, [position, map, followDriver]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, []);

  return null;
}
