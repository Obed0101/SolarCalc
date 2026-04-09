import { useMemo } from "react";
import { motion } from "framer-motion";
import { sunriseHour, sunsetHour, sunProgress, formatHour } from "@/lib/solar";
import { colors, fonts } from "@/lib/hmi-tokens";
import { AnimatedNumber } from "@/components/shared/animated-number";

interface SunArcProps {
  latitude: number;
  day: number;
  currentWatts: number;
  peakWatts: number;
  efficiency: number;
  harvestedKwh: number;
  expectedKwh: number;
}

// Bezier control points
const P1 = { x: 40, y: 120 };
const CP = { x: 400, y: 10 };
const P2 = { x: 760, y: 120 };

const ARC_PATH = `M ${P1.x} ${P1.y} Q ${CP.x} ${CP.y} ${P2.x} ${P2.y}`;

// Harvest bar geometry
const BAR_Y = 152;
const BAR_HEIGHT = 4;
const BAR_LEFT = 40;
const BAR_RIGHT = 760;
const BAR_WIDTH = BAR_RIGHT - BAR_LEFT;

/** Quadratic bezier interpolation at parameter t (0-1) */
function bezierPoint(t: number): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * P1.x + 2 * mt * t * CP.x + t * t * P2.x,
    y: mt * mt * P1.y + 2 * mt * t * CP.y + t * t * P2.y,
  };
}

/** Build a partial bezier path from t=0 to t=end using line segments */
function partialArcPath(end: number): string {
  if (end <= 0) return "";
  const steps = Math.max(2, Math.round(end * 60));
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * end;
    const p = bezierPoint(t);
    points.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
  }
  return `M ${points[0]} L ${points.slice(1).join(" L ")}`;
}

const GRADIENT_ID = "sun-arc-gradient";
const GLOW_ID = "sun-arc-glow";
const HARVEST_GRADIENT_ID = "sun-arc-harvest-grad";

