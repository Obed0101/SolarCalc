import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { PageTransition } from "@/components/layout/page-transition";
import {
  monthlyAngles,
  annualCurve,
  optimalAngle,
  angleDirection,
  dayOfYear,
} from "@/lib/solar";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { MapPin } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
  Tooltip as RTooltip,
} from "recharts";

/* ── Shared inline-style tokens ─────────────────────── */

const card = {
  background: "rgba(10,10,10,0.8)",
  border: "1px solid #1E1E1E",
  borderRadius: 16,
  padding: 24,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  transition: "border-color 0.2s ease",
} as const;

const overline: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#555",
  margin: 0,
};

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono, ui-monospace, monospace)",
  fontVariantNumeric: "tabular-nums",
};

/* ── Component ──────────────────────────────────────── */

export function CalculatorPage() {
  const [latitude, setLatitude] = useState(9.0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const today = dayOfYear();

  const months = useMemo(() => monthlyAngles(latitude), [latitude]);
  const curve = useMemo(() => annualCurve(latitude), [latitude]);
  const todayAngle = useMemo(
    () => optimalAngle(latitude, today),
    [latitude, today],
  );
  const todayDir = angleDirection(todayAngle);

  function cardStyle(id: string): React.CSSProperties {
    return {
      ...card,
      borderColor: hoveredCard === id ? "#333" : "#1E1E1E",
    };
  }

  return (
    <PageTransition className="h-full overflow-y-auto">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "20px 0",
          gap: 20,
        }}
      >
        {/* ── 1. Header ──────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Left: overline + big angle */}
          <div>
            <p style={overline}>CALCULADORA SOLAR</p>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 200,
                  lineHeight: 1,
                  ...mono,
                }}
              >
                <AnimatedNumber
                  value={Math.abs(todayAngle)}
                  decimals={1}
                />
                &deg;
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 300,
                  color: "#777",
                }}
              >
                {todayDir}
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                color: "#555",
                display: "block",
                marginTop: 4,
              }}
            >
              Angulo optimo hoy (dia {today}) para {latitude.toFixed(1)}
              &deg;N
            </span>
          </div>

          {/* Right: latitude input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid #1E1E1E",
              borderRadius: 10,
              padding: "0 12px",
              height: 36,
            }}
          >
            <MapPin
              size={14}
              style={{ color: "#555", flexShrink: 0 }}
              aria-hidden="true"
            />
            <input
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value) || 0)}
              step={0.1}
              aria-label="Latitud"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                width: 56,
                fontSize: 13,
                color: "#ddd",
                ...mono,
              }}
            />
            <span style={{ fontSize: 11, color: "#555" }}>&deg;N</span>
          </div>
        </motion.div>

        {/* ── 2. Formula card ────────────────────────── */}
        <motion.div
          variants={fadeUp}
          style={{ ...cardStyle("formula"), padding: "16px 20px" }}
          onMouseEnter={() => setHoveredCard("formula")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <p style={{ ...overline, marginBottom: 6 }}>Formula activa</p>
          <p
            style={{
              fontSize: 14,
              color: "#999",
              margin: 0,
              ...mono,
            }}
          >
            &theta;(d) = {latitude.toFixed(1)}&deg; &minus; 23.44&deg;
            &times; sin[(360&deg;/365)(d &minus; 81)]
          </p>
        </motion.div>

        {/* ── 3. Chart card ──────────────────────────── */}
        <motion.div
          variants={fadeUp}
          style={cardStyle("chart")}
          onMouseEnter={() => setHoveredCard("chart")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <p style={{ ...overline, marginBottom: 16 }}>
            Curva anual &mdash; Angulo optimo
          </p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={curve}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E1E1E"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#666", fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "#1E1E1E" }}
                  ticks={[
                    1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335,
                  ]}
                  tickFormatter={(d: number) => {
                    const labels = [
                      "E",
                      "F",
                      "M",
                      "A",
                      "M",
                      "J",
                      "J",
                      "A",
                      "S",
                      "O",
                      "N",
                      "D",
                    ];
                    const idx = [
                      1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305,
                      335,
                    ].indexOf(d);
                    return idx >= 0 ? labels[idx]! : "";
                  }}
                />
                <YAxis
                  tick={{ fill: "#666", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}\u00B0`}
                />
                <RTooltip
                  contentStyle={{
                    background: "#161616",
                    border: "1px solid #1E1E1E",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#fff",
                  }}
                  formatter={(value: number) => [
                    `${value.toFixed(1)}\u00B0`,
                    "Angulo",
                  ]}
                  labelFormatter={(label: number) => `Dia ${label}`}
                />
                <ReferenceLine
                  y={0}
                  stroke="#333"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="angle"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  dot={false}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <ReferenceDot
                  x={today}
                  y={todayAngle}
                  r={5}
                  fill="#FFB800"
                  stroke="#000"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── 4. Monthly table card ──────────────────── */}
        <motion.div
          variants={fadeUp}
          style={{
            ...cardStyle("table"),
            padding: 0,
            overflow: "hidden",
          }}
          onMouseEnter={() => setHoveredCard("table")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          {/* Table title bar */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #1E1E1E",
            }}
          >
            <p style={overline}>
              Angulos mensuales &mdash; {latitude.toFixed(1)}&deg;N
            </p>
          </div>

          {/* Scrollable table wrapper */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #1E1E1E",
                  }}
                >
                  {["Mes", "Dia", "Declinacion", "Angulo", "Direccion"].map(
                    (label, i) => (
                      <th
                        key={label}
                        style={{
                          ...overline,
                          padding: "10px 16px",
                          textAlign: i === 0 ? "left" : "right",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {months.map((m, i) => {
                  const isCurrentMonth = new Date().getMonth() === i;
                  return (
                    <motion.tr
                      key={m.month}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: i * 0.03,
                        duration: 0.3,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      style={{
                        borderBottom: "1px solid #1E1E1E",
                        background: isCurrentMonth
                          ? "rgba(255,184,0,0.06)"
                          : "transparent",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentMonth) {
                          (
                            e.currentTarget as HTMLElement
                          ).style.background = "rgba(255,255,255,0.02)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentMonth) {
                          (
                            e.currentTarget as HTMLElement
                          ).style.background = "transparent";
                        }
                      }}
                    >
                      {/* Mes */}
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#ddd",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isCurrentMonth && (
                          <span
                            style={{
                              display: "inline-block",
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "#FFB800",
                              marginRight: 8,
                              verticalAlign: "middle",
                            }}
                            aria-label="Mes actual"
                          />
                        )}
                        {m.month}
                      </td>
                      {/* Dia */}
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#999",
                          textAlign: "right",
                          ...mono,
                        }}
                      >
                        {m.day}
                      </td>
                      {/* Declinacion */}
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#999",
                          textAlign: "right",
                          ...mono,
                        }}
                      >
                        {m.declination.toFixed(1)}&deg;
                      </td>
                      {/* Angulo */}
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#ddd",
                          fontWeight: 500,
                          textAlign: "right",
                          ...mono,
                        }}
                      >
                        {m.angle.toFixed(1)}&deg;
                      </td>
                      {/* Direccion */}
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#777",
                          textAlign: "right",
                        }}
                      >
                        {m.direction}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
