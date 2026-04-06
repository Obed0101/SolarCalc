import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  lat: number;
  lng: number;
  onMapClick: (lat: number, lng: number) => void;
}

// Dark monochrome tile layer — Stadia Alidade Smooth Dark (free, no key for low traffic)
const TILE_URL = "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://stadiamaps.com/">Stadia</a>';

export function LocationMap({ lat, lng, onMapClick }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR }).addTo(map);

    // White pulsing marker
    const marker = L.circleMarker([lat, lng], {
      radius: 7,
      color: "#fff",
      fillColor: "#fff",
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(map);

    // Outer ring
    L.circleMarker([lat, lng], {
      radius: 14,
      color: "rgba(255,255,255,0.2)",
      fillColor: "transparent",
      weight: 1,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Fix leaflet container sizing
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker + view when lat/lng change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom(), { animate: true });
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#0A0A0A",
      }}
    />
  );
}
