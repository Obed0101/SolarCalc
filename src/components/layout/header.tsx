import { MapPin, ChevronDown } from "lucide-react";

interface HeaderProps {
  locationName?: string;
  connectionStatus?: "connected" | "warning" | "error" | "inactive";
  isDemo?: boolean;
}

export function Header({
  locationName = "Panamá",
  connectionStatus = "inactive",
  isDemo = true,
}: HeaderProps) {
  const statusColor =
    connectionStatus === "connected" ? "#00D26A" :
    connectionStatus === "warning" ? "#FFB800" :
    connectionStatus === "error" ? "#FF3B30" : "#333";

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 44,
        padding: "0 24px",
        borderBottom: "1px solid #1a1a1a",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        flexShrink: 0,
        zIndex: 30,
      }}
    >
      {/* Location */}
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: "#A0A0A0",
          cursor: "pointer",
          padding: 0,
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#A0A0A0")}
      >
        <MapPin size={13} style={{ color: "#555" }} />
        <span style={{ fontWeight: 500 }}>{locationName}</span>
        <ChevronDown size={11} style={{ color: "#444" }} />
      </button>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isDemo && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(255,184,0,0.08)",
              color: "rgba(255,184,0,0.7)",
              border: "1px solid rgba(255,184,0,0.12)",
            }}
          >
            Demo
          </span>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: statusColor,
            }}
          />
          <span style={{ fontSize: 11, color: "#444" }}>
            {connectionStatus === "connected" ? "Online" : "Offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
