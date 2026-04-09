import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { PageTransition } from "@/components/layout/page-transition";
import { AnimatedNumber } from "@/components/shared/animated-number";
import {
  dayOfYear, optimalAngle, estimatedProduction, sunHoursEstimate, dailySavings,
} from "@/lib/solar";
import { useSettingsStore } from "@/stores/settings-store";
import { useWeather } from "@/hooks/use-weather";
import { weatherDescription, cloudEfficiencyFactor } from "@/lib/weather";
import {
  TrendingUp, DollarSign, Calendar, Sun, Cloud, Thermometer, Loader2, AlertTriangle,
} from "lucide-react";

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

const monoNumber: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontVariantNumeric: "tabular-nums",
};

function hoverIn(e: React.MouseEvent<HTMLDivElement>) { e.currentTarget.style.borderColor = "#333"; }
function hoverOut(e: React.MouseEvent<HTMLDivElement>) { e.currentTarget.style.borderColor = "#1E1E1E"; }

/* ── Mock Data Generators ── */

function generateContributionGrid(latitude: number, nominalPower: number): {
  cells: Array<{ date: string; kWh: number }>;
  maxKwh: number;
} {
  const cells: Array<{ date: string; kWh: number }> = [];
  const today = new Date();
  let maxKwh = 0;

  // 364 days back (52 weeks)
  for (let i = 363; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const day = dayOfYear(date);
    const sunH = sunHoursEstimate(latitude, day);
    const angle = optimalAngle(latitude, day);
    const prod = estimatedProduction(nominalPower, angle, angle, 20, sunH);

    // Only populate last 90 days with data, rest is "no data"
    let kWh = 0;
    if (i < 90) {
      const variation = 0.6 + Math.random() * 0.8;
      kWh = (prod * sunH / 1000) * variation;
    }
    if (kWh > maxKwh) maxKwh = kWh;

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    cells.push({ date: dateStr, kWh });
  }

  return { cells, maxKwh };
}

function generateProductionData(latitude: number, nominalPower: number): Array<{
  day: string; kWh: number;
}> {
  const data: Array<{ day: string; kWh: number }> = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const d = dayOfYear(date);
    const sunH = sunHoursEstimate(latitude, d);
    const angle = optimalAngle(latitude, d);
    const prod = estimatedProduction(nominalPower, angle, angle, 20, sunH);
    const variation = 0.65 + Math.random() * 0.7;
    const kWh = (prod * sunH / 1000) * variation;
    data.push({
      day: `${date.getDate()}/${date.getMonth() + 1}`,
      kWh: Math.round(kWh * 100) / 100,
    });
  }
  return data;
}

function generateSavingsData(
  nominalPower: number, latitude: number, fixedAngle: number, tariffPerKwh: number,
): {
  daily: Array<{ day: string; savings: number }>;
  totalMonth: number;
  bestDay: number;
  dailyAvg: number;
} {
  const daily: Array<{ day: string; savings: number }> = [];
  const today = new Date();
  let totalMonth = 0;
  let bestDay = 0;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const d = dayOfYear(date);
    const sunH = sunHoursEstimate(latitude, d);
    const angle = optimalAngle(latitude, d);
    const { optimal } = dailySavings(nominalPower, fixedAngle, angle, tariffPerKwh, sunH);
    const variation = 0.7 + Math.random() * 0.6;
    const saving = optimal * variation;
    daily.push({
      day: `${date.getDate()}`,
      savings: Math.round(saving * 100) / 100,
    });
    totalMonth += saving;
    if (saving > bestDay) bestDay = saving;
  }

  return {
    daily,
    totalMonth: Math.round(totalMonth * 100) / 100,
    bestDay: Math.round(bestDay * 100) / 100,
    dailyAvg: Math.round((totalMonth / 30) * 100) / 100,
  };
}

/* ── Month Labels for Contribution Grid ── */

const MONTH_LABELS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

/* ── Custom Chart Tooltip ── */

function ChartTooltip(props: any) {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,10,10,0.95)",
      border: "1px solid #333",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 11,
      ...monoNumber,
    }}>
      <div style={{ color: "#888", marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {typeof p.value === "number" ? p.value.toFixed(2) : p.value} {p.dataKey === "savings" ? "$" : "kWh"}
        </div>
      ))}
    </div>
  );
}

/* ── Contribution Grid Cell Color ── */

function cellColor(kWh: number, maxKwh: number): string {
  if (kWh <= 0) return "#1A1A1A";
  const ratio = kWh / maxKwh;
  if (ratio < 0.25) return "rgba(0,210,106,0.2)";
  if (ratio < 0.5) return "rgba(0,210,106,0.4)";
  if (ratio < 0.75) return "rgba(0,210,106,0.65)";
  return "#00D26A";
}

/* ── Main Page ── */

