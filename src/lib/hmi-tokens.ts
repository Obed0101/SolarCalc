/**
 * HMI Design Tokens — Starlink B&W palette + Industrial HMI layout.
 */

export const colors = {
  // Backgrounds (Starlink pure black)
  bgDeep: "#000000",
  bgSurface: "#0A0A0A",
  bgElevated: "#111111",
  bgCard: "#0A0A0A",

  // Borders
  border: "#1E1E1E",
  borderActive: "#333333",

  // Text (Starlink white)
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0A0",
  textTertiary: "#666666",
  textDisabled: "#333333",

  // Semantic accents
  cyan: "#00BCD4",      // target, setpoint, reference
  green: "#00D26A",     // ok, producing, connected
  amber: "#FFB800",     // warning, adjust, current month
  red: "#FF3B30",       // fault, error, loss

  // Gauge specific
  gaugeTrack: "#1A1A1A",
  gaugeGlow: (color: string, opacity = 0.3) => `rgba(${hexToRgb(color)}, ${opacity})`,
} as const;

export const fonts = {
  mono: "'JetBrains Mono', 'SF Mono', monospace",
  primary: "'Inter', -apple-system, sans-serif",
} as const;

export const typography = {
  hero: { fontSize: 64, fontWeight: 200, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums" as const, color: colors.textPrimary, lineHeight: 1 },
  gaugeNumber: { fontSize: 36, fontWeight: 200, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums" as const, color: colors.textPrimary, lineHeight: 1 },
  miniGaugeNumber: { fontSize: 28, fontWeight: 200, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums" as const, color: colors.textPrimary },
  label: { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: colors.textTertiary },
  unit: { fontSize: 12, fontWeight: 300, color: colors.textSecondary },
  statusText: { fontSize: 10, fontFamily: fonts.mono, color: colors.textTertiary },
  timestamp: { fontSize: 11, fontWeight: 500, fontFamily: fonts.mono, color: colors.textSecondary },
} as const;

export const card: React.CSSProperties = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: 16,
  transition: "border-color 0.15s",
};

export const gauge = {
  arcDegrees: 240,
  arcStart: 150,
  arcEnd: 390,
  trackWidth: 8,
  arcWidth: 6,
  needleSpring: { type: "spring" as const, stiffness: 120, damping: 18 },
  semiArcDegrees: 180,
  semiTrackWidth: 6,
  semiArcWidth: 4,
} as const;

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export function statusColor(status: "ok" | "demo" | "warning" | "error"): string {
  return status === "ok" ? colors.green
    : status === "demo" ? colors.amber
    : status === "warning" ? colors.amber
    : colors.red;
}

export function thresholdColor(value: number, good: number, warn: number): string {
  if (value >= good) return colors.green;
  if (value >= warn) return colors.amber;
  return colors.red;
}
