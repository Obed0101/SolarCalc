import { colors, fonts, typography } from "@/lib/hmi-tokens";
import { AnimatedNumber } from "@/components/shared/animated-number";

interface PanelInfoProps {
  currentAngle: number;
  optimalAngle: number;
  efficiency: number;
  panelCount: number;
  nominalPower: number;
  direction: string;
}

export function PanelInfo({ currentAngle, optimalAngle, efficiency, panelCount, nominalPower, direction }: PanelInfoProps) {
  const angleDiff = Math.abs(currentAngle - optimalAngle);
  const lossPercent = (1 - Math.cos(angleDiff * Math.PI / 180)) * 100;
  const lossColor = lossPercent < 2 ? colors.green : lossPercent < 10 ? colors.amber : colors.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", height: "100%" }}>
      {/* Title */}
      <span style={{ ...typography.label, fontSize: 9 }}>Panel Solar</span>

      {/* Main angle display */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        {/* Panel icon SVG */}
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg viewBox="0 0 56 56" style={{ width: "100%", height: "100%" }}>
            {/* Panel body */}
            <rect x="8" y="12" width="40" height="28" rx="3" fill="none" stroke={colors.cyan} strokeWidth="1.5" opacity={0.6}
              transform={`rotate(${-currentAngle}, 28, 40)`} />
            {/* Grid lines */}
            <line x1="21" y1="12" x2="21" y2="40" stroke={colors.cyan} strokeWidth="0.5" opacity={0.3}
              transform={`rotate(${-currentAngle}, 28, 40)`} />
            <line x1="35" y1="12" x2="35" y2="40" stroke={colors.cyan} strokeWidth="0.5" opacity={0.3}
              transform={`rotate(${-currentAngle}, 28, 40)`} />
            <line x1="8" y1="22" x2="48" y2="22" stroke={colors.cyan} strokeWidth="0.5" opacity={0.3}
              transform={`rotate(${-currentAngle}, 28, 40)`} />
            <line x1="8" y1="32" x2="48" y2="32" stroke={colors.cyan} strokeWidth="0.5" opacity={0.3}
              transform={`rotate(${-currentAngle}, 28, 40)`} />
            {/* Base */}
            <line x1="28" y1="40" x2="28" y2="52" stroke={colors.textTertiary} strokeWidth="1.5" />
            <line x1="20" y1="52" x2="36" y2="52" stroke={colors.textTertiary} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Angle numbers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          <AngleRow label="Actual" value={currentAngle} color={colors.textPrimary} />
          <AngleRow label="Optimo" value={optimalAngle} color={colors.cyan} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 8, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Perdida</span>
            <span style={{ fontSize: 13, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums", color: lossColor }}>
              <AnimatedNumber value={lossPercent} decimals={1} />%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${colors.border}`, paddingTop: 6 }}>
        <InfoChip label="Paneles" value={String(panelCount)} />
        <InfoChip label="Potencia" value={`${nominalPower}W`} />
        <InfoChip label="Dir." value={direction} />
      </div>
    </div>
  );
}

function AngleRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 8, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 200, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums", color }}>
        <AnimatedNumber value={value} decimals={1} />°
      </span>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 7, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11, fontFamily: fonts.mono, color: colors.textSecondary, marginTop: 2 }}>{value}</div>
    </div>
  );
}
