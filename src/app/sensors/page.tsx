import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { PageTransition } from "@/components/layout/page-transition";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { optimalAngle, dayOfYear, estimatedProduction, relativeEfficiency } from "@/lib/solar";
import { useSettingsStore } from "@/stores/settings-store";
import { Activity, Zap, Battery } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/* ── Shared inline style objects ── */

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

const heroNumberStyle: React.CSSProperties = {
  fontSize: 64,
  fontWeight: 200,
  fontFamily: "'JetBrains Mono', monospace",
  fontVariantNumeric: "tabular-nums",
  color: "#fff",
  lineHeight: 1,
};

const statNumberStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 200,
  fontFamily: "'JetBrains Mono', monospace",
  fontVariantNumeric: "tabular-nums",
  color: "#fff",
  lineHeight: 1,
};

/** Generates realistic demo sensor data that follows solar curve */
function generateDemoData() {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  // Solar production curve: peaks at noon, zero at night
  const solarFactor = Math.max(0, Math.sin((hour - 6) / 12 * Math.PI));
  const base = 400 * solarFactor;
  const noise = (Math.random() - 0.5) * 20;
  const watts = Math.max(0, base + noise);
  const voltage = watts > 0 ? 36 + Math.random() * 4 : 0;
  const amps = voltage > 0 ? watts / voltage : 0;
  return { watts, voltage, amps, timestamp: Date.now() };
}

export function SensorsPage() {
  const { latitude, fixedAngle, nominalPower } = useSettingsStore();
  const [readings, setReadings] = useState<Array<{ watts: number; time: string }>>([]);
  const [current, setCurrent] = useState(generateDemoData());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const angle = useMemo(() => optimalAngle(latitude, dayOfYear()), [latitude]);
  const efficiency = useMemo(() => relativeEfficiency(fixedAngle, angle) * 100, [fixedAngle, angle]);

  // Simulate 1Hz sensor data
  useEffect(() => {
    const interval = setInterval(() => {
      const data = generateDemoData();
      setCurrent(data);
      setReadings((prev) => {
        const next = [
          ...prev,
          { watts: data.watts, time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
        ];
        return next.slice(-60); // Keep last 60 seconds
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayKwh = (current.watts * 6) / 1000; // rough estimate

  const efficiencyBarColor = efficiency > 95
    ? "#00D26A"
    : efficiency > 80
      ? "#FFB800"
      : "#FF4D4D";

  const liveCards = [
    { id: "voltage", icon: Zap, label: "Voltaje", value: current.voltage, unit: "V", decimals: 1 },
    { id: "current", icon: Activity, label: "Corriente", value: current.amps, unit: "A", decimals: 2 },
    { id: "today", icon: Battery, label: "Hoy", value: todayKwh, unit: "kWh", decimals: 1 },
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
          <span style={labelStyle}>
            Energia en Tiempo Real
          </span>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 6,
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#00D26A",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }} />
            <span style={{
              fontSize: 11,
              color: "#555",
            }}>
              Demo — datos simulados a 1Hz
            </span>
          </div>
        </motion.div>

        {/* ── Hero: Current Watts ── */}
        <motion.div
          variants={fadeUp}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span style={heroNumberStyle}>
            <AnimatedNumber value={current.watts} decimals={1} duration={300} />
          </span>
          <span style={{
            fontSize: 20,
            fontWeight: 300,
            color: "#555",
          }}>
            W
          </span>
        </motion.div>

        {/* ── Live Values Grid ── */}
        <motion.div
          variants={fadeUp}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {liveCards.map(({ id, icon: Icon, label, value, unit, decimals }) => (
            <div
              key={id}
              style={{
                ...cardStyle,
                borderColor: hoveredCard === id ? "#333" : "#1E1E1E",
              }}
              onMouseEnter={() => setHoveredCard(id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}>
                <Icon
                  size={14}
                  style={{ color: "#555" }}
                  aria-hidden="true"
                />
                <span style={labelStyle}>{label}</span>
              </div>
              <div style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
              }}>
                <span style={statNumberStyle}>
                  <AnimatedNumber value={value} decimals={decimals} duration={300} />
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

        {/* ── Live Chart ── */}
        <motion.div
          variants={fadeUp}
          style={{
            ...cardStyle,
            borderColor: hoveredCard === "chart" ? "#333" : "#1E1E1E",
            width: "100%",
          }}
          onMouseEnter={() => setHoveredCard("chart")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <span style={{
            ...labelStyle,
            display: "block",
            marginBottom: 16,
          }}>
            Produccion — ultimos 60 segundos
          </span>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wattGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D26A" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00D26A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#666", fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#666", fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, "auto"]} />
                <Area
                  type="monotone"
                  dataKey="watts"
                  stroke="#00D26A"
                  strokeWidth={1.5}
                  fill="url(#wattGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Efficiency Bar ── */}
        <motion.div
          variants={fadeUp}
          style={{
            ...cardStyle,
            borderColor: hoveredCard === "efficiency" ? "#333" : "#1E1E1E",
          }}
          onMouseEnter={() => setHoveredCard("efficiency")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}>
            <span style={labelStyle}>
              Eficiencia — real vs optimo
            </span>
            <span style={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: "tabular-nums",
              color: "#888",
            }}>
              {efficiency.toFixed(1)}%
            </span>
          </div>
          <div style={{
            position: "relative",
            height: 4,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 9999,
            overflow: "hidden",
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${efficiency}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                borderRadius: 9999,
                background: efficiencyBarColor,
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
