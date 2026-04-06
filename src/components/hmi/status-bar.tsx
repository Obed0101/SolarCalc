import { useState, useEffect } from "react";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSettingsStore } from "../../stores/settings-store";
import { colors, fonts, statusColor } from "../../lib/hmi-tokens";

const VERSION = "v0.1.0";

const divider: React.CSSProperties = {
  width: 1,
  height: 16,
  background: "#1e2230",
  flexShrink: 0,
};

function formatCoord(lat: number, lng: number): string {
  return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
}

function formatDateTime(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${mo}-${day} ${h}:${mi}:${s}`;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

function servoModeLabel(mode: "auto" | "manual" | "monthly"): string {
  if (mode === "auto") return "AUTO";
  if (mode === "manual") return "MANUAL";
  return "MENSUAL";
}

export default function StatusBar() {
  const connectionStatus = useRuntimeStore((s) => s.connectionStatus);
  const servoMode = useRuntimeStore((s) => s.servoMode);
  const locationName = useSettingsStore((s) => s.locationName);
  const latitude = useSettingsStore((s) => s.latitude);
  const longitude = useSettingsStore((s) => s.longitude);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dotColor = statusColor(connectionStatus);
  const statusLabel = connectionStatus === "ok" ? "SISTEMA ACTIVO"
    : connectionStatus === "demo" ? "MODO DEMO"
    : connectionStatus === "warning" ? "ADVERTENCIA"
    : "ERROR SISTEMA";
  const doy = dayOfYear(now);

  return (
    <footer
      role="status"
      aria-label="Barra de estado del sistema"
      style={{
        height: 32,
        background: "#0a0c10",
        borderTop: "1px solid #1e2230",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        flexShrink: 0,
        width: "100%",
        zIndex: 50,
      }}
    >
      {/* LEFT: Connection status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: dotColor,
            display: "inline-block",
            animation: "hmi-dot-pulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontFamily: fonts.mono,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: dotColor,
            lineHeight: 1,
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div style={divider} aria-hidden="true" />

      {/* CENTER-LEFT: Zone + coordinates */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontFamily: fonts.primary,
            color: colors.textSecondary,
            lineHeight: 1,
          }}
        >
          {locationName}
        </span>
        <span
          style={{
            fontSize: 9,
            fontFamily: fonts.mono,
            color: colors.textTertiary,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {formatCoord(latitude, longitude)}
        </span>
      </div>

      <div style={divider} aria-hidden="true" />

      {/* CENTER: Date/time + day of year */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }}>
        <time
          dateTime={now.toISOString()}
          style={{
            fontSize: 10,
            fontFamily: fonts.mono,
            fontVariantNumeric: "tabular-nums",
            color: colors.textPrimary,
            lineHeight: 1,
          }}
        >
          {formatDateTime(now)}
        </time>
        <span
          style={{
            fontSize: 9,
            fontFamily: fonts.mono,
            color: colors.textTertiary,
            lineHeight: 1,
          }}
        >
          d{String(doy).padStart(3, "0")}
        </span>
      </div>

      <div style={divider} aria-hidden="true" />

      {/* CENTER-RIGHT: Servo mode badge */}
      <div
        style={{
          fontSize: 8,
          fontFamily: fonts.mono,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: colors.cyan,
          background: "rgba(0, 188, 212, 0.08)",
          padding: "2px 8px",
          borderRadius: 4,
          lineHeight: 1.4,
        }}
      >
        {servoModeLabel(servoMode)}
      </div>

      <div style={divider} aria-hidden="true" />

      {/* RIGHT: Version */}
      <span
        style={{
          fontSize: 8,
          fontFamily: fonts.mono,
          color: "#333",
          lineHeight: 1,
        }}
      >
        {VERSION}
      </span>
    </footer>
  );
}
