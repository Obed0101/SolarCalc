import { motion } from "framer-motion";
import { colors, fonts, typography } from "@/lib/hmi-tokens";

interface DotMatrixProps {
  harvested: number;
  expected: number;
  cols?: number;
  rows?: number;
  color?: string;
}

export function DotMatrix({
  harvested,
  expected,
  cols = 40,
  rows = 3,
  color = colors.green,
}: DotMatrixProps) {
  const total = cols * rows;
  const ratio = expected > 0 ? harvested / expected : 0;
  const filled = Math.min(total, Math.round(ratio * total));
  const recentThreshold = Math.floor(filled * 0.9);

  return (
    <div>
      {/* Header row */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 8,
      }}>
        <span style={{ ...typography.label }}>ENERGIA HOY</span>
        <span style={{
          fontSize: 11,
          fontFamily: fonts.mono,
          color: colors.textSecondary,
          fontVariantNumeric: "tabular-nums",
        }}>
          {harvested.toFixed(2)} / {expected.toFixed(2)} kWh
        </span>
      </div>

      {/* Dot grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 2,
        padding: "4px 0",
      }}>
        {Array.from({ length: total }, (_, i) => {
          const isFilled = i < filled;
          const isRecent = isFilled && i >= recentThreshold;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: isFilled ? (isRecent ? 1 : 0.7) : 1 }}
              transition={{ delay: i * 0.015, duration: 0.2 }}
              style={{
                width: 7,
                height: 7,
                borderRadius: 1,
                background: isFilled ? color : "#1A1A1A",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
