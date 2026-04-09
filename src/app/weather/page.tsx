import { useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { PageTransition } from "@/components/layout/page-transition";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { sunHoursEstimate, dayOfYear, optimalAngle, estimatedProduction } from "@/lib/solar";
import { useSettingsStore } from "@/stores/settings-store";
import { useWeather } from "@/hooks/use-weather";
import { weatherDescription, uvLabel, cloudEfficiencyFactor } from "@/lib/weather";
import { Sun, Cloud, Droplets, Wind, Loader2, AlertTriangle } from "lucide-react";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

export function WeatherPage() {
  const { latitude, nominalPower, fixedAngle } = useSettingsStore();
  const { weather, loading, error } = useWeather();

  const solar = useMemo(() => {
    const today = dayOfYear();
    const sunH = sunHoursEstimate(latitude, today);
    const angle = optimalAngle(latitude, today);
    const optProd = estimatedProduction(nominalPower, angle, angle, 15) * sunH / 1000;
    const fixProd = estimatedProduction(nominalPower, fixedAngle, angle, 15) * sunH / 1000;
    return { sunH, optProd, fixProd };
  }, [latitude, nominalPower, fixedAngle]);

  const current = weather?.current;
  const daily = weather?.daily ?? [];

  const todayStats = [
    {
      icon: Sun,
      label: "Radiacion",
      value: current ? current.radiation / 1000 : 0,
      unit: "kW/m²",
      color: "#FFB800",
    },
    {
      icon: Cloud,
      label: "Nubes",
      value: current?.cloudCover ?? 0,
      unit: "%",
      color: "#fff",
    },
    {
      icon: Droplets,
      label: "Indice UV",
      value: current?.uvIndex ?? 0,
      unit: current ? uvLabel(current.uvIndex) : "",
      color: "#FF3B30",
    },
    {
      icon: Wind,
      label: "Horas Sol",
      value: daily[0]?.sunshineHours ?? solar.sunH,
      unit: "h",
      color: "#00D26A",
    },
  ];

  return (
    <PageTransition>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{ display: "flex", flexDirection: "column", padding: "24px 0", gap: 20 }}
      >
        {/* Header */}
        <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={labelStyle}>Pronostico Solar</span>
          {loading && <Loader2 size={14} style={{ color: "#555", animation: "spin 1s linear infinite" }} />}
          {error && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#FF3B30" }}>
              <AlertTriangle size={12} /> Sin conexion — datos calculados
            </span>
          )}
          {current && (
            <span style={{ fontSize: 10, color: "#555" }}>
              {weatherDescription(current.weatherCode)} · {current.temperature.toFixed(0)}°C
            </span>
          )}
        </motion.div>

        {/* Today Stats */}
        <motion.div variants={fadeUp} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {todayStats.map(({ icon: Icon, label, value, unit, color }) => (
            <div key={label} style={cardStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <Icon size={14} style={{ color: "#555" }} />
                <span style={labelStyle}>{label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{
                  fontSize: 36, fontWeight: 200, fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: "tabular-nums", color, lineHeight: 1,
                }}>
                  <AnimatedNumber value={value} decimals={1} />
                </span>
                <span style={{ fontSize: 14, fontWeight: 300, color: "#555" }}>{unit}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* 7-Day Forecast */}
        <motion.div variants={fadeUp} style={cardStyle}>
          <span style={{ ...labelStyle, display: "block", marginBottom: 16 }}>Pronostico 7 dias</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {daily.map((d, i) => {
              const date = new Date(d.date + "T12:00:00");
              const maxSunH = Math.max(...daily.map((x) => x.sunshineHours), 1);
              return (
                <motion.div
                  key={d.date}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 0" }}
                >
                  <span style={{ fontSize: 11, color: "#555" }}>{DAY_NAMES[date.getDay()]}</span>
                  <div style={{ position: "relative", width: "100%", height: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.sunshineHours / maxSunH) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        width: 24,
                        background: "rgba(255,184,0,0.2)",
                        borderRadius: "4px 4px 0 0",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        height: `${cloudEfficiencyFactor(d.cloudCoverMean) * 100}%`,
                        background: "rgba(255,184,0,0.6)",
                        borderRadius: "4px 4px 0 0",
                      }} />
                    </motion.div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums", color: "#A0A0A0" }}>
                    {d.sunshineHours.toFixed(1)}h
                  </span>
                  <span style={{ fontSize: 10, color: "#555" }}>{d.cloudCoverMean}%</span>
                  <span style={{ fontSize: 9, color: "#444" }}>
                    {d.tempMin.toFixed(0)}°/{d.tempMax.toFixed(0)}°
                  </span>
                </motion.div>
              );
            })}
            {/* Fallback when no data */}
            {daily.length === 0 && !loading && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 24, color: "#555", fontSize: 12 }}>
                Sin datos de pronostico
              </div>
            )}
          </div>
        </motion.div>

        {/* Production Estimate */}
        <motion.div variants={fadeUp} style={cardStyle}>
          <span style={{ ...labelStyle, display: "block", marginBottom: 16 }}>Estimacion de produccion</span>
          <div style={{ display: "flex", alignItems: "center" }}>
            <ProductionCol label="Angulo optimo" value={solar.optProd} color="#00D26A" />
            <div style={dividerStyle} />
            <ProductionCol label={`Angulo fijo (${fixedAngle}\u00B0)`} value={solar.fixProd} color="#A0A0A0" />
            <div style={dividerStyle} />
            <ProductionCol label="Diferencia" value={solar.optProd - solar.fixProd} color="#FFB800" prefix="+" />
          </div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}

function ProductionCol({ label, value, color, prefix }: {
  label: string; value: number; color: string; prefix?: string;
}) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#555", marginBottom: 6 }}>
        {label}
      </div>
      <span style={{ fontSize: 28, fontWeight: 200, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums", color }}>
        {prefix}<AnimatedNumber value={value} decimals={1} />
      </span>
      <span style={{ fontSize: 14, fontWeight: 300, color: "#555", marginLeft: 4 }}>kWh/dia</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(10,10,10,0.8)", border: "1px solid #1E1E1E", borderRadius: 16,
  padding: 24, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transition: "border-color 0.2s",
};
const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555" };
const dividerStyle: React.CSSProperties = { width: 1, height: 40, background: "#1E1E1E", flexShrink: 0 };
function hoverIn(e: React.MouseEvent<HTMLDivElement>) { e.currentTarget.style.borderColor = "#333"; }
function hoverOut(e: React.MouseEvent<HTMLDivElement>) { e.currentTarget.style.borderColor = "#1E1E1E"; }