export function StatsPage() {
  const { latitude, longitude, nominalPower, fixedAngle, tariffPerKwh, currency } = useSettingsStore();
  const { weather, loading, error } = useWeather();

  const daily = weather?.daily ?? [];

  const contribution = useMemo(
    () => generateContributionGrid(latitude, nominalPower),
    [latitude, nominalPower],
  );

  const production = useMemo(
    () => generateProductionData(latitude, nominalPower),
    [latitude, nominalPower],
  );

  const savings = useMemo(
    () => generateSavingsData(nominalPower, latitude, fixedAngle, tariffPerKwh),
    [nominalPower, latitude, fixedAngle, tariffPerKwh],
  );

  // Build contribution grid: 52 cols (weeks) x 7 rows (days)
  // Each column is a week, rows are Mon-Sun
  const gridWeeks = useMemo(() => {
    const weeks: Array<Array<{ date: string; kWh: number } | null>> = [];
    const cells = contribution.cells;

    // Find the starting day of week for the first cell
    const firstDate = new Date(cells[0]!.date + "T12:00:00");
    const startDow = firstDate.getDay(); // 0=Sun, 1=Mon, ...

    // Pad start with nulls so first column starts on correct day
    let idx = 0;
    let currentWeek: Array<{ date: string; kWh: number } | null> = [];
    for (let d = 0; d < startDow; d++) {
      currentWeek.push(null);
    }

    while (idx < cells.length) {
      currentWeek.push(cells[idx]!);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      idx++;
    }
    // Pad end
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length === 7) weeks.push(currentWeek);

    return weeks;
  }, [contribution]);

  // Month labels positioned at the correct week column
  const monthMarkers = useMemo(() => {
    const markers: Array<{ label: string; col: number }> = [];
    let lastMonth = -1;
    gridWeeks.forEach((week, colIdx) => {
      const firstCell = week.find((c) => c !== null);
      if (!firstCell) return;
      const month = new Date(firstCell.date + "T12:00:00").getMonth();
      if (month !== lastMonth) {
        markers.push({ label: MONTH_LABELS_SHORT[month]!, col: colIdx });
        lastMonth = month;
      }
    });
    return markers;
  }, [gridWeeks]);

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
          <span style={labelStyle}>Estadisticas</span>
          {loading && <Loader2 size={14} style={{ color: "#555", animation: "spin 1s linear infinite" }} />}
          {error && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#FF3B30" }}>
              <AlertTriangle size={12} /> Sin conexion
            </span>
          )}
        </motion.div>

        {/* ── Section 1: Energy Contribution Grid ── */}
        <motion.div variants={fadeUp} style={cardStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={labelStyle}>Contribucion de Energia</span>
            <span style={{ fontSize: 10, color: "#555", ...monoNumber }}>
              Ultimos 90 dias con datos
            </span>
          </div>

          {/* Month labels */}
          <div style={{ position: "relative", height: 16, marginBottom: 4, marginLeft: 28 }}>
            {monthMarkers.map(({ label, col }) => (
              <span
                key={`${label}-${col}`}
                style={{
                  position: "absolute",
                  left: col * (10 + 2),
                  fontSize: 9,
                  color: "#555",
                  ...monoNumber,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid: day labels + cells */}
          <div style={{ display: "flex", gap: 4 }}>
            {/* Day of week labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 0 }}>
              {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                <div
                  key={i}
                  style={{
                    width: 20,
                    height: 10,
                    fontSize: 8,
                    color: "#444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 4,
                  }}
                >
                  {i % 2 === 1 ? d : ""}
                </div>
              ))}
            </div>

            {/* Cell grid */}
            <div style={{ display: "flex", gap: 2, overflow: "hidden", flex: 1 }}>
              {gridWeeks.map((week, colIdx) => (
                <div key={colIdx} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {week.map((cell, rowIdx) => (
                    <div
                      key={rowIdx}
                      title={cell ? `${cell.date}: ${cell.kWh.toFixed(2)} kWh` : ""}
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: cell ? cellColor(cell.kWh, contribution.maxKwh) : "transparent",
                        transition: "background 0.2s",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 9, color: "#555" }}>Menos</span>
            {["#1A1A1A", "rgba(0,210,106,0.2)", "rgba(0,210,106,0.4)", "rgba(0,210,106,0.65)", "#00D26A"].map((bg) => (
              <div key={bg} style={{ width: 10, height: 10, borderRadius: 2, background: bg }} />
            ))}
            <span style={{ fontSize: 9, color: "#555" }}>Mas</span>
          </div>
        </motion.div>

        {/* ── Section 2: Production Chart (30 days) ── */}
        <motion.div variants={fadeUp} style={cardStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={14} style={{ color: "#555" }} />
              <span style={labelStyle}>Produccion 30 dias</span>
            </div>
            <span style={{ fontSize: 12, color: "#00D26A", ...monoNumber }}>
              {production.reduce((s, p) => s + p.kWh, 0).toFixed(1)} kWh total
            </span>
          </div>
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={production} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D26A" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00D26A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 9, fill: "#555", fontFamily: "'JetBrains Mono', monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "#1E1E1E" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#555", fontFamily: "'JetBrains Mono', monospace" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="kWh"
                  stroke="#00D26A"
                  strokeWidth={1.5}
                  fill="url(#prodGrad)"
                  dot={false}
                  activeDot={{ r: 3, fill: "#00D26A", stroke: "#000", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Section 3: Weather Forecast (7 days) ── */}
        <motion.div variants={fadeUp} style={cardStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Cloud size={14} style={{ color: "#555" }} />
            <span style={labelStyle}>Pronostico 7 dias</span>
          </div>
          {daily.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {daily.map((d, i) => {
                const date = new Date(d.date + "T12:00:00");
                const efficiency = cloudEfficiencyFactor(d.cloudCoverMean);
                return (
                  <motion.div
                    key={d.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "12px 4px",
                      background: i === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                      borderRadius: 10,
                      border: i === 0 ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "#fff" : "#555" }}>
                      {i === 0 ? "Hoy" : DAY_NAMES[date.getDay()]}
                    </span>
                    <span style={{ fontSize: 9, color: "#444" }}>
                      {weatherDescription(d.weatherCode)}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Thermometer size={10} style={{ color: "#555" }} />
                      <span style={{ fontSize: 10, color: "#888", ...monoNumber }}>
                        {d.tempMin.toFixed(0)}°/{d.tempMax.toFixed(0)}°
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Cloud size={10} style={{ color: "#555" }} />
                      <span style={{ fontSize: 10, color: "#888", ...monoNumber }}>{d.cloudCoverMean}%</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Sun size={10} style={{ color: "#FFB800" }} />
                      <span style={{ fontSize: 10, color: "#FFB800", ...monoNumber }}>
                        {d.sunshineHours.toFixed(1)}h
                      </span>
                    </div>
                    {/* Efficiency bar */}
                    <div style={{ width: "100%", height: 3, background: "#1A1A1A", borderRadius: 2, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${efficiency * 100}%` }}
                        transition={{ delay: 0.4 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          height: "100%",
                          borderRadius: 2,
                          background: efficiency > 0.7 ? "#00D26A" : efficiency > 0.4 ? "#FFB800" : "#FF3B30",
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 24, color: "#555", fontSize: 12 }}>
              {loading ? "Cargando pronostico..." : "Sin datos de pronostico"}
            </div>
          )}
        </motion.div>

        {/* ── Section 4: Savings Summary ── */}
        <motion.div variants={fadeUp} style={cardStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <DollarSign size={14} style={{ color: "#555" }} />
            <span style={labelStyle}>Resumen de ahorro (30 dias)</span>
          </div>

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            <div style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: 12,
              padding: "16px 12px",
              textAlign: "center",
            }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Total mes</div>
              <span style={{ fontSize: 28, fontWeight: 200, color: "#00D26A", ...monoNumber }}>
                $<AnimatedNumber value={savings.totalMonth} decimals={2} />
              </span>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: 12,
              padding: "16px 12px",
              textAlign: "center",
            }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Promedio diario</div>
              <span style={{ fontSize: 28, fontWeight: 200, color: "#fff", ...monoNumber }}>
                $<AnimatedNumber value={savings.dailyAvg} decimals={2} />
              </span>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: 12,
              padding: "16px 12px",
              textAlign: "center",
            }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Mejor dia</div>
              <span style={{ fontSize: 28, fontWeight: 200, color: "#FFB800", ...monoNumber }}>
                $<AnimatedNumber value={savings.bestDay} decimals={2} />
              </span>
            </div>
          </div>

          {/* Daily savings bar chart */}
          <div style={{ width: "100%", height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={savings.daily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 8, fill: "#555", fontFamily: "'JetBrains Mono', monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "#1E1E1E" }}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#555", fontFamily: "'JetBrains Mono', monospace" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="savings"
                  fill="#00D26A"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Section 5: Radiation History (7 days) ── */}
        <motion.div variants={fadeUp} style={cardStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Calendar size={14} style={{ color: "#555" }} />
            <span style={labelStyle}>Horas de radiacion (7 dias)</span>
          </div>
          {daily.length > 0 ? (
            <div style={{ width: "100%", height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={daily.map((d) => {
                    const date = new Date(d.date + "T12:00:00");
                    return {
                      day: DAY_NAMES[date.getDay()],
                      hours: d.sunshineHours,
                      clouds: d.cloudCoverMean,
                    };
                  })}
                  margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E1E1E" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#555", fontFamily: "'JetBrains Mono', monospace" }}
                    tickLine={false}
                    axisLine={{ stroke: "#1E1E1E" }}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#555", fontFamily: "'JetBrains Mono', monospace" }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="hours"
                    fill="#FFB800"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                    name="Horas sol"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 24, color: "#555", fontSize: 12 }}>
              {loading ? "Cargando datos..." : "Sin datos de radiacion"}
            </div>
          )}
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
