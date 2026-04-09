import { colors, fonts, typography } from "@/lib/hmi-tokens";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { useRuntimeStore } from "@/stores/runtime-store";

interface AngleHeroProps {
  currentAngle: number;
  optimalAngle: number;
  efficiency: number;
  direction: string;
  monthName: string;
}

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function AngleHero({ currentAngle, optimalAngle, efficiency, direction, monthName }: AngleHeroProps) {
  const servoMode = useRuntimeStore((s) => s.servoMode);
  const angleDiff = Math.abs(currentAngle - optimalAngle);
  const isAligned = angleDiff < 1;
  const lossPercent = (1 - Math.cos(angleDiff * Math.PI / 180)) * 100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, width: "100%", padding: "4px 0" }}>

      {/* Left: Big optimal angle */}
      <div style={{ flex: 1 }}>
        <span style={{ ...typography.label, fontSize: 8 }}>Angulo Optimo — {monthName}</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
          <span style={{
            fontSize: 48, fontWeight: 200, fontFamily: fonts.mono,
            fontVariantNumeric: "tabular-nums", color: colors.cyan, lineHeight: 1,
          }}>
            <AnimatedNumber value={optimalAngle} decimals={1} />
          </span>
          <span style={{ fontSize: 20, color: colors.textTertiary }}>°</span>
          <span style={{ fontSize: 12, color: colors.textTertiary, marginLeft: 4 }}>{direction}</span>
        </div>

        {/* Servo status */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: servoMode === "auto" ? colors.green : colors.amber,
            animation: servoMode === "auto" ? "hmi-dot-pulse 2s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontSize: 9, color: colors.textSecondary }}>
            {servoMode === "auto"
              ? "Servo AUTO — angulo ajustado automaticamente"
              : servoMode === "manual"
                ? "Servo MANUAL — ajuste manual requerido"
                : "Ajuste MENSUAL — cambiar cada mes"}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 60, background: colors.border, flexShrink: 0 }} />

      {/* Right: Current angle + comparison */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div>
          <span style={{ fontSize: 8, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Panel Actual</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 28, fontWeight: 200, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums", color: colors.textPrimary }}>
              <AnimatedNumber value={currentAngle} decimals={1} />°
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <MiniStat label="Eficiencia" value={`${efficiency.toFixed(1)}%`} color={efficiency > 95 ? colors.green : efficiency > 85 ? colors.amber : colors.red} />
          <MiniStat label="Perdida" value={`${lossPercent.toFixed(1)}%`} color={lossPercent < 2 ? colors.green : lossPercent < 10 ? colors.amber : colors.red} />
          <MiniStat
            label="Estado"
            value={isAligned ? "Alineado" : `Desvio ${angleDiff.toFixed(1)}°`}
            color={isAligned ? colors.green : colors.amber}
          />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 7, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11, fontFamily: fonts.mono, color, marginTop: 1 }}>{value}</div>
    </div>
  );
}

export { MONTH_NAMES };
