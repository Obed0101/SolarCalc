import { useMemo } from "react";
import { motion } from "framer-motion";
import { RadialGauge } from "@/components/hmi/radial-gauge";
import { MiniGauge } from "@/components/hmi/mini-gauge";
import StatusBar from "@/components/hmi/status-bar";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { useSensorSimulation } from "@/hooks/use-sensor-simulation";
import { useSettingsStore } from "@/stores/settings-store";
import { useRuntimeStore } from "@/stores/runtime-store";
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
  const { servoAngle } = useRuntimeStore();
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
      {/* ── Main Content ── */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "55% 45%",
        gridTemplateRows: "auto 1fr auto",
        gap: 0,
        padding: "16px 20px 0 20px",
        minHeight: 0,
      }}>
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingRight: 12 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>
                SolarCalc
              </span>
              <span style={{ ...typography.label, color: colors.cyan, fontSize: 9, padding: "2px 8px", border: `1px solid ${colors.cyan}40`, borderRadius: 4 }}>
                PRODUCCION
              </span>
            </div>
            <span style={{ fontSize: 11, color: colors.textTertiary }}>
              {locationName} · {latitude.toFixed(1)}°N
            </span>
          </div>

          {/* Primary Gauge */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: "12px 0 0 0",
          }}>
            <RadialGauge
              value={Math.abs(solar.optimal)}
              target={Math.abs(solar.optimal)}
              min={0}
              max={35}
              label={`ANGULO ${solar.direction}`}
              unit="°"
              size={220}
              color={solar.loss < 5 ? colors.green : solar.loss < 15 ? colors.amber : colors.red}
            />
          </div>

          {/* Secondary Gauges Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <GaugeCard>
              <MiniGauge value={current.watts} max={500} label="Produccion" unit="W" color={colors.green} size={100} />
            </GaugeCard>
            <GaugeCard>
              <MiniGauge value={current.voltage} max={50} label="Voltaje" unit="V" color={colors.cyan} size={100} />
            </GaugeCard>
            <GaugeCard>
              <MiniGauge value={current.amps} max={15} label="Corriente" unit="A" color={colors.amber} size={100} />
            </GaugeCard>
            <GaugeCard>
              <MiniGauge value={solar.efficiency} max={100} label="Eficiencia" unit="%" color={solar.efficiency > 90 ? colors.green : colors.amber} size={100} />
            </GaugeCard>
          </div>

          {/* Live Sparkline */}
          <div style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 12,
            flex: 1,
            minHeight: 120,
          }}>
            <span style={{ ...typography.label, display: "block", marginBottom: 8 }}>
              Produccion — 60s
            </span>
            <div style={{ width: "100%", height: "calc(100% - 24px)" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hmiWattGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.green} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={colors.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: colors.textTertiary, fontSize: 8 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: colors.textTertiary, fontSize: 9 }} tickLine={false} axisLine={false} domain={[0, "auto"]} />
                  <Area type="monotone" dataKey="watts" stroke={colors.green} strokeWidth={1.5} fill="url(#hmiWattGrad)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Savings Strip */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
            background: colors.bgSurface, border: `1px solid ${colors.border}`,
            borderRadius: 12, padding: "10px 0",
          }}>
            <SavingsCell label="Ganado hoy" value={solar.savings.optimal} color={colors.green} prefix="$" />
            <div style={{ background: colors.border }} />
            <SavingsCell label="Perdido hoy" value={solar.savings.savings} color={colors.red} prefix="-$" />
            <div style={{ background: colors.border }} />
            <SavingsCell label="Horas sol" value={solar.sunH} color={colors.amber} suffix="h" />
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 12 }}>
          {/* 3D Model placeholder (Sprint 2: model-viewer) */}
          <div style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* SVG Panel Silhouette — rotates to angle */}
            <motion.svg
              width="180" height="120" viewBox="0 0 180 120"
              animate={{ rotate: -(solar.optimal - 15) }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            >
              {/* Panel body */}
              <rect x="20" y="30" width="140" height="60" rx="4"
                fill={colors.bgElevated} stroke={colors.border} strokeWidth="1" />
              {/* Grid lines */}
              {[50, 80, 110].map((x) => (
                <line key={x} x1={x} y1="30" x2={x} y2="90" stroke={colors.border} strokeWidth="0.5" />
              ))}
              {[50, 70].map((y) => (
                <line key={y} x1="20" y1={y} x2="160" y2={y} stroke={colors.border} strokeWidth="0.5" />
              ))}
              {/* Stand */}
              <line x1="90" y1="90" x2="90" y2="115" stroke={colors.textTertiary} strokeWidth="2" />
              <line x1="70" y1="115" x2="110" y2="115" stroke={colors.textTertiary} strokeWidth="2" strokeLinecap="round" />
            </motion.svg>
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <span style={{ fontSize: 20, fontWeight: 200, fontFamily: fonts.mono, color: colors.cyan }}>
                <AnimatedNumber value={Math.abs(solar.optimal)} decimals={1} />°
              </span>
              <span style={{ fontSize: 12, color: colors.textSecondary, marginLeft: 6 }}>{solar.direction}</span>
            </div>
            <span style={{ ...typography.label, marginTop: 4, color: colors.textTertiary }}>Panel 3D — Sprint 2</span>
          </div>

          {/* Weather Mini */}
          <div style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 14,
          }}>
            <span style={{ ...typography.label, display: "block", marginBottom: 10 }}>Clima</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {[
                { label: "Temp", value: "31°C", color: colors.textPrimary },
                { label: "UV", value: "8", color: colors.red },
                { label: "Nubes", value: "15%", color: colors.textSecondary },
                { label: "Sol", value: `${solar.sunH.toFixed(1)}h`, color: colors.amber },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 200, fontFamily: fonts.mono, color: item.color }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: 8, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Compact 6x2 Grid */}
          <div style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 14,
          }}>
            <span style={{ ...typography.label, display: "block", marginBottom: 8 }}>Angulos Mensuales</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
              {solar.months.map((m, i) => {
                const isCurrent = i === currentMonth;
                return (
                  <div key={m.month} style={{
                    textAlign: "center",
                    padding: "6px 2px",
                    borderRadius: 6,
                    background: isCurrent ? `${colors.cyan}15` : "transparent",
                    border: isCurrent ? `1px solid ${colors.cyan}40` : "1px solid transparent",
                  }}>
                    <div style={{ fontSize: 8, color: isCurrent ? colors.cyan : colors.textTertiary, fontWeight: 600, textTransform: "uppercase" }}>
                      {m.month.slice(0, 3)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 200, fontFamily: fonts.mono, color: isCurrent ? colors.textPrimary : colors.textSecondary, marginTop: 2 }}>
                      {Math.abs(m.angle).toFixed(0)}°
                    </div>
                    <div style={{ fontSize: 7, color: colors.textTertiary, marginTop: 1 }}>
                      {m.direction.slice(0, 1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formula */}
          <div style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: "10px 14px",
          }}>
            <span style={{ ...typography.label, display: "block", marginBottom: 4 }}>Formula</span>
            <span style={{ fontSize: 11, fontFamily: fonts.mono, color: colors.textSecondary }}>
              θ(d) = {latitude.toFixed(1)}° - 23.44° × sin[(360/365)(d-81)]
            </span>
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <StatusBar />
    </div>
  );
}

/* ── Sub-components ── */

function GaugeCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: colors.bgSurface,
      border: `1px solid ${colors.border}`,
      borderRadius: 10,
      padding: "8px 4px 4px",
      display: "flex",
      justifyContent: "center",
    }}>
      {children}
    </div>
  );
}

function SavingsCell({ label, value, color, prefix, suffix }: {
  label: string; value: number; color: string; prefix?: string; suffix?: string;
}) {
  return (
    <div style={{ textAlign: "center", padding: "0 12px" }}>
      <div style={{ fontSize: 8, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
        {label}
      </div>
      <span style={{ fontSize: 18, fontWeight: 200, fontFamily: fonts.mono, color }}>
        {prefix}<AnimatedNumber value={value} decimals={2} />{suffix}
      </span>
    </div>
  );
}
