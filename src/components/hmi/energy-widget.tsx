import { colors, fonts, typography } from "@/lib/hmi-tokens";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { Zap, TrendingUp, DollarSign } from "lucide-react";

interface EnergyWidgetProps {
  harvestedKwh: number;
  expectedKwh: number;
  currentWatts: number;
  savingsOptimal: number;
  savingsActual: number;
  savingsDiff: number;
}

export function EnergyWidget({ harvestedKwh, expectedKwh, currentWatts, savingsOptimal, savingsActual, savingsDiff }: EnergyWidgetProps) {
  const harvestPercent = expectedKwh > 0 ? Math.min(100, (harvestedKwh / expectedKwh) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", height: "100%" }}>
      <span style={{ ...typography.label, fontSize: 9 }}>Energia & Ahorro</span>

      {/* Current production */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Zap size={14} color={currentWatts > 10 ? colors.green : colors.textTertiary} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 200, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums", color: colors.green }}>
              <AnimatedNumber value={currentWatts} decimals={0} />
            </span>
            <span style={{ fontSize: 11, color: colors.textTertiary }}>W ahora</span>
          </div>
        </div>
      </div>

      {/* Harvest progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 8, color: colors.textTertiary, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Cosechado hoy</span>
          <span style={{ fontSize: 10, fontFamily: fonts.mono, color: colors.textSecondary }}>
            {harvestedKwh.toFixed(2)} / {expectedKwh.toFixed(2)} kWh
          </span>
        </div>
        <div style={{ position: "relative", height: 6, background: colors.border, borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: "0 auto 0 0", borderRadius: 3,
            background: `linear-gradient(90deg, ${colors.green}, ${colors.cyan})`,
            width: `${harvestPercent}%`, transition: "width 1s ease-out",
          }} />
        </div>
        <div style={{ fontSize: 8, color: colors.textTertiary, marginTop: 2, textAlign: "right" }}>
          {harvestPercent.toFixed(0)}%
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: colors.border }} />

      {/* Savings section */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
        <DollarSign size={14} color={colors.amber} />
        <span style={{ fontSize: 9, color: colors.textTertiary, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>Ahorro Hoy</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <SavingsRow label="Optimo" value={savingsOptimal} color={colors.green} prefix="$" />
        <SavingsRow label="Actual" value={savingsActual} color={colors.textSecondary} prefix="$" />
        <div style={{ height: 1, background: colors.border }} />
        <SavingsRow
          label="Diferencia"
          value={Math.abs(savingsDiff)}
          color={savingsDiff > 0 ? colors.amber : colors.green}
          prefix={savingsDiff > 0 ? "-$" : "+$"}
          bold
        />
      </div>
    </div>
  );
}

function SavingsRow({ label, value, color, prefix, bold }: {
  label: string; value: number; color: string; prefix: string; bold?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 8, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: bold ? 18 : 14, fontWeight: 200, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums", color }}>
        {prefix}<AnimatedNumber value={value} decimals={2} />
      </span>
    </div>
  );
}
