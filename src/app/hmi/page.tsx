import { useMemo } from "react";
import SunArc from "@/components/hmi/sun-arc";
import { PanelTilt } from "@/components/hmi/panel-tilt";
import { MiniGauge } from "@/components/hmi/mini-gauge";
import { EfficiencyDonut } from "@/components/hmi/efficiency-donut";
import { HarvestCurve } from "@/components/hmi/harvest-curve";
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
            fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            color: colors.cyan, padding: "2px 6px", border: `1px solid ${colors.cyan}40`, borderRadius: 3,
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px", gap: 8, minHeight: 0, overflow: "hidden" }}>

        {/* Row 1: Sun Arc */}
        <Card style={{ padding: "8px 12px 4px", flexShrink: 0 }}>
          <SunArc
            latitude={latitude} day={solar.today} currentWatts={current.watts}
            peakWatts={nominalPower} efficiency={solar.efficiency}
            harvestedKwh={harvestedKwh} expectedKwh={expectedKwh}
          />
        </Card>

        {/* Row 2: Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: 8, flex: 1, minHeight: 0 }}>

          {/* Col 1: Panel Tilt + Efficiency Donut */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            <Card style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
              <PanelTilt currentAngle={fixedAngle} optimalAngle={Math.abs(solar.optimal)} efficiency={solar.efficiency} width={260} height={180} />
            </Card>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
              <EfficiencyDonut efficiency={solar.efficiency} angleLoss={solar.loss} cloudLoss={3} size={140} />
            </Card>
          </div>

          {/* Col 2: 4 Mini Gauges (2x2) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 6 }}>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 6 }}>
              <MiniGauge value={current.watts} max={500} label="Watts" unit="W" color={colors.green} size={110} />
            </Card>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 6 }}>
              <MiniGauge value={current.voltage} max={50} label="Voltaje" unit="V" color={colors.cyan} size={110} />
            </Card>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 6 }}>
              <MiniGauge value={current.amps} max={15} label="Corriente" unit="A" color={colors.amber} size={110} />
            </Card>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 6 }}>
              <MiniGauge value={solar.efficiency} max={100} label="Eficiencia" unit="%" color={solar.efficiency > 90 ? colors.green : colors.amber} size={110} />
            </Card>
          </div>

          {/* Col 3: Harvest Curve + Monthly + Savings stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            {/* Harvest Curve */}
            <Card style={{ flex: 1, padding: 10, minHeight: 100 }}>
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

            {/* Monthly + Savings row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 8, flexShrink: 0 }}>
              {/* Monthly */}
              <Card style={{ padding: 8 }}>
                <span style={{ ...typography.label, display: "block", marginBottom: 4, fontSize: 8 }}>Angulos anuales</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2 }}>
                  {solar.months.map((m, i) => {
                    const isCurr = i === currentMonth;
                    return (
                      <div key={i} style={{
                        textAlign: "center", padding: "2px 0", borderRadius: 3,
                        background: isCurr ? `${colors.cyan}15` : "transparent",
                        border: isCurr ? `1px solid ${colors.cyan}40` : "1px solid transparent",
                      }}>
                        <div style={{ fontSize: 6, color: isCurr ? colors.cyan : colors.textTertiary, fontWeight: 700 }}>
                          {m.month.slice(0, 3).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 200, fontFamily: fonts.mono, color: isCurr ? colors.textPrimary : colors.textSecondary }}>
                          {Math.abs(m.angle).toFixed(0)}°
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Savings */}
              <Card style={{ padding: 8, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ ...typography.label, display: "block", marginBottom: 4, fontSize: 8 }}>Ahorro</span>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 6, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Optimo</div>
                    <span style={{ fontSize: 14, fontWeight: 200, fontFamily: fonts.mono, color: colors.green }}>
                      $<AnimatedNumber value={solar.savings.optimal} decimals={2} />
                    </span>
                  </div>
                  <div style={{ width: 1, height: 20, background: colors.border }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 6, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pierdes</div>
                    <span style={{ fontSize: 14, fontWeight: 200, fontFamily: fonts.mono, color: colors.red }}>
                      -$<AnimatedNumber value={solar.savings.savings} decimals={2} />
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: 10,
      padding: 12,
      ...style,
    }}>
      {children}
    </div>
  );
}
