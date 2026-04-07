import { motion } from "framer-motion";
import { colors, fonts, gauge as gaugeTokens } from "@/lib/hmi-tokens";
import { AnimatedNumber } from "@/components/shared/animated-number";

interface PanelTiltProps {
  currentAngle: number;
  optimalAngle: number;
  efficiency: number;
  width?: number;
  height?: number;
}

const DEG_TO_RAD = Math.PI / 180;
const PIVOT = { x: 80, y: 160 };
const PANEL_LENGTH = 140;
const PANEL_THICKNESS = 6;

function endpoint(angle: number, length: number) {
  return {
    x: PIVOT.x + length * Math.cos(angle * DEG_TO_RAD),
    y: PIVOT.y - length * Math.sin(angle * DEG_TO_RAD),
  };
}

function wedgePath(angleA: number, angleB: number, radius: number): string {
  const a = Math.min(angleA, angleB);
  const b = Math.max(angleA, angleB);
  const startRad = -b * DEG_TO_RAD;
  const endRad = -a * DEG_TO_RAD;
  const x1 = PIVOT.x + radius * Math.cos(startRad);
  const y1 = PIVOT.y + radius * Math.sin(startRad);
  const x2 = PIVOT.x + radius * Math.cos(endRad);
  const y2 = PIVOT.y + radius * Math.sin(endRad);
  const sweep = b - a > 180 ? 1 : 0;
  return `M ${PIVOT.x} ${PIVOT.y} L ${x1} ${y1} A ${radius} ${radius} 0 ${sweep} 1 ${x2} ${y2} Z`;
}

