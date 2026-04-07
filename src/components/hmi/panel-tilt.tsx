import { motion } from "framer-motion";
import { colors, fonts } from "@/lib/hmi-tokens";
import { AnimatedNumber } from "@/components/shared/animated-number";

interface PanelTiltProps {
  currentAngle: number;
  optimalAngle: number;
  efficiency: number;
  width?: number;
  height?: number;
}

const DEG = Math.PI / 180;

export function PanelTilt({ currentAngle, optimalAngle, efficiency, width = 260, height = 200 }: PanelTiltProps) {
  const pivotX = 70;
  const pivotY = 135;
  const panelLen = 120;

  // Panel endpoint (CCW from horizontal = upward tilt)
  const pEndX = pivotX + panelLen * Math.cos(currentAngle * DEG);
  const pEndY = pivotY - panelLen * Math.sin(currentAngle * DEG);

  // Ideal endpoint
  const iEndX = pivotX + panelLen * Math.cos(optimalAngle * DEG);
  const iEndY = pivotY - panelLen * Math.sin(optimalAngle * DEG);

  // Sun: perpendicular to ideal panel surface, above
  const sunAngle = optimalAngle + 90;
  const sunX = pivotX + 50 * Math.cos(sunAngle * DEG) + panelLen * 0.3;
  const sunY = Math.max(20, pivotY - 70 * Math.sin(sunAngle * DEG));

  const angleDiff = Math.abs(currentAngle - optimalAngle);
  const lossPercent = (1 - Math.cos(angleDiff * DEG)) * 100;
  const lossColor = lossPercent < 2 ? colors.green : lossPercent < 10 ? colors.amber : colors.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", maxWidth: width, height: "auto" }}>
        {/* Ground */}
        <line x1={20} y1={pivotY} x2={width - 20} y2={pivotY} stroke="#1E1E1E" strokeWidth={1} />
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={30 + i * 28} y1={pivotY} x2={24 + i * 28} y2={pivotY + 5} stroke="#1A1A1A" strokeWidth={0.5} />
        ))}

        {/* Sun ray */}
        <line x1={sunX} y1={sunY}
          x2={pivotX + panelLen * 0.4 * Math.cos(currentAngle * DEG)}
          y2={pivotY - panelLen * 0.4 * Math.sin(currentAngle * DEG)}
          stroke={colors.amber} strokeWidth={1} strokeDasharray="4 3" opacity={0.4}
        />

        {/* Sun */}
        <circle cx={sunX} cy={sunY} r={7} fill={colors.amber} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = i * 45 * DEG;
          return <line key={i} x1={sunX + 11 * Math.cos(a)} y1={sunY + 11 * Math.sin(a)} x2={sunX + 15 * Math.cos(a)} y2={sunY + 15 * Math.sin(a)} stroke={colors.amber} strokeWidth={0.8} opacity={0.3} />;
        })}

        {/* Ideal line (cyan dashed) */}
        <line x1={pivotX} y1={pivotY} x2={iEndX} y2={iEndY} stroke={colors.cyan} strokeWidth={1.5} strokeDasharray="5 3" opacity={0.5} />

        {/* Panel (white, animated) */}
        <motion.line
          x1={pivotX} y1={pivotY}
          animate={{ x2: pEndX, y2: pEndY }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          stroke="#fff" strokeWidth={4} strokeLinecap="round"
        />

        {/* Pivot */}
        <circle cx={pivotX} cy={pivotY} r={3.5} fill="#fff" stroke="#000" strokeWidth={1.5} />

        {/* Angle arc */}
        {angleDiff > 0.5 && (() => {
          const r = 30;
          const a1 = Math.min(currentAngle, optimalAngle);
          const a2 = Math.max(currentAngle, optimalAngle);
          const x1 = pivotX + r * Math.cos(a1 * DEG);
          const y1 = pivotY - r * Math.sin(a1 * DEG);
          const x2 = pivotX + r * Math.cos(a2 * DEG);
          const y2 = pivotY - r * Math.sin(a2 * DEG);
          const midA = (a1 + a2) / 2;
          return (
            <>
              <path d={`M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`} fill="none" stroke={lossColor} strokeWidth={1} opacity={0.5} />
              <text
                x={pivotX + (r + 10) * Math.cos(midA * DEG)}
                y={pivotY - (r + 10) * Math.sin(midA * DEG) + 3}
                textAnchor="middle"
                style={{ fontSize: 8, fontFamily: fonts.mono, fill: lossColor }}
              >
                {angleDiff.toFixed(0)}°
              </text>
            </>
          );
        })()}

        {/* Data labels */}
        <text x={pivotX - 5} y={pivotY + 18} style={{ fontSize: 10, fontFamily: fonts.mono, fill: "#fff" }}>
          Panel: {currentAngle.toFixed(1)}°
        </text>
        <text x={pivotX + 75} y={pivotY + 18} style={{ fontSize: 10, fontFamily: fonts.mono, fill: colors.cyan }}>
          Ideal: {optimalAngle.toFixed(1)}°
        </text>
        <text x={pivotX + 150} y={pivotY + 18} style={{ fontSize: 10, fontFamily: fonts.mono, fill: lossColor }}>
          {lossPercent.toFixed(1)}%
        </text>
      </svg>
    </div>
  );
}
