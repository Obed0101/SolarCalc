import { motion } from "framer-motion";
import { colors, fonts, gauge as gaugeTokens } from "@/lib/hmi-tokens";
import { AnimatedNumber } from "@/components/shared/animated-number";

interface RadialGaugeProps {
  value: number;
  target?: number;
  min?: number;
  max?: number;
  label: string;
  unit: string;
  size?: number;
  color?: string;
}

const DEG_TO_RAD = Math.PI / 180;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = angleDeg * DEG_TO_RAD;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function RadialGauge({
  value,
  target,
  min = 0,
  max = 60,
  label,
  unit,
  size = 240,
  color = colors.green,
}: RadialGaugeProps) {
  const { arcStart, arcEnd, arcDegrees, trackWidth, arcWidth, needleSpring } = gaugeTokens;
  const padding = 10;
  const svgWidth = size + padding * 2;
  const svgHeight = size * 0.75 + padding * 2;
  const cx = svgWidth / 2;
  const cy = size * 0.48 + padding;
  const radius = size * 0.4;

  const clampedValue = Math.max(min, Math.min(max, value));
  const fraction = (clampedValue - min) / (max - min);
  const valueAngle = arcStart + fraction * arcDegrees;

  // Arc path length for dasharray animation
  const arcPath = describeArc(cx, cy, radius, arcStart, arcEnd);
  const circumference = radius * arcDegrees * DEG_TO_RAD;
  const activeLength = circumference * fraction;

  // Needle endpoint
  const needleTip = polarToCartesian(cx, cy, radius - 8, valueAngle);
  const needleBase = polarToCartesian(cx, cy, 12, valueAngle);

  // Target marker position
  const targetPos = target !== undefined
    ? polarToCartesian(cx, cy, radius, arcStart + ((Math.max(min, Math.min(max, target)) - min) / (max - min)) * arcDegrees)
    : null;

  // Scale ticks
  const majorInterval = 10;
  const minorInterval = 5;
  const ticks: { angle: number; major: boolean; labelValue: number }[] = [];
  for (let v = min; v <= max; v += minorInterval) {
    const isMajor = (v - min) % majorInterval === 0;
    ticks.push({
      angle: arcStart + ((v - min) / (max - min)) * arcDegrees,
      major: isMajor,
      labelValue: v,
    });
  }

  // Scale label positions: min, mid, max
  const scaleLabels = [
    { value: min, angle: arcStart },
    { value: Math.round((min + max) / 2), angle: arcStart + arcDegrees / 2 },
    { value: max, angle: arcEnd },
  ];

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ width: size + padding * 2, height: svgHeight, display: "block" }}
    >
      <defs>
        <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`tip-glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Background track */}
      <path
        d={arcPath}
        fill="none"
        stroke={colors.gaugeTrack}
        strokeWidth={trackWidth}
        strokeLinecap="round"
      />

      {/* Active arc */}
      <path
        d={arcPath}
        fill="none"
        stroke={color}
        strokeWidth={arcWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - activeLength}
        style={{
          filter: `drop-shadow(0 0 6px ${colors.gaugeGlow(color, 0.5)})`,
          transition: "stroke-dashoffset 0.6s ease-out",
        }}
      />

      {/* Scale ticks */}
      {ticks.map((tick) => {
        const outerR = radius + (tick.major ? 12 : 8);
        const innerR = radius + (tick.major ? 4 : 4);
        const outer = polarToCartesian(cx, cy, outerR, tick.angle);
        const inner = polarToCartesian(cx, cy, innerR, tick.angle);
        return (
          <line
            key={tick.angle}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={tick.major ? "#333" : "#222"}
            strokeWidth={tick.major ? 1.5 : 1}
          />
        );
      })}

      {/* Scale labels */}
      {scaleLabels.map((sl) => {
        const pos = polarToCartesian(cx, cy, radius + 20, sl.angle);
        return (
          <text
            key={sl.value}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: 9,
              fontFamily: fonts.mono,
              fill: "#555",
              userSelect: "none",
            }}
          >
            {sl.value}
          </text>
        );
      })}

      {/* Target marker */}
      {targetPos && (
        <circle
          cx={targetPos.x}
          cy={targetPos.y}
          r={4}
          fill={colors.cyan}
          style={{
            animation: "hmi-pulse 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Animated needle */}
      <motion.line
        x1={needleBase.x}
        y1={needleBase.y}
        x2={needleTip.x}
        y2={needleTip.y}
        stroke="#e8eaed"
        strokeWidth={2}
        strokeLinecap="round"
        animate={{
          x1: needleBase.x,
          y1: needleBase.y,
          x2: needleTip.x,
          y2: needleTip.y,
        }}
        transition={needleSpring}
      />

      {/* Needle tip glow */}
      <motion.circle
        cx={needleTip.x}
        cy={needleTip.y}
        r={3}
        fill="white"
        opacity={0.5}
        filter={`url(#tip-glow-${label})`}
        animate={{ cx: needleTip.x, cy: needleTip.y }}
        transition={needleSpring}
      />

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={4} fill="white" />

      {/* Center number */}
      <foreignObject
        x={cx - size * 0.25}
        y={cy - 20}
        width={size * 0.5}
        height={44}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 2,
            fontSize: 36,
            fontWeight: 200,
            fontFamily: fonts.mono,
            fontVariantNumeric: "tabular-nums",
            color: colors.textPrimary,
            lineHeight: 1,
          }}
        >
          <AnimatedNumber value={value} decimals={1} />
          <span style={{ fontSize: 16, fontWeight: 300, color: colors.textSecondary }}>
            {unit}
          </span>
        </div>
      </foreignObject>

      {/* Label */}
      <text
        x={cx}
        y={cy + 28}
        textAnchor="middle"
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fill: colors.textTertiary,
          fontFamily: fonts.primary,
          userSelect: "none",
        }}
      >
        {label}
      </text>

      {/* CSS animation for target pulse */}
      <style>{`
        @keyframes hmi-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </svg>
  );
}