export default function SunArc({
  latitude,
  day,
  currentWatts,
  peakWatts,
  efficiency,
  harvestedKwh,
  expectedKwh,
}: SunArcProps) {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const sunrise = sunriseHour(latitude, day);
  const sunset = sunsetHour(latitude, day);
  const progress = sunProgress(latitude, day, currentHour);

  const isNight = progress <= 0 || progress >= 1;
  const showSunDot = !isNight && progress > 0.02 && progress < 0.98;

  const sunPos = useMemo(() => bezierPoint(progress), [progress]);
  const noonPos = useMemo(() => bezierPoint(0.5), []);
  const filledPath = useMemo(() => partialArcPath(progress), [progress]);

  const harvestRatio = expectedKwh > 0
    ? Math.min(harvestedKwh / expectedKwh, 1)
    : 0;

  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Label position offset from sun dot
  const labelX = sunPos.x + 14;
  const labelY = sunPos.y - 30;

  return (
    <div style={{ width: "100%", position: "relative" }} role="img" aria-label={`Arco solar: ${isNight ? "noche" : `${currentWatts}W a las ${timeStr}`}`}>
      <svg
        viewBox="0 0 800 178"
        style={{ width: "100%", height: "auto", display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Arc gradient */}
          <linearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFB800" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>

          {/* Sun dot glow */}
          <filter id={GLOW_ID} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#FFB800" floodOpacity="0.4" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Harvest bar gradient */}
          <linearGradient id={HARVEST_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFB800" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>

        {/* Horizon labels (above harvest bar) */}
        <text
          x={P1.x}
          y={BAR_Y - 18}
          textAnchor="middle"
          style={{
            fontSize: 8,
            fontFamily: fonts.mono,
            fill: "#444",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
          }}
        >
          AMANECER
        </text>
        <text
          x={P2.x}
          y={BAR_Y - 18}
          textAnchor="middle"
          style={{
            fontSize: 8,
            fontFamily: fonts.mono,
            fill: "#444",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
          }}
        >
          OCASO
        </text>

        {/* Arc track (dashed) */}
        <path
          d={ARC_PATH}
          fill="none"
          stroke={colors.border}
          strokeWidth="2"
          strokeDasharray="6 4"
          style={{ opacity: isNight ? 0.2 : 1 }}
        />

        {/* Arc filled (sunrise to current position) */}
        {showSunDot && filledPath && (
          <motion.path
            d={filledPath}
            fill="none"
            stroke={`url(#${GRADIENT_ID})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        {/* Noon peak marker */}
        <line
          x1={noonPos.x}
          y1={noonPos.y - 8}
          x2={noonPos.x}
          y2={noonPos.y + 8}
          stroke={colors.border}
          strokeWidth="1"
          style={{ opacity: isNight ? 0.2 : 0.5 }}
        />
        {!isNight && (
          <text
            x={noonPos.x}
            y={noonPos.y - 12}
            textAnchor="middle"
            style={{
              fontSize: 9,
              fontFamily: fonts.mono,
              fill: colors.textTertiary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {peakWatts}W pk
          </text>
        )}

        {/* Sunrise time label (above bar) */}
        <text
          x={P1.x}
          y={BAR_Y - 8}
          textAnchor="middle"
          style={{
            fontSize: 9,
            fontFamily: fonts.mono,
            fill: colors.textTertiary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatHour(sunrise)}
        </text>

        {/* Sunset time label (above bar) */}
        <text
          x={P2.x}
          y={BAR_Y - 8}
          textAnchor="middle"
          style={{
            fontSize: 9,
            fontFamily: fonts.mono,
            fill: colors.textTertiary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatHour(sunset)}
        </text>

        {/* Sun dot with glow (hidden near sunrise/sunset edges) */}
        {showSunDot && (
          <motion.circle
            cx={sunPos.x}
            cy={sunPos.y}
            r="8"
            fill={colors.amber}
            filter={`url(#${GLOW_ID})`}
            style={{ animation: "hmi-pulse 3s ease-in-out infinite" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        {/* Current data label (day only, same gate as sun dot) */}
        {showSunDot && (
          <g>
            <text
              x={labelX}
              y={labelY}
              style={{
                fontSize: 11,
                fontFamily: fonts.mono,
                fill: colors.textSecondary,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {timeStr}
            </text>
            <text
              x={labelX}
              y={labelY + 15}
              style={{
                fontSize: 13,
                fontFamily: fonts.mono,
                fontWeight: 700,
                fill: colors.textPrimary,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {currentWatts}W
            </text>
            <text
              x={labelX}
              y={labelY + 27}
              style={{
                fontSize: 10,
                fontFamily: fonts.mono,
                fill: colors.textTertiary,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {efficiency}%
            </text>
          </g>
        )}

        {/* Night mode: next sunrise text */}
        {isNight && (
          <text
            x="400"
            y="100"
            textAnchor="middle"
            style={{
              fontSize: 12,
              fontFamily: fonts.mono,
              fill: colors.textTertiary,
            }}
          >
            Proxima salida: {formatHour(sunrise)}
          </text>
        )}

        {/* Harvest bar border */}
        <rect
          x={BAR_LEFT - 0.5}
          y={BAR_Y - 0.5}
          width={BAR_WIDTH + 1}
          height={BAR_HEIGHT + 1}
          rx={2.5}
          fill="none"
          stroke="#333"
          strokeWidth={1}
        />

        {/* Harvest bar track */}
        <rect
          x={BAR_LEFT}
          y={BAR_Y}
          width={BAR_WIDTH}
          height={BAR_HEIGHT}
          rx={2}
          fill={colors.border}
        />

        {/* Harvest bar fill (hidden when ratio negligible to avoid rx artifact) */}
        {harvestRatio >= 0.01 && (
          <motion.rect
            x={BAR_LEFT}
            y={BAR_Y}
            height={BAR_HEIGHT}
            rx={2}
            fill={`url(#${HARVEST_GRADIENT_ID})`}
            initial={{ width: 0 }}
            animate={{ width: BAR_WIDTH * harvestRatio }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        {/* Harvest label left (harvested) */}
        <text
          x={BAR_LEFT}
          y={BAR_Y + BAR_HEIGHT + 14}
          style={{
            fontSize: 11,
            fontFamily: fonts.mono,
            fill: colors.textSecondary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {harvestedKwh.toFixed(1)} kWh
        </text>

        {/* Harvest label right (expected) */}
        <text
          x={BAR_RIGHT}
          y={BAR_Y + BAR_HEIGHT + 14}
          textAnchor="end"
          style={{
            fontSize: 11,
            fontFamily: fonts.mono,
            fill: colors.textTertiary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {expectedKwh.toFixed(1)} kWh
        </text>
      </svg>
    </div>
  );
}