export function PanelTilt({
  currentAngle,
  optimalAngle,
  efficiency,
  width = 300,
  height = 200,
}: PanelTiltProps) {
  const loss = 100 - Math.max(0, Math.min(100, efficiency));
  const diff = Math.abs(currentAngle - optimalAngle);
  const optEnd = endpoint(optimalAngle, PANEL_LENGTH);

  // Sun ray: comes from upper-right, perpendicular to optimal panel surface
  const sunOrigin = { x: 260, y: 20 };
  const sunTarget = endpoint(optimalAngle, PANEL_LENGTH * 0.6);

  // Triangle tip for optimal line
  const tipEnd = endpoint(optimalAngle, PANEL_LENGTH);
  const tipLeft = endpoint(optimalAngle + 6, PANEL_LENGTH - 10);
  const tipRight = endpoint(optimalAngle - 6, PANEL_LENGTH - 10);

  // Angle label arc midpoint
  const midAngle = (currentAngle + optimalAngle) / 2;
  const arcLabelPos = endpoint(midAngle, PANEL_LENGTH * 0.55);

  const lossColor = loss <= 5 ? colors.green : loss <= 15 ? colors.amber : colors.red;

  return (
    <svg
      viewBox="0 0 300 200"
      style={{
        width,
        height,
        display: "block",
      }}
      role="img"
      aria-label={`Panel tilt diagram: current ${currentAngle} degrees, optimal ${optimalAngle} degrees, efficiency ${efficiency} percent`}
    >
      <defs>
        <filter id="panel-tilt-sun-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Ground line */}
      <line
        x1={20}
        y1={160}
        x2={280}
        y2={160}
        stroke={colors.border}
        strokeWidth={1}
      />

      {/* Ground hatching */}
      {Array.from({ length: 13 }, (_, i) => {
        const x = 30 + i * 20;
        return (
          <line
            key={i}
            x1={x}
            y1={160}
            x2={x - 6}
            y2={166}
            stroke="#1A1A1A"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Loss wedge */}
      {diff > 0.5 && (
        <motion.path
          d={wedgePath(currentAngle, optimalAngle, PANEL_LENGTH * 0.9)}
          fill={colors.red}
          initial={{ fillOpacity: 0 }}
          animate={{ fillOpacity: loss / 100 * 0.4 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Sun ray dashed line */}
      <line
        x1={sunOrigin.x}
        y1={sunOrigin.y}
        x2={sunTarget.x}
        y2={sunTarget.y}
        stroke={colors.amber}
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* Sun icon */}
      <circle
        cx={sunOrigin.x}
        cy={sunOrigin.y}
        r={8}
        fill={colors.amber}
        style={{ filter: `url(#panel-tilt-sun-glow)` }}
      />
      <circle
        cx={sunOrigin.x}
        cy={sunOrigin.y}
        r={5}
        fill={colors.amber}
      />
      {/* Sun rays (small lines radiating out) */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const rad = a * DEG_TO_RAD;
        return (
          <line
            key={a}
            x1={sunOrigin.x + 10 * Math.cos(rad)}
            y1={sunOrigin.y + 10 * Math.sin(rad)}
            x2={sunOrigin.x + 14 * Math.cos(rad)}
            y2={sunOrigin.y + 14 * Math.sin(rad)}
            stroke={colors.amber}
            strokeWidth={1}
            strokeLinecap="round"
          />
        );
      })}

      {/* Optimal line (dashed cyan) */}
      <line
        x1={PIVOT.x}
        y1={PIVOT.y}
        x2={optEnd.x}
        y2={optEnd.y}
        stroke={colors.cyan}
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />

      {/* Cyan triangle tip */}
      <polygon
        points={`${tipEnd.x},${tipEnd.y} ${tipLeft.x},${tipLeft.y} ${tipRight.x},${tipRight.y}`}
        fill={colors.cyan}
        opacity={0.7}
      />

      {/* Panel body (animated rotation) */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: -currentAngle }}
        transition={gaugeTokens.needleSpring}
        style={{ transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}
      >
        {/* Panel rectangle */}
        <rect
          x={PIVOT.x}
          y={PIVOT.y - PANEL_THICKNESS / 2}
          width={PANEL_LENGTH}
          height={PANEL_THICKNESS}
          rx={2}
          fill={colors.textPrimary}
          stroke={colors.textPrimary}
          strokeWidth={0.5}
        />
        {/* Panel edge highlight */}
        <line
          x1={PIVOT.x}
          y1={PIVOT.y - PANEL_THICKNESS / 2}
          x2={PIVOT.x + PANEL_LENGTH}
          y2={PIVOT.y - PANEL_THICKNESS / 2}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={0.5}
        />
        {/* Panel segments (visual detail) */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={PIVOT.x + PANEL_LENGTH * frac}
            y1={PIVOT.y - PANEL_THICKNESS / 2}
            x2={PIVOT.x + PANEL_LENGTH * frac}
            y2={PIVOT.y + PANEL_THICKNESS / 2}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={0.5}
          />
        ))}
      </motion.g>

      {/* Pivot point */}
      <circle
        cx={PIVOT.x}
        cy={PIVOT.y}
        r={4}
        fill={colors.textPrimary}
      />
      <circle
        cx={PIVOT.x}
        cy={PIVOT.y}
        r={2}
        fill={colors.bgDeep}
      />

      {/* Angle difference arc + label */}
      {diff > 0.5 && (
        <>
          {/* Small arc between the two angles */}
          <path
            d={arcBetween(currentAngle, optimalAngle, 40)}
            fill="none"
            stroke={lossColor}
            strokeWidth={1}
            opacity={0.6}
          />
          {/* Difference label */}
          <text
            x={arcLabelPos.x}
            y={arcLabelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: 9,
              fontFamily: fonts.mono,
              fill: lossColor,
              userSelect: "none",
            }}
          >
            {diff.toFixed(1)}
          </text>
        </>
      )}

      {/* Data strip */}
      <foreignObject x={0} y={170} width={300} height={28}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 20px",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontFamily: fonts.mono,
              color: colors.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Panel:{" "}
            <AnimatedNumber value={currentAngle} decimals={1} />
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: fonts.mono,
              color: colors.cyan,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Ideal:{" "}
            <AnimatedNumber value={optimalAngle} decimals={1} />
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: fonts.mono,
              color: lossColor,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Loss:{" "}
            <AnimatedNumber value={loss} decimals={1} />%
          </span>
        </div>
      </foreignObject>
    </svg>
  );
}

/** SVG arc path between two angles at a given radius from the pivot */
function arcBetween(angleA: number, angleB: number, radius: number): string {
  const a = Math.min(angleA, angleB);
  const b = Math.max(angleA, angleB);
  const x1 = PIVOT.x + radius * Math.cos(-a * DEG_TO_RAD);
  const y1 = PIVOT.y + radius * Math.sin(-a * DEG_TO_RAD);
  const x2 = PIVOT.x + radius * Math.cos(-b * DEG_TO_RAD);
  const y2 = PIVOT.y + radius * Math.sin(-b * DEG_TO_RAD);
  const sweep = b - a > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${sweep} 0 ${x2} ${y2}`;
}
