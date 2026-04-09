import { useState, useEffect } from "react";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSettingsStore } from "@/stores/settings-store";
import { colors, fonts, statusColor } from "@/lib/hmi-tokens";

const VERSION = "v0.1.0";

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
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
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
  const label = connectionStatus === "ok" ? "ACTIVO" : connectionStatus === "demo" ? "DEMO" : connectionStatus === "warning" ? "ALERTA" : "ERROR";

  return (
    <footer style={{
      height: 28,
      background: colors.bgDeep,
      borderTop: `1px solid ${colors.border}`,
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      gap: 0,
      flexShrink: 0,
      fontFamily: fonts.mono,
    }}>
      {/* Status */}
      <Cell>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: dotColor, display: "inline-block", animation: "hmi-dot-pulse 2s ease-in-out infinite" }} />
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", color: dotColor }}>{label}</span>
      </Cell>
      <Divider />

      {/* Location */}
      <Cell style={{ maxWidth: 180, overflow: "hidden" }}>
        <span style={{ fontSize: 9, color: colors.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{locationName}</span>
        <span style={{ fontSize: 8, color: colors.textTertiary, whiteSpace: "nowrap" }}>{latitude.toFixed(2)}, {longitude.toFixed(2)}</span>
      </Cell>
      <Divider />

      {/* Clock (centered) */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <time style={{ fontSize: 9, color: colors.textPrimary }}>{formatDateTime(now)}</time>
        <span style={{ fontSize: 8, color: colors.textTertiary }}>d{String(dayOfYear(now)).padStart(3, "0")}</span>
      </div>
      <Divider />

      {/* Servo mode */}
      <Cell>
        <span style={{
          fontSize: 7, fontWeight: 700, letterSpacing: "0.1em", color: colors.cyan,
          background: `${colors.cyan}12`, padding: "1px 6px", borderRadius: 3,
        }}>
          {servoMode === "auto" ? "AUTO" : servoMode === "manual" ? "MANUAL" : "MENSUAL"}
        </span>
      </Cell>
      <Divider />

      {/* Version */}
      <span style={{ fontSize: 7, color: colors.textDisabled, padding: "0 4px" }}>{VERSION}</span>
    </footer>
  );
}

function Cell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 8px", ...style }}>{children}</div>;
}

function Divider() {
  return <div style={{ width: 1, height: 12, background: colors.border, flexShrink: 0 }} />;
}
