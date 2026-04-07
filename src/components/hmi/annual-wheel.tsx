import { useEffect, useState, useMemo } from "react";
import { colors, fonts } from "@/lib/hmi-tokens";

interface AnnualWheelProps {
  months: Array<{ month: string; angle: number; direction: string }>;
  currentMonth: number; // 0-11
  size?: number; // default 160
}

const DEG_TO_RAD = Math.PI / 180;

const MONTH_ABBR = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

export function AnnualWheel({ months, currentMonth, size = 160 }: AnnualWheelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 20;
  const labelRadius = size / 2 - 6;

  const maxAngle = useMemo(
    () => Math.max(...months.map((m) => Math.abs(m.angle)), 1),
    [months],
  );

  const spokeData = useMemo(() => {
    return months.map((m, i) => {
      const angleDeg = -90 + i * 30;
      const angleRad = angleDeg * DEG_TO_RAD;
      const spokeLen = (Math.abs(m.angle) / maxAngle) * maxRadius;
      const ex = cx + spokeLen * Math.cos(angleRad);
      const ey = cy + spokeLen * Math.sin(angleRad);
      const lx = cx + labelRadius * Math.cos(angleRad);
      const ly = cy + labelRadius * Math.sin(angleRad);
      return { angleDeg, angleRad, spokeLen, ex, ey, lx, ly };
    });
  }, [months, maxAngle, cx, cy, maxRadius, labelRadius]);

  const polygonPoints = spokeData.map((s) => `${s.ex},${s.ey}`).join(" ");

  const ref33 = maxRadius * 0.33;
  const ref66 = maxRadius * 0.66;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Rueda anual de angulos solares. Mes actual: ${MONTH_ABBR[currentMonth]}`}
    >
      {/* Concentric reference circles */}
      <circle
        cx={cx}
        cy={cy}
        r={ref33}
        style={{
          fill: "none",
          stroke: "#1A1A1A",
          strokeWidth: 0.5,
          strokeDasharray: "3 3",
        }}
      />
      <circle
        cx={cx}
        cy={cy}
        r={ref66}
        style={{
          fill: "none",
          stroke: "#1A1A1A",
          strokeWidth: 0.5,
          strokeDasharray: "3 3",
        }}
      />

      {/* 12 radial axis lines */}
      {spokeData.map((s, i) => {
        const axisEndX = cx + maxRadius * Math.cos(s.angleRad);
        const axisEndY = cy + maxRadius * Math.sin(s.angleRad);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={axisEndX}
            y2={axisEndY}
            style={{
              stroke: colors.border,
              strokeWidth: 0.5,
            }}
          />
        );
      })}

      {/* Petal polygon */}
      <polygon
        points={polygonPoints}
        style={{
          fill: "rgba(0,188,212,0.06)",
          stroke: "rgba(0,188,212,0.3)",
          strokeWidth: 1,
          strokeLinejoin: "round",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* Spokes */}
      {spokeData.map((s, i) => {
        const isCurrent = i === currentMonth;
        return (
          <line
            key={`spoke-${i}`}
            x1={cx}
            y1={cy}
            x2={s.ex}
            y2={s.ey}
            style={{
              stroke: isCurrent ? colors.cyan : "rgba(0,188,212,0.3)",
              strokeWidth: isCurrent ? 2 : 0.5,
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.5s ease",
            }}
          />
        );
      })}

      {/* Month labels */}
      {spokeData.map((s, i) => {
        const isCurrent = i === currentMonth;
        return (
          <text
            key={`label-${i}`}
            x={s.lx}
            y={s.ly}
            style={{
              fontSize: 7,
              fontFamily: fonts.mono,
              fontWeight: isCurrent ? 700 : 400,
              fill: isCurrent ? colors.cyan : colors.textTertiary,
              textAnchor: "middle",
              dominantBaseline: "central",
            }}
          >
            {MONTH_ABBR[i]}
          </text>
        );
      })}

      {/* Center dot */}
      <circle
        cx={cx}
        cy={cy}
        r={3}
        style={{ fill: "#333" }}
      />
    </svg>
  );
}
