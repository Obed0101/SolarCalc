import { useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { PageTransition } from "@/components/layout/page-transition";
import {
  optimalAngle, angleDirection, dayOfYear,
  estimatedProduction, energyLossPercent, sunHoursEstimate, dailySavings,
} from "@/lib/solar";
import { TrendingDown, TrendingUp, Sun, Thermometer } from "lucide-react";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { useSettingsStore } from "@/stores/settings-store";

export function DashboardPage() {
  const { latitude, fixedAngle, nominalPower, tariffPerKwh } = useSettingsStore();

  const data = useMemo(() => {
    const today = dayOfYear();
    const optimal = optimalAngle(latitude, today);
    const direction = angleDirection(optimal);
    const sunH = sunHoursEstimate(latitude, today);
    const optimalProd = estimatedProduction(nominalPower, optimal, optimal);
    const actualProd = estimatedProduction(nominalPower, fixedAngle, optimal);
    const loss = energyLossPercent(fixedAngle, optimal);
    const savings = dailySavings(nominalPower, fixedAngle, optimal, tariffPerKwh, sunH);
    return { today, optimal, direction, sunH, optimalProd, actualProd, loss, savings };
  }, [latitude, fixedAngle, nominalPower, tariffPerKwh]);

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
        {/* ── Hero ── */}
        <motion.div variants={fadeUp}>
          <div style={labelStyle}>
            Angulo optimo — Dia {data.today}
          </div>
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginTop: 6,
          }}>
            <span style={{
              fontSize: 64,
              fontWeight: 200,
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: "tabular-nums",
              color: "#fff",
              lineHeight: 1,
            }}>
              <AnimatedNumber value={Math.abs(data.optimal)} decimals={1} />&deg;
            </span>
            <span style={{
              fontSize: 20,
              fontWeight: 300,
              color: "#555",
            }}>
              {data.direction}
            </span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#FFB800",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: "#555" }}>
              Panel fijo a {fixedAngle}&deg; — ajustar{" "}
              {data.optimal > fixedAngle ? "+" : ""}
              {(data.optimal - fixedAngle).toFixed(1)}&deg;
            </span>
          </div>
        </motion.div>

        {/* ── Stats Grid — 4 columns ── */}
        <motion.div
          variants={fadeUp}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          <StatCard
            icon={<TrendingUp size={14} />}
            label="Produce"
            value={data.actualProd}
            unit="W"
          />
          <StatCard
            icon={<Sun size={14} />}
            label="Optimo"
            value={data.optimalProd}
            unit="W"
            color="#00D26A"
          />
          <StatCard
            icon={<TrendingDown size={14} />}
            label="Pierdes"
            value={data.loss}
            unit="%"
            color="#FF3B30"
            prefix="-"
          />
          <StatCard
            icon={<Thermometer size={14} />}
            label="Horas Sol"
            value={data.sunH}
            unit="h"
            decimals={1}
          />
        </motion.div>

        {/* ── Savings ── */}
        <motion.div variants={fadeUp} style={cardStyle}>
          <div style={labelStyle}>Ahorro estimado hoy</div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginTop: 16,
          }}>
            <SavingsCol
              label="Con angulo optimo"
              value={data.savings.optimal}
              color="#00D26A"
            />
            <div style={dividerStyle} />
            <SavingsCol
              label={`Con angulo fijo (${fixedAngle}\u00B0)`}
              value={data.savings.actual}
              color="#A0A0A0"
            />
            <div style={dividerStyle} />
            <SavingsCol
              label="Pierdes por dia"
              value={data.savings.savings}
              color="#FF3B30"
              prefix="-"
            />
          </div>
        </motion.div>

        {/* ── Efficiency Bar ── */}
        <motion.div variants={fadeUp} style={cardStyle}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}>
            <span style={labelStyle}>Eficiencia actual</span>
            <span style={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: "tabular-nums",
              color: "#A0A0A0",
            }}>
              {(100 - data.loss).toFixed(1)}%
            </span>
          </div>
          <div style={{
            position: "relative",
            height: 4,
            background: "rgba(255,255,255,0.04)",
            borderRadius: 4,
            overflow: "hidden",
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - data.loss}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              style={{
                position: "absolute",
                inset: "0 auto 0 0",
                borderRadius: 4,
                background: data.loss < 5
                  ? "#00D26A"
                  : data.loss < 15
                    ? "#FFB800"
                    : "#FF3B30",
              }}
            />
          </div>
          <p style={{
            fontSize: 11,
            color: "#555",
            marginTop: 10,
            lineHeight: 1.5,
          }}>
            {data.loss < 5
              ? "Excelente — tu panel esta cerca del angulo optimo."
              : `Ajusta de ${fixedAngle}\u00B0 a ${data.optimal.toFixed(1)}\u00B0 para ganar ${data.loss.toFixed(1)}% mas energia.`}
          </p>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}

/* ── Subcomponents ── */

function StatCard({ icon, label, value, unit, color, prefix, decimals }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color?: string;
  prefix?: string;
  decimals?: number;
}) {
  return (
    <div
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
        <span style={{ color: "#555" }}>{icon}</span>
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
          color: color ?? "#fff",
          lineHeight: 1,
        }}>
          {prefix}
          <AnimatedNumber value={value} decimals={decimals ?? 0} />
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
  );
}

function SavingsCol({ label, value, color, prefix }: {
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
        fontSize: 24,
        fontWeight: 200,
        fontFamily: "'JetBrains Mono', monospace",
        fontVariantNumeric: "tabular-nums",
        color,
      }}>
        {prefix}${value.toFixed(2)}
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
