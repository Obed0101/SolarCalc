import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Calculator,
  CloudSun,
  Zap,
  Gauge,
} from "lucide-react";
import { transitions } from "@/lib/motion";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/calculator", icon: Calculator, label: "Calc" },
  { to: "/weather", icon: CloudSun, label: "Clima" },
  { to: "/sensors", icon: Zap, label: "Watts" },
  { to: "/control", icon: Gauge, label: "Servo" },
] as const;

export function MobileNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid #1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 8px",
        zIndex: 50,
      }}
      className="md:hidden"
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          style={{ textDecoration: "none" }}
        >
          {({ isActive }) => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                width: 56,
                height: 48,
                borderRadius: 10,
                color: isActive ? "#fff" : "#555",
                transition: "color 0.15s",
                position: "relative",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-indicator"
                  transition={transitions.spring}
                  style={{
                    position: "absolute",
                    top: -1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 16,
                    height: 2,
                    borderRadius: 1,
                    background: "#fff",
                  }}
                />
              )}
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.02em",
                }}
              >
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
