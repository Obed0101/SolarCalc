import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  onMapClick: (lat: number, lng: number) => void;
}

// Dark monochrome tile layer — CartoDB Dark Matter (free, no key required)
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://carto.com/">CARTO</a>';

export function LocationMap({ lat, lng, zoom = 6, onMapClick }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const ringRef = useRef<L.CircleMarker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR }).addTo(map);

    // Dark theme for zoom controls
    const style = document.createElement("style");
    style.textContent = `.leaflet-control-zoom a{background:#111!important;color:#888!important;border-color:#333!important;width:28px!important;height:28px!important;line-height:28px!important;font-size:14px!important}.leaflet-control-zoom a:hover{background:#222!important;color:#fff!important}`;
    containerRef.current.appendChild(style);

    // White pulsing marker
    const marker = L.circleMarker([lat, lng], {
      radius: 7,
      color: "#fff",
      fillColor: "#fff",
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(map);

    // Outer ring
    const ring = L.circleMarker([lat, lng], {
      radius: 14,
      color: "rgba(255,255,255,0.2)",
      fillColor: "transparent",
      weight: 1,
    }).addTo(map);
    ringRef.current = ring;

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

  // Update marker + view when lat/lng/zoom change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    if (ringRef.current) ringRef.current.setLatLng([lat, lng]);
    const targetZoom = Math.max(zoom, mapRef.current.getZoom());
    mapRef.current.setView([lat, lng], targetZoom, { animate: true });
  }, [lat, lng, zoom]);

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
