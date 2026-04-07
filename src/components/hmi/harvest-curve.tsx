import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { colors, fonts, typography } from "@/lib/hmi-tokens";

interface HarvestCurveProps {
  history: Array<{ watts: number; time: string }>;
  nominalPower: number;
  sunriseH: number;
  sunsetH: number;
  currentHour: number;
  harvestedKwh: number;
  expectedKwh: number;
}

function hourToLabel(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}:${mm.toString().padStart(2, "0")}`;
}

export function HarvestCurve({
  history,
  nominalPower,
  sunriseH,
  sunsetH,
  currentHour,
  harvestedKwh,
  expectedKwh,
}: HarvestCurveProps) {
  // Generate theoretical bell curve data
  const theoreticalData = useMemo(() => {
    const points: Array<{ time: string; theoretical: number }> = [];
    const duration = sunsetH - sunriseH;
    if (duration <= 0) return points;

    for (let h = sunriseH; h <= sunsetH; h += 0.5) {
      const progress = (h - sunriseH) / duration;
      const watts = nominalPower * Math.sin(progress * Math.PI);
      points.push({
        time: hourToLabel(h),
        theoretical: Math.round(watts),
      });
    }
    return points;
  }, [nominalPower, sunriseH, sunsetH]);

  // Merge theoretical + actual into unified dataset
  const chartData = useMemo(() => {
    const timeMap = new Map<string, { time: string; theoretical: number; actual?: number }>();

    for (const pt of theoreticalData) {
      timeMap.set(pt.time, { ...pt });
    }

    for (const pt of history) {
      const existing = timeMap.get(pt.time);
      if (existing) {
        existing.actual = pt.watts;
      } else {
        timeMap.set(pt.time, { time: pt.time, theoretical: 0, actual: pt.watts });
      }
    }

    // Sort by time string (HH:MM sorts lexicographically)
    return Array.from(timeMap.values()).sort((a, b) => a.time.localeCompare(b.time));
  }, [theoreticalData, history]);

  // Find the "now" reference line position
  const nowLabel = useMemo(() => hourToLabel(currentHour), [currentHour]);

  const gradientId = "harvest-curve-fill";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 100 }}>
      {/* Header labels */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 8,
          zIndex: 1,
          ...typography.label,
        }}
      >
        CURVA SOLAR
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 8,
          zIndex: 1,
          fontSize: 11,
          fontFamily: fonts.mono,
          fontVariantNumeric: "tabular-nums",
          color: colors.textSecondary,
        }}
      >
        {harvestedKwh.toFixed(2)} / {expectedKwh.toFixed(2)} kWh
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.green} stopOpacity={0.2} />
              <stop offset="100%" stopColor={colors.green} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke={colors.border}
            vertical={false}
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="time"
            tick={{ fontSize: 7, fill: colors.textTertiary, fontFamily: fonts.mono }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            tick={{ fontSize: 8, fill: colors.textTertiary, fontFamily: fonts.mono }}
            axisLine={false}
            tickLine={false}
            width={28}
            tickFormatter={(v: number) => `${v}`}
          />

          {/* Theoretical bell curve -- dashed, no fill */}
          <Area
            type="monotone"
            dataKey="theoretical"
            stroke="#333333"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            fill="none"
            dot={false}
            isAnimationActive={false}
          />

          {/* Actual production -- solid green with gradient fill */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke={colors.green}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />

          {/* NOW vertical reference line */}
          <ReferenceLine
            x={nowLabel}
            stroke={colors.textTertiary}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
