import { useMemo } from "react";
import SunArc from "@/components/hmi/sun-arc";
import { PanelTilt } from "@/components/hmi/panel-tilt";
import { MiniGauge } from "@/components/hmi/mini-gauge";
import { EfficiencyDonut } from "@/components/hmi/efficiency-donut";
import { HarvestCurve } from "@/components/hmi/harvest-curve";
import { AnnualWheel } from "@/components/hmi/annual-wheel";
import StatusBar from "@/components/hmi/status-bar";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { useSensorSimulation } from "@/hooks/use-sensor-simulation";
import { useSettingsStore } from "@/stores/settings-store";
import {
  optimalAngle, angleDirection, dayOfYear, relativeEfficiency,
  energyLossPercent, sunHoursEstimate, dailySavings, monthlyAngles,
  sunriseHour, sunsetHour,
} from "@/lib/solar";
import { colors, fonts, typography } from "@/lib/hmi-tokens";

export function HMIDashboard() {
  const { latitude, fixedAngle, nominalPower, tariffPerKwh, locationName } = useSettingsStore();
  const { current, history } = useSensorSimulation();

  const solar = useMemo(() => {
    const today = dayOfYear();
    const optimal = optimalAngle(latitude, today);
    const direction = angleDirection(optimal);
    const sunH = sunHoursEstimate(latitude, today);
    const efficiency = relativeEfficiency(fixedAngle, optimal) * 100;
    const loss = energyLossPercent(fixedAngle, optimal);
    const savings = dailySavings(nominalPower, fixedAngle, optimal, tariffPerKwh, sunH);
    const months = monthlyAngles(latitude);
    const rise = sunriseHour(latitude, today);
    const set = sunsetHour(latitude, today);
    return { today, optimal, direction, sunH, efficiency, loss, savings, months, rise, set };
  }, [latitude, fixedAngle, nominalPower, tariffPerKwh]);

  const currentMonth = new Date().getMonth();
  const now = new Date();
  const hourDecimal = now.getHours() + now.getMinutes() / 60;
  const harvestedKwh = Math.max(0, (current.watts * Math.max(0, hourDecimal - solar.rise)) / 1000);
  const expectedKwh = (nominalPower * solar.sunH) / 1000;

  return (
    <div style={{
      display: "flex", flexDirection: "column", width: "100%", height: "100vh",
      background: colors.bgDeep, overflow: "hidden", fontFamily: fonts.primary,
    }}>
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 20px", borderBottom: `1px solid ${colors.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>SolarCalc</span>
          <span style={{
            fontSize: 8, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
            color: colors.textSecondary, padding: "2px 6px", background: "rgba(255,255,255,0.06)", borderRadius: 3,
          }}>PRODUCCION</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 10, color: colors.textTertiary }}>{locationName} · {latitude.toFixed(1)}°N</span>
          <span style={{ fontSize: 18, fontWeight: 200, fontFamily: fonts.mono, color: colors.textPrimary }}>
            <AnimatedNumber value={current.watts} decimals={0} duration={300} />
            <span style={{ fontSize: 11, color: colors.textTertiary, marginLeft: 3 }}>W</span>
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px", gap: 8, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>

        {/* Row 1: Sun Arc (hero, full width) */}
        <Card style={{ padding: "8px 12px 4px", flexShrink: 0 }}>
          <SunArc
            latitude={latitude} day={solar.today} currentWatts={current.watts}
            peakWatts={nominalPower} efficiency={solar.efficiency}
            harvestedKwh={harvestedKwh} expectedKwh={expectedKwh}
          />
        </Card>

        {/* Row 2: PanelTilt | 4 Gauges 2x2 | HarvestCurve (Sprint 1 layout) */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 1fr", gap: 8, flex: 1, minHeight: 0 }}>

          {/* Left: Panel Tilt */}
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, overflow: "hidden" }}>
            <PanelTilt currentAngle={fixedAngle} optimalAngle={Math.abs(solar.optimal)} efficiency={solar.efficiency} width={250} height={170} />
          </Card>

          {/* Center: 4 Mini Gauges 2x2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 6 }}>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
              <MiniGauge value={current.watts} max={500} label="Watts" unit="W" color={colors.green} size={100} />
            </Card>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
              <MiniGauge value={current.voltage} max={50} label="Voltaje" unit="V" color={colors.cyan} size={100} />
            </Card>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
              <MiniGauge value={current.amps} max={15} label="Corriente" unit="A" color={colors.amber} size={100} />
            </Card>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
              <MiniGauge value={solar.efficiency} max={100} label="Eficiencia" unit="%" color={solar.efficiency > 90 ? colors.green : colors.amber} size={100} />
            </Card>
          </div>

          {/* Right: Harvest Curve (replaces old sparkline) */}
          <Card style={{ padding: 10, minHeight: 140, display: "flex", flexDirection: "column" }}>
            <HarvestCurve
              history={history}
              nominalPower={nominalPower}
              sunriseH={solar.rise}
              sunsetH={solar.set}
              currentHour={hourDecimal}
              harvestedKwh={harvestedKwh}
              expectedKwh={expectedKwh}
            />
          </Card>
        </div>

        {/* Row 3: Efficiency Donut | Monthly | Savings — bottom strip */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: 8, flexShrink: 0 }}>

          {/* Efficiency Donut */}
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
            <EfficiencyDonut efficiency={solar.efficiency} angleLoss={solar.loss} cloudLoss={3} size={130} />
          </Card>

          {/* Annual Angle Wheel */}
          <Card style={{ padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AnnualWheel months={solar.months} currentMonth={currentMonth} size={150} />
          </Card>

          {/* Savings Ticker */}
          <Card style={{ padding: 10, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ ...typography.label, display: "block", marginBottom: 8, fontSize: 9 }}>Ahorro hoy</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <SavingsRow label="Optimo" value={solar.savings.optimal} color={colors.green} prefix="$" />
              <div style={{ height: 1, background: colors.border }} />
              <SavingsRow label="Actual" value={solar.savings.actual} color={colors.textSecondary} prefix="$" />
              <div style={{ height: 1, background: colors.border }} />
              <SavingsRow label="Ahorras" value={solar.savings.savings} color={solar.savings.savings > 0 ? colors.amber : colors.green} prefix={solar.savings.savings > 0 ? "-$" : "+$"} />
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 8, position: "relative", height: 3, background: colors.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                position: "absolute", inset: "0 auto 0 0", borderRadius: 2, background: colors.green,
                width: `${Math.min(100, (solar.savings.actual / Math.max(0.01, solar.savings.optimal)) * 100)}%`,
                transition: "width 1s ease-out",
              }} />
            </div>
          </Card>
        </div>
      </div>

      <StatusBar />
    </div>
  );
}

/* ── Sub-components ── */

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: 10,
      padding: 12,
      display: "flex",
      flexDirection: "column",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SavingsRow({ label, value, color, prefix }: {
  label: string; value: number; color: string; prefix: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 9, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 200, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums", color }}>
        {prefix}<AnimatedNumber value={Math.abs(value)} decimals={2} />
      </span>
    </div>
  );
}
