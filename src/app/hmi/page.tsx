import { useMemo } from "react";
import SunArc from "@/components/hmi/sun-arc";
import { PanelTilt } from "@/components/hmi/panel-tilt";
import { MiniGauge } from "@/components/hmi/mini-gauge";
import StatusBar from "@/components/hmi/status-bar";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { useSensorSimulation } from "@/hooks/use-sensor-simulation";
import { useSettingsStore } from "@/stores/settings-store";
import {
  optimalAngle, angleDirection, dayOfYear, relativeEfficiency,
  energyLossPercent, sunHoursEstimate, dailySavings, monthlyAngles,
} from "@/lib/solar";
import { colors, fonts, typography } from "@/lib/hmi-tokens";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";

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
    return { today, optimal, direction, sunH, efficiency, loss, savings, months };
  }, [latitude, fixedAngle, nominalPower, tariffPerKwh]);

  const currentMonth = new Date().getMonth();
  // Rough daily kWh accumulation estimate from current watts
  const now = new Date();
  const hourDecimal = now.getHours() + now.getMinutes() / 60;
  const harvestedKwh = (current.watts * Math.max(0, hourDecimal - 6)) / 1000;
  const expectedKwh = (nominalPower * solar.sunH) / 1000;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100vh",
      background: colors.bgDeep,
      overflow: "hidden",
      fontFamily: fonts.primary,
    }}>
      {/* ── Header Strip ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>SolarCalc</span>
          <span style={{
            fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
            color: colors.cyan, padding: "2px 8px", border: `1px solid ${colors.cyan}40`, borderRadius: 4,
          }}>PRODUCCION</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, color: colors.textTertiary }}>{locationName} · {latitude.toFixed(1)}°N</span>
          <span style={{ fontSize: 20, fontWeight: 200, fontFamily: fonts.mono, color: colors.textPrimary }}>
            <AnimatedNumber value={current.watts} decimals={0} duration={300} />
            <span style={{ fontSize: 12, color: colors.textTertiary, marginLeft: 4 }}>W</span>
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "12px 20px", gap: 12, minHeight: 0 }}>

        {/* Row 1: Sun Arc (hero, full width) */}
        <div style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "12px 16px 8px",
          flexShrink: 0,
        }}>
          <SunArc
            latitude={latitude}
            day={solar.today}
            currentWatts={current.watts}
            peakWatts={nominalPower}
            efficiency={solar.efficiency}
            harvestedKwh={harvestedKwh}
            expectedKwh={expectedKwh}
          />
        </div>

        {/* Row 2: Panel Tilt + Gauges + Live Chart */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 1fr", gap: 12, flex: 1, minHeight: 0 }}>

          {/* Panel Tilt Diagram */}
          <div style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <PanelTilt
              currentAngle={fixedAngle}
              optimalAngle={Math.abs(solar.optimal)}
              efficiency={solar.efficiency}
            />
          </div>

          {/* 4 Mini Gauges in 2x2 grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8 }}>
            <GaugeCard>
              <MiniGauge value={current.watts} max={500} label="Watts" unit="W" color={colors.green} size={90} />
            </GaugeCard>
            <GaugeCard>
              <MiniGauge value={current.voltage} max={50} label="Voltaje" unit="V" color={colors.cyan} size={90} />
            </GaugeCard>
            <GaugeCard>
              <MiniGauge value={current.amps} max={15} label="Corriente" unit="A" color={colors.amber} size={90} />
            </GaugeCard>
            <GaugeCard>
              <MiniGauge value={solar.efficiency} max={100} label="Eficiencia" unit="%" color={solar.efficiency > 90 ? colors.green : colors.amber} size={90} />
            </GaugeCard>
          </div>

          {/* Live Sparkline + Monthly + Savings stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
            {/* Sparkline */}
            <div style={{
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: 10,
              flex: 1,
              minHeight: 80,
            }}>
              <span style={{ ...typography.label, display: "block", marginBottom: 4 }}>Produccion 60s</span>
              <div style={{ width: "100%", height: "calc(100% - 20px)", minHeight: 60 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hmiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.green} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={colors.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: colors.textTertiary, fontSize: 7 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: colors.textTertiary, fontSize: 8 }} tickLine={false} axisLine={false} domain={[0, "auto"]} />
                    <Area type="monotone" dataKey="watts" stroke={colors.green} strokeWidth={1.5} fill="url(#hmiGrad)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Compact + Savings row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexShrink: 0 }}>
              {/* Monthly mini */}
              <div style={{
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 8,
              }}>
                <span style={{ ...typography.label, display: "block", marginBottom: 4, fontSize: 8 }}>Angulos anuales</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2 }}>
                  {solar.months.map((m, i) => {
                    const isCurr = i === currentMonth;
                    return (
                      <div key={i} style={{
                        textAlign: "center",
                        padding: "3px 1px",
                        borderRadius: 4,
                        background: isCurr ? `${colors.cyan}15` : "transparent",
                        border: isCurr ? `1px solid ${colors.cyan}40` : "1px solid transparent",
                      }}>
                        <div style={{ fontSize: 7, color: isCurr ? colors.cyan : colors.textTertiary, fontWeight: 600 }}>
                          {m.month.slice(0, 3).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 200, fontFamily: fonts.mono, color: isCurr ? colors.textPrimary : colors.textSecondary }}>
                          {Math.abs(m.angle).toFixed(0)}°
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Savings */}
              <div style={{
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 8,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}>
                <span style={{ ...typography.label, display: "block", marginBottom: 6, fontSize: 8 }}>Ahorro hoy</span>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 7, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Optimo</div>
                    <span style={{ fontSize: 16, fontWeight: 200, fontFamily: fonts.mono, color: colors.green }}>
                      $<AnimatedNumber value={solar.savings.optimal} decimals={2} />
                    </span>
                  </div>
                  <div style={{ width: 1, height: 24, background: colors.border }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 7, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Pierdes</div>
                    <span style={{ fontSize: 16, fontWeight: 200, fontFamily: fonts.mono, color: colors.red }}>
                      -$<AnimatedNumber value={solar.savings.savings} decimals={2} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <StatusBar />
    </div>
  );
}

function GaugeCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
      borderRadius: 10,
      padding: "6px 2px 2px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      {children}
    </div>
  );
}
