import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp, transitions } from "@/lib/motion";
import { PageTransition } from "@/components/layout/page-transition";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { optimalAngle, angleDirection, dayOfYear } from "@/lib/solar";
import { useSettingsStore } from "@/stores/settings-store";
import { ChevronLeft, ChevronRight, Target, Clock } from "lucide-react";

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

const inactiveButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #1E1E1E",
  color: "#666",
  borderRadius: 12,
  padding: "12px 0",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  transition: "border-color 0.2s, color 0.2s, background 0.2s",
};

const activeButtonStyle: React.CSSProperties = {
  ...inactiveButtonStyle,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff",
};

const nudgeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #1E1E1E",
  color: "#A0A0A0",
  borderRadius: 8,
  height: 36,
  padding: "0 16px",
  fontSize: 12,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
  transition: "border-color 0.2s",
};

const goOptimalStyle: React.CSSProperties = {
  background: "#fff",
  color: "#000",
  border: "none",
  borderRadius: 10,
  height: 36,
  padding: "0 20px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  transition: "opacity 0.2s",
};

export function ControlPage() {
  const { latitude, fixedAngle } = useSettingsStore();
  const [currentAngle, setCurrentAngle] = useState(fixedAngle);
  const [mode, setMode] = useState<"auto" | "monthly" | "manual">("manual");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const optimal = useMemo(() => optimalAngle(latitude, dayOfYear()), [latitude]);
  const direction = angleDirection(optimal);

  const goToOptimal = () => setCurrentAngle(Math.round(optimal * 10) / 10);

  const hoverProps = (id: string) => ({
    onMouseEnter: () => setHoveredCard(id),
    onMouseLeave: () => setHoveredCard(null),
    style: {
      ...cardStyle,
      borderColor: hoveredCard === id ? "#333" : "#1E1E1E",
    } as React.CSSProperties,
  });

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
        {/* Header */}
        <motion.div variants={fadeUp}>
          <span style={{ ...labelStyle, display: "block", letterSpacing: "0.12em" }}>
            Control de Panel
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#FFB800",
            }} />
            <span style={{ fontSize: 11, color: "#555" }}>Demo -- servo simulado</span>
          </div>
        </motion.div>

        {/* Angle Gauge */}
        <motion.div
          variants={fadeUp}
          {...hoverProps("gauge")}
          style={{
            ...hoverProps("gauge").style,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* SVG Gauge */}
          <div style={{ position: "relative", width: 256, height: 144, marginBottom: 16 }}>
            <svg viewBox="0 0 200 110" style={{ width: "100%", height: "100%" }}>
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#1E1E1E"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Optimal marker */}
              {(() => {
                const optAngle = (optimal / 60) * 180;
                const rad = (180 - optAngle) * (Math.PI / 180);
                const x = 100 + 80 * Math.cos(rad);
                const y = 100 - 80 * Math.sin(rad);
                return <circle cx={x} cy={y} r="4" fill="#FFB800" opacity={0.6} />;
              })()}
              {/* Current needle */}
              {(() => {
                const curAngle = (currentAngle / 60) * 180;
                const rad = (180 - curAngle) * (Math.PI / 180);
                const x = 100 + 70 * Math.cos(rad);
                const y = 100 - 70 * Math.sin(rad);
                return (
                  <motion.line
                    x1="100" y1="100"
                    animate={{ x2: x, y2: y }}
                    transition={transitions.spring}
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })()}
              <circle cx="100" cy="100" r="4" fill="white" />
              {/* Labels */}
              <text x="15" y="108" fill="#666" fontSize="10" fontFamily="JetBrains Mono">0</text>
              <text x="170" y="108" fill="#666" fontSize="10" fontFamily="JetBrains Mono">60</text>
            </svg>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24, textAlign: "center" }}>
            <div>
              <span style={{ ...labelStyle, display: "block", marginBottom: 4 }}>Actual</span>
              <span style={{
                fontSize: 28,
                fontWeight: 200,
                fontFamily: "JetBrains Mono, monospace",
                fontVariantNumeric: "tabular-nums",
                color: "#fff",
              }}>
                <AnimatedNumber value={currentAngle} decimals={1} />
              </span>
            </div>
            <div style={{ width: 1, height: 40, background: "#1E1E1E" }} />
            <div>
              <span style={{ ...labelStyle, display: "block", marginBottom: 4 }}>Optimo</span>
              <span style={{
                fontSize: 28,
                fontWeight: 200,
                fontFamily: "JetBrains Mono, monospace",
                fontVariantNumeric: "tabular-nums",
                color: "#FFB800",
              }}>
                {Math.abs(optimal).toFixed(1)} {direction}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Mode Selector */}
        <motion.div
          variants={fadeUp}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}
        >
          {([
            { key: "auto", label: "Auto", desc: "Ajuste diario" },
            { key: "monthly", label: "Mensual", desc: "1x al mes" },
            { key: "manual", label: "Manual", desc: "Control directo" },
          ] as const).map(({ key, label, desc }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={mode === key ? activeButtonStyle : inactiveButtonStyle}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 10, color: mode === key ? "rgba(255,255,255,0.5)" : "#555" }}>
                {desc}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Manual Controls */}
        <motion.div variants={fadeUp} {...hoverProps("controls")}>
          <span style={{ ...labelStyle, display: "block", marginBottom: 16 }}>
            Control manual
          </span>

          {/* Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <span style={{
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
              color: "#555",
              width: 24,
            }}>0</span>
            <input
              type="range"
              min={0}
              max={60}
              step={0.1}
              value={currentAngle}
              onChange={(e) => setCurrentAngle(Number(e.target.value))}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                appearance: "none",
                WebkitAppearance: "none",
                background: "rgba(255,255,255,0.06)",
                cursor: "pointer",
                accentColor: "#fff",
              }}
            />
            <span style={{
              fontSize: 11,
              fontFamily: "JetBrains Mono, monospace",
              color: "#555",
              width: 32,
            }}>60</span>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentAngle(Math.max(0, currentAngle - 1))}
              style={nudgeButtonStyle}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} /> -1
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goToOptimal}
              style={goOptimalStyle}
            >
              <Target style={{ width: 14, height: 14 }} /> Ir a optimo
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentAngle(Math.min(60, currentAngle + 1))}
              style={nudgeButtonStyle}
            >
              +1 <ChevronRight style={{ width: 14, height: 14 }} />
            </motion.button>
          </div>
        </motion.div>

        {/* Adjustment History */}
        <motion.div variants={fadeUp} {...hoverProps("history")}>
          <span style={{ ...labelStyle, display: "block", marginBottom: 12 }}>
            Historial de ajustes
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { date: "Abr 1 08:00", angle: "27.4 Sur", mode: "Auto" },
              { date: "Mar 1 08:00", angle: "24.1 Sur", mode: "Auto" },
              { date: "Feb 1 08:00", angle: "22.3 Sur", mode: "Auto" },
            ].map((entry, i, arr) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid #1E1E1E" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock style={{ width: 12, height: 12, color: "#555" }} />
                  <span style={{ fontSize: 12, color: "#888" }}>{entry.date}</span>
                </div>
                <span style={{
                  fontSize: 12,
                  fontFamily: "JetBrains Mono, monospace",
                  fontVariantNumeric: "tabular-nums",
                  color: "#ccc",
                }}>{entry.angle}</span>
                <span style={{
                  fontSize: 10,
                  color: "#555",
                  background: "rgba(255,255,255,0.04)",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}>{entry.mode}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
