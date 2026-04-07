import { colors, fonts, gauge as gaugeTokens } from "@/lib/hmi-tokens";
import { AnimatedNumber } from "@/components/shared/animated-number";

interface MiniGaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  size?: number;
}

const DEG_TO_RAD = Math.PI / 180;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  return {
    x: cx + r * Math.cos(angleDeg * DEG_TO_RAD),
    y: cy + r * Math.sin(angleDeg * DEG_TO_RAD),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function MiniGauge({
  value,
  max,
  label,
  unit,
  color,
  size = 120,
}: MiniGaugeProps) {
  const { semiTrackWidth, semiArcWidth } = gaugeTokens;
  const svgWidth = size;
  const svgHeight = size * 0.7;
  const cx = svgWidth / 2;
  const cy = svgHeight - 8;
  const radius = size * 0.35;

  // 180-degree arc: from 180 (left) to 360 (right), open at bottom
  const arcStartDeg = 180;
  const arcEndDeg = 360;
  const arcPath = describeArc(cx, cy, radius, arcStartDeg, arcEndDeg);

  const clampedValue = Math.max(0, Math.min(max, value));
  const fraction = max > 0 ? clampedValue / max : 0;
  const circumference = radius * Math.PI; // half circle
  const activeLength = circumference * fraction;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: svgWidth, height: svgHeight, display: "block" }}
      >
        <defs>
          <filter id={`mini-glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <path
          d={arcPath}
          fill="none"
          stroke={colors.gaugeTrack}
          strokeWidth={semiTrackWidth}
          strokeLinecap="round"
        />

        {/* Active arc */}
        <path
          d={arcPath}
          fill="none"
          stroke={color}
          strokeWidth={semiArcWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - activeLength}
          style={{
            filter: `drop-shadow(0 0 4px ${colors.gaugeGlow(color, 0.4)})`,
            transition: "stroke-dashoffset 0.6s ease-out",
          }}
        />

        {/* Center number */}
        <foreignObject
          x={0}
          y={cy - 22}
          width={svgWidth}
          height={26}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 200,
                fontFamily: fonts.mono,
                fontVariantNumeric: "tabular-nums",
                color: colors.textPrimary,
                lineHeight: 1,
              }}
            >
              <AnimatedNumber value={value} decimals={value % 1 !== 0 ? 1 : 0} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 300, color: colors.textSecondary }}>
              {unit}
            </span>
          </div>
        </foreignObject>
      </svg>

      {/* Label below gauge */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: colors.textTertiary,
          fontFamily: fonts.primary,
          userSelect: "none",
        }}
      >
        {label}
      </span>
    </div>
  );
}
