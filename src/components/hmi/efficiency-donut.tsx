import { colors, fonts, typography } from "@/lib/hmi-tokens";
import { AnimatedNumber } from "@/components/shared/animated-number";

interface EfficiencyDonutProps {
  efficiency: number;
  angleLoss: number;
  cloudLoss: number;
  size?: number;
}

const STROKE_WIDTH = 12;
const CX = 80;
const CY = 72;
const RADIUS = 55;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Segment {
  label: string;
  color: string;
  value: number;
}

export function EfficiencyDonut({
  efficiency,
  angleLoss,
  cloudLoss,
  size = 160,
}: EfficiencyDonutProps) {
  const thermalLoss = Math.max(0, 100 - efficiency - angleLoss - cloudLoss);

  const segments: Segment[] = [
    { label: "Captada", color: colors.green, value: efficiency },
    { label: "Angulo", color: colors.red, value: angleLoss },
    { label: "Nubes", color: colors.textTertiary, value: cloudLoss },
    { label: "Termica", color: colors.amber, value: thermalLoss },
  ];

  // Build cumulative offsets for each segment
  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const dashLength = (seg.value / 100) * CIRCUMFERENCE;
    const offset = CIRCUMFERENCE - cumulative * (CIRCUMFERENCE / 100);
    cumulative += seg.value;
    return { ...seg, dashLength, offset };
  });

  const scale = size / 160;

  return (
    <svg
      viewBox="0 0 160 180"
      width={size}
      height={size * (180 / 160)}
      style={{ display: "block" }}
      role="img"
      aria-label={`Eficiencia ${efficiency}%: angulo ${angleLoss}%, nubes ${cloudLoss}%, termica ${thermalLoss.toFixed(0)}%`}
    >
      {/* Donut segments */}
      {arcs.map((arc, i) => {
        if (arc.value <= 0) return null;
        const isFirst = i === 0;
        const isLast = i === arcs.length - 1;
        return (
          <circle
            key={arc.label}
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${arc.dashLength} ${CIRCUMFERENCE - arc.dashLength}`}
            strokeDashoffset={arc.offset}
            strokeLinecap={isFirst || isLast ? "round" : "butt"}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: `${CX}px ${CY}px`,
              transition: "stroke-dasharray 0.6s ease-out, stroke-dashoffset 0.6s ease-out",
            }}
          />
        );
      })}

      {/* Center text */}
      <text
        x={CX}
        y={CY - 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: 28,
          fontWeight: 200,
          fontFamily: fonts.mono,
          fill: colors.textPrimary,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <AnimatedNumber value={efficiency} decimals={1} />
      </text>
      <text
        x={CX}
        y={CY + 18}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: 12,
          fontWeight: 300,
          fontFamily: fonts.mono,
          fill: colors.textSecondary,
        }}
      >
        %
      </text>

      {/* Legend: 2x2 grid */}
      {segments.map((seg, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const lx = col === 0 ? 20 : 90;
        const ly = 148 + row * 14;

        return (
          <g key={seg.label}>
            <circle cx={lx} cy={ly} r={3} fill={seg.color} />
            <text
              x={lx + 8}
              y={ly}
              dominantBaseline="central"
              style={{
                fontSize: 8,
                fontFamily: fonts.primary,
                fill: colors.textTertiary,
                fontWeight: 400,
              }}
            >
              {seg.label} {seg.value.toFixed(0)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
