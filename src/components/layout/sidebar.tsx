import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Calculator,
  CloudSun,
  Zap,
  Settings2,
  Sun,
  Gauge,
  BarChart3,
  Bot,
} from "lucide-react";
import { transitions } from "@/lib/motion";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/calculator", icon: Calculator, label: "Calculadora" },
  { to: "/weather", icon: CloudSun, label: "Clima" },
  { to: "/sensors", icon: Zap, label: "Energía" },
  { to: "/control", icon: Gauge, label: "Servo" },
  { to: "/stats", icon: BarChart3, label: "Stats" },
] as const;

export function Sidebar() {
  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        width: 56,
        height: "100vh",
        background: "#000",
        borderRight: "1px solid #1E1E1E",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 48,
          borderBottom: "1px solid #1E1E1E",
        }}
      >
        <Sun size={18} color="#FFB800" />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, paddingTop: 8 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            style={{ textDecoration: "none" }}
          >
            {({ isActive }) => (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  color: isActive ? "#fff" : "#555",
                  transition: "all 0.15s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.querySelector("[data-active]")) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "#888";
                  }
                }}
                onMouseLeave={(e) => {
                  const isAct = e.currentTarget.getAttribute("data-active");
                  if (!isAct) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#555";
                  }
                }}
                {...(isActive ? { "data-active": "true" } : {})}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    transition={transitions.spring}
                    style={{
                      position: "absolute",
                      left: -10,
                      top: 6,
                      bottom: 6,
                      width: 3,
                      borderRadius: 2,
                      background: "#fff",
                    }}
                  />
                )}
                <Icon size={17} strokeWidth={isActive ? 2 : 1.5} />
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 12, gap: 2 }}>
        <NavLink to="/settings" title="Configuración" style={{ textDecoration: "none" }}>
          {({ isActive }) => (
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 8,
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                color: isActive ? "#fff" : "#555",
                transition: "all 0.15s ease",
                cursor: "pointer",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  transition={transitions.spring}
                  style={{
                    position: "absolute",
                    left: -10,
                    top: 6,
                    bottom: 6,
                    width: 3,
                    borderRadius: 2,
                    background: "#fff",
                  }}
                />
              )}
              <Settings2 size={17} strokeWidth={isActive ? 2 : 1.5} />
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
