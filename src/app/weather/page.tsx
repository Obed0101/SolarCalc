import { useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { PageTransition } from "@/components/layout/page-transition";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { sunHoursEstimate, dayOfYear, optimalAngle, estimatedProduction } from "@/lib/solar";
import { useSettingsStore } from "@/stores/settings-store";
import { Sun, Cloud, Droplets, Wind } from "lucide-react";

export function WeatherPage() {
  const { latitude, nominalPower, fixedAngle } = useSettingsStore();

  const data = useMemo(() => {
    const today = dayOfYear();
    const sunH = sunHoursEstimate(latitude, today);
    const angle = optimalAngle(latitude, today);
    const optProd = estimatedProduction(nominalPower, angle, angle, 15) * sunH / 1000;
    const fixProd = estimatedProduction(nominalPower, fixedAngle, angle, 15) * sunH / 1000;

    // Mock 7-day forecast (demo)
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const d = today + i;
      const clouds = Math.round(10 + Math.random() * 40);
      const sh = sunHoursEstimate(latitude, d) * (1 - clouds / 200);
      return { day: d, clouds, sunHours: sh, date: new Date(2026, 0, d) };
    });

    return { sunH, optProd, fixProd, forecast };
  }, [latitude, nominalPower, fixedAngle]);

  const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

  const colorMap: Record<string, string> = {
    warning: "#FFB800",
    white: "#fff",
    danger: "#FF3B30",
    success: "#00D26A",
  };

  const todayStats = [
    { icon: Sun, label: "Radiacion", value: 5.8, unit: "kWh/m2", color: "warning" },
    { icon: Cloud, label: "Nubes", value: 15, unit: "%", color: "white" },
    { icon: Droplets, label: "Indice UV", value: 8, unit: "alto", color: "danger" },
    { icon: Wind, label: "Horas Sol", value: data.sunH, unit: "h", color: "success" },
  ];

  return (
    <PageTransition>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          gap: 20,
        }}
      >
        {/* ── Header ── */}
        <motion.div variants={fadeUp}>
          <span style={labelStyle}>Pronostico Solar</span>
        </motion.div>

        {/* ── Today Stats — 4 columns ── */}
        <motion.div
          variants={fadeUp}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {todayStats.map(({ icon: Icon, label, value, unit, color }) => (
            <div
              key={label}
              style={cardStyle}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 14,
              }}>
                <Icon size={14} style={{ color: "#555" }} />
                <span style={labelStyle}>{label}</span>
              </div>
              <div style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
              }}>
                <span style={{
                  fontSize: 36,
                  fontWeight: 200,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: "tabular-nums",
                  color: colorMap[color],
                  lineHeight: 1,
                }}>
                  <AnimatedNumber value={value} decimals={1} />
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 300,
                  color: "#555",
                }}>
                  {unit}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── 7-Day Forecast ── */}
        <motion.div variants={fadeUp} style={cardStyle}>
          <span style={{ ...labelStyle, display: "block", marginBottom: 16 }}>
            Pronostico 7 dias
          </span>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
          }}>
            {data.forecast.map((d, i) => (
              <motion.div
                key={d.day}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 0",
                }}
              >
                <span style={{
                  fontSize: 11,
                  color: "#555",
                }}>
                  {dayNames[d.date.getDay()]}
                </span>
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: 80,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.sunHours / 14) * 100}%` }}
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
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${100 - d.clouds}%`,
                      background: "rgba(255,184,0,0.6)",
                      borderRadius: "4px 4px 0 0",
                    }} />
                  </motion.div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: "tabular-nums",
                  color: "#A0A0A0",
                }}>
                  {d.sunHours.toFixed(1)}h
                </span>
                <span style={{
                  fontSize: 10,
                  color: "#555",
                }}>
                  {d.clouds}%
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Production Estimate — 3 columns with dividers ── */}
        <motion.div variants={fadeUp} style={cardStyle}>
          <span style={{ ...labelStyle, display: "block", marginBottom: 16 }}>
            Estimacion de produccion
          </span>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}>
            <ProductionCol
              label="Angulo optimo"
              value={data.optProd}
              color="#00D26A"
            />
            <div style={dividerStyle} />
            <ProductionCol
              label={`Angulo fijo (${fixedAngle}\u00B0)`}
              value={data.fixProd}
              color="#A0A0A0"
            />
            <div style={dividerStyle} />
            <ProductionCol
              label="Diferencia"
              value={data.optProd - data.fixProd}
              color="#FFB800"
              prefix="+"
            />
          </div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}

/* ── Subcomponents ── */

function ProductionCol({ label, value, color, prefix }: {
  label: string;
  value: number;
  color: string;
  prefix?: string;
}) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: "#555",
        marginBottom: 6,
      }}>
        {label}
      </div>
      <span style={{
        fontSize: 28,
        fontWeight: 200,
        fontFamily: "'JetBrains Mono', monospace",
        fontVariantNumeric: "tabular-nums",
        color,
      }}>
        {prefix}
        <AnimatedNumber value={value} decimals={1} />
      </span>
      <span style={{
        fontSize: 14,
        fontWeight: 300,
        color: "#555",
        marginLeft: 4,
      }}>
        kWh/dia
      </span>
    </div>
  );
}

/* ── Shared Styles ── */

const cardStyle: React.CSSProperties = {
  background: "rgba(10,10,10,0.8)",
  border: "1px solid #1E1E1E",
  borderRadius: 16,
  padding: 24,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#555",
};

const dividerStyle: React.CSSProperties = {
  width: 1,
  height: 40,
  background: "#1E1E1E",
  flexShrink: 0,
};

function hoverIn(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.borderColor = "#333";
}
function hoverOut(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.borderColor = "#1E1E1E";
}
