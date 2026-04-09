import { useMemo, useState } from "react";
import SunArc from "@/components/hmi/sun-arc";
import { AngleHero, MONTH_NAMES } from "@/components/hmi/angle-hero";
import { MiniGauge } from "@/components/hmi/mini-gauge";
import { EfficiencyDonut } from "@/components/hmi/efficiency-donut";
import { HarvestCurve } from "@/components/hmi/harvest-curve";
import { DotMatrix } from "@/components/hmi/dot-matrix";
import { WeatherChip } from "@/components/hmi/weather-chip";
import { EnergyWidget } from "@/components/hmi/energy-widget";
import { AIAssistant } from "@/components/hmi/ai-assistant";
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
import { useWeather } from "@/hooks/use-weather";
import { Settings2, BarChart3, Zap } from "lucide-react";
import { SettingsPage } from "@/app/settings/page";
import { StatsPage } from "@/app/stats/page";

type DesktopView = "dashboard" | "stats" | "settings";

export function HMIDashboard() {
  const [view, setView] = useState<DesktopView>("dashboard");
  const { latitude, fixedAngle, nominalPower, tariffPerKwh, locationName } = useSettingsStore();
  const { current, history } = useSensorSimulation();
  const { weather } = useWeather();
  const cloudLoss = weather ? weather.current.cloudCover * 0.75 / 100 * 100 : 3;

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

  const now = new Date();
  const hourDecimal = now.getHours() + now.getMinutes() / 60;
  const harvestedKwh = Math.max(0, (current.watts * Math.max(0, hourDecimal - solar.rise)) / 1000);
  const expectedKwh = (nominalPower * solar.sunH) / 1000;
  const monthName = MONTH_NAMES[now.getMonth()] ?? "—";

  return (
    <div style={{
      display: "flex", flexDirection: "column", width: "100%", height: "100vh",
      background: colors.bgDeep, overflow: "hidden", fontFamily: fonts.primary,
    }}>
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 20px", borderBottom: `1px solid ${colors.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>SolarCalc</span>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            <TabBtn icon={<Zap size={12} />} label="Produccion" active={view === "dashboard"} onClick={() => setView("dashboard")} />
            <TabBtn icon={<BarChart3 size={12} />} label="Estadisticas" active={view === "stats"} onClick={() => setView("stats")} />
            <TabBtn icon={<Settings2 size={12} />} label="Config" active={view === "settings"} onClick={() => setView("settings")} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 10, color: colors.textTertiary }}>
            {locationName} · {latitude.toFixed(1)}°N
            {weather && ` · ${weather.current.temperature.toFixed(0)}°C`}
          </span>
          <span style={{ fontSize: 18, fontWeight: 200, fontFamily: fonts.mono, color: colors.textPrimary }}>
            <AnimatedNumber value={current.watts} decimals={0} duration={300} />
            <span style={{ fontSize: 11, color: colors.textTertiary, marginLeft: 3 }}>W</span>
          </span>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>

        {/* Left: Content based on active view */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "6px 12px", gap: 6, overflowY: "auto", overflowX: "hidden", minWidth: 0 }}>

        {view === "stats" && (
          <div style={{ padding: "0 16px" }}>
            <StatsPage />
          </div>
        )}

        {view === "settings" && (
          <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
            <SettingsPage />
          </div>
        )}

        {view === "dashboard" && (<>
        {/* Dashboard content */}

          {/* Row 1: Angle Hero (full width) */}
          <Card style={{ padding: "10px 16px", flexShrink: 0 }}>
            <AngleHero
              currentAngle={fixedAngle}
              optimalAngle={Math.abs(solar.optimal)}
              efficiency={solar.efficiency}
              direction={solar.direction}
              monthName={monthName}
            />
          </Card>

          {/* Row 2: SunArc (full width, compact) */}
          <Card style={{ padding: "6px 12px 2px", flexShrink: 0 }}>
            <SunArc
              latitude={latitude} day={solar.today} currentWatts={current.watts}
              peakWatts={nominalPower} efficiency={solar.efficiency}
              harvestedKwh={harvestedKwh} expectedKwh={expectedKwh}
            />
          </Card>

          {/* Row 3: Gauges 2x2 | HarvestCurve */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, flexShrink: 0 }}>
            {/* 4 Gauges in a strip */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 4 }}>
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

            {/* Harvest Curve */}
            <Card style={{ padding: 8, minHeight: 180, display: "flex", flexDirection: "column" }}>
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

          {/* Row 4: Dot Matrix */}
          <Card style={{ padding: "8px 12px", flexShrink: 0 }}>
            <DotMatrix harvested={harvestedKwh} expected={expectedKwh} rows={3} />
          </Card>

          {/* Row 5: Energy | Weather | Efficiency */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr minmax(120px, 160px)", gap: 6, flexShrink: 0 }}>
            <Card style={{ padding: 10 }}>
              <EnergyWidget
                harvestedKwh={harvestedKwh}
                expectedKwh={expectedKwh}
                currentWatts={current.watts}
                savingsOptimal={solar.savings.optimal}
                savingsActual={solar.savings.actual}
                savingsDiff={solar.savings.savings}
              />
            </Card>
            <Card style={{ padding: 10 }}>
              <WeatherChip weather={weather} loading={!weather} />
            </Card>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
              <EfficiencyDonut efficiency={solar.efficiency} angleLoss={solar.loss} cloudLoss={cloudLoss} size={110} />
            </Card>
          </div>
        </>)}
        </div>

        {/* Right: AI Assistant (full height column, always visible) */}
        <div style={{ width: 280, flexShrink: 0, padding: "6px 12px 6px 0", minHeight: 0 }}>
          <AIAssistant />
        </div>
      </div>

      <StatusBar />
    </div>
  );
}

/* ── Sub-components ── */

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 4, padding: "3px 10px",
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
        border: "none", borderRadius: 6, cursor: "pointer",
        color: active ? colors.textPrimary : colors.textTertiary,
        fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
        fontFamily: fonts.primary, transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {icon} {label}
    </button>
  );
}

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
