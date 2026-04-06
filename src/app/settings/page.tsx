import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { PageTransition } from "@/components/layout/page-transition";
import { useSettingsStore, type PanelType } from "@/stores/settings-store";
import { LocationMap } from "@/components/shared/location-map";
import {
  MapPin, Zap, DollarSign, Bluetooth, Trash2, Download,
  RotateCcw, Plus, ChevronRight, Minus, Check,
} from "lucide-react";

/* ── Panel Type Data ── */
const PANEL_TYPES: Array<{
  id: PanelType;
  name: string;
  efficiency: string;
  desc: string;
  color: string;
}> = [
  { id: "monocrystalline", name: "Monocristalino", efficiency: "20-22%", desc: "Alta eficiencia, negro uniforme", color: "#1a1a2e" },
  { id: "polycrystalline", name: "Policristalino", efficiency: "15-17%", desc: "Costo medio, azul moteado", color: "#1a2a4a" },
  { id: "thin-film", name: "Pelicula delgada", efficiency: "10-13%", desc: "Flexible, bajo costo", color: "#2a2a2a" },
  { id: "bifacial", name: "Bifacial", efficiency: "22-25%", desc: "Capta luz por ambos lados", color: "#1e2e3e" },
];

export function SettingsPage() {
  const store = useSettingsStore();
  const activeZone = store.zones.find((z) => z.id === store.activeZoneId) ?? store.zones[0]!;
  const [showNewZone, setShowNewZone] = useState(false);

  return (
    <PageTransition>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{ display: "flex", flexDirection: "column", padding: "24px 0", gap: 16, maxWidth: 720, margin: "0 auto" }}
      >
        <motion.div variants={fadeUp}>
          <span style={headerLabel}>Configuracion</span>
        </motion.div>

        {/* ── Zones Selector ── */}
        <motion.div variants={fadeUp} style={card}>
          <div style={sectionHead}>
            <MapPin size={16} style={{ color: "#555" }} />
            <span style={sectionTitle}>Zonas Solares</span>
            <button onClick={() => setShowNewZone(true)} style={addBtn} onMouseEnter={btnHoverIn} onMouseLeave={btnHoverOut}>
              <Plus size={13} /> Nueva zona
            </button>
          </div>

          {/* Zone list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {store.zones.map((zone) => {
              const isActive = zone.id === store.activeZoneId;
              return (
                <div
                  key={zone.id}
                  onClick={() => store.setActiveZone(zone.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                    border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {isActive && <Check size={14} color="#00D26A" />}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{zone.name}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>
                        {zone.latitude.toFixed(2)}°, {zone.longitude.toFixed(2)}° · {zone.panelCount} panel{zone.panelCount > 1 ? "es" : ""} · {zone.nominalPower}W
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {store.zones.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); store.removeZone(zone.id); }}
                        style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: 4 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#FF3B30")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <ChevronRight size={14} color="#333" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* New zone form */}
          {showNewZone && (
            <NewZoneForm
              onSave={(zone) => { store.addZone(zone); setShowNewZone(false); }}
              onCancel={() => setShowNewZone(false)}
            />
          )}
        </motion.div>

        {/* ── Location Map ── */}
        <motion.div variants={fadeUp} style={card}>
          <div style={sectionHead}>
            <MapPin size={16} style={{ color: "#555" }} />
            <span style={sectionTitle}>Ubicacion — {activeZone.name}</span>
          </div>
          <div style={{ width: "100%", height: 180, borderRadius: 12, overflow: "hidden", marginTop: 12, border: "1px solid #1E1E1E" }}>
            <LocationMap
              lat={activeZone.latitude}
              lng={activeZone.longitude}
              onMapClick={(lat, lng) => store.updateSettings({ latitude: lat, longitude: lng })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", gap: 10, marginTop: 12 }}>
            <Field label="Nombre" value={activeZone.name} onChange={(v) => store.updateSettings({ name: v })} />
            <Field label="Latitud" value={activeZone.latitude} type="number" step={0.01} mono onChange={(v) => store.updateSettings({ latitude: Number(v) })} />
            <Field label="Longitud" value={activeZone.longitude} type="number" step={0.01} mono onChange={(v) => store.updateSettings({ longitude: Number(v) })} />
          </div>
        </motion.div>

        {/* ── Panel Type ── */}
        <motion.div variants={fadeUp} style={card}>
          <div style={sectionHead}>
            <Zap size={16} style={{ color: "#555" }} />
            <span style={sectionTitle}>Tipo de Panel</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
            {PANEL_TYPES.map((pt) => {
              const isSelected = activeZone.panelType === pt.id;
              return (
                <div
                  key={pt.id}
                  onClick={() => store.updateSettings({ panelType: pt.id })}
                  style={{
                    padding: 12, borderRadius: 12, cursor: "pointer",
                    border: isSelected ? "1px solid rgba(255,255,255,0.2)" : "1px solid #1E1E1E",
                    background: isSelected ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.3)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#333"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = isSelected ? "rgba(255,255,255,0.2)" : "#1E1E1E"; }}
                >
                  {/* Panel preview SVG */}
                  <div style={{
                    width: "100%", height: 56, borderRadius: 8, marginBottom: 8,
                    background: `linear-gradient(135deg, ${pt.color}, ${pt.color}dd)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                      <rect x="1" y="1" width="30" height="22" rx="2" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <line x1="11" y1="1" x2="11" y2="23" stroke="rgba(255,255,255,0.08)" />
                      <line x1="21" y1="1" x2="21" y2="23" stroke="rgba(255,255,255,0.08)" />
                      <line x1="1" y1="8" x2="31" y2="8" stroke="rgba(255,255,255,0.08)" />
                      <line x1="1" y1="16" x2="31" y2="16" stroke="rgba(255,255,255,0.08)" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: isSelected ? "#fff" : "#A0A0A0" }}>{pt.name}</div>
                  <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{pt.efficiency}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Panel Config ── */}
        <motion.div variants={fadeUp} style={card}>
          <div style={sectionHead}>
            <Zap size={16} style={{ color: "#555" }} />
            <span style={sectionTitle}>Configuracion del Panel</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
            {/* Panel count stepper */}
            <div>
              <span style={fieldLabel}>Cantidad</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => store.updateSettings({ panelCount: Math.max(1, activeZone.panelCount - 1) })}
                  style={stepperBtn}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#555")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E1E1E")}
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: 24, fontWeight: 200, fontFamily: "'JetBrains Mono', monospace", color: "#fff", minWidth: 40, textAlign: "center" }}>
                  {activeZone.panelCount}
                </span>
                <button
                  onClick={() => store.updateSettings({ panelCount: activeZone.panelCount + 1 })}
                  style={stepperBtn}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#555")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E1E1E")}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div style={{ width: 1, height: 48, background: "#1E1E1E" }} />
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Potencia (W)" value={activeZone.nominalPower} type="number" mono onChange={(v) => store.updateSettings({ nominalPower: Number(v) })} />
              <Field label="Angulo fijo (°)" value={activeZone.fixedAngle} type="number" mono onChange={(v) => store.updateSettings({ fixedAngle: Number(v) })} />
            </div>
          </div>
          {/* Total power summary */}
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#555" }}>Potencia total</span>
            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#00D26A" }}>
              {activeZone.panelCount * activeZone.nominalPower} W
            </span>
          </div>
        </motion.div>

        {/* ── Tariff ── */}
        <motion.div variants={fadeUp} style={card}>
          <div style={sectionHead}>
            <DollarSign size={16} style={{ color: "#555" }} />
            <span style={sectionTitle}>Tarifa Electrica</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10, marginTop: 12 }}>
            <Field label="Costo por kWh" value={activeZone.tariffPerKwh} type="number" step={0.01} mono onChange={(v) => store.updateSettings({ tariffPerKwh: Number(v) })} />
            <Field label="Moneda" value={activeZone.currency} onChange={(v) => store.updateSettings({ currency: v })} />
          </div>
        </motion.div>

        {/* ── Hardware ── */}
        <motion.div variants={fadeUp} style={card}>
          <div style={sectionHead}>
            <Bluetooth size={16} style={{ color: "#555" }} />
            <span style={sectionTitle}>Hardware</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 13, color: "#A0A0A0" }}>Conexion Bluetooth</span>
            <span style={demoBadge}>Demo Mode</span>
          </div>
        </motion.div>

        {/* ── Actions ── */}
        <motion.div variants={fadeUp} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ActionBtn icon={<Download size={13} />} label="Exportar CSV" />
          <ActionBtn icon={<Trash2 size={13} />} label="Limpiar datos" danger />
        </motion.div>

        <motion.div variants={fadeUp} style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
          <button
            onClick={() => store.updateSettings({ setupComplete: false } as any)}
            style={{ ...resetBtn }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#888")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
          >
            <RotateCcw size={12} /> Repetir configuracion inicial
          </button>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}

/* ── New Zone Form ── */
function NewZoneForm({ onSave, onCancel }: { onSave: (z: any) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [lat, setLat] = useState(9.0);
  const [lng, setLng] = useState(-79.5);

  return (
    <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid #1E1E1E" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "#fff", marginBottom: 12 }}>Nueva Zona Solar</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: 8 }}>
        <Field label="Nombre" value={name} onChange={setName} placeholder="Mi casa" />
        <Field label="Lat" value={lat} type="number" step={0.1} mono onChange={(v) => setLat(Number(v))} />
        <Field label="Lng" value={lng} type="number" step={0.1} mono onChange={(v) => setLng(Number(v))} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={() => onSave({ name: name || "Nueva zona", latitude: lat, longitude: lng, panelType: "monocrystalline", panelCount: 1, nominalPower: 400, fixedAngle: 10, tariffPerKwh: 0.35, currency: "USD" })}
          style={{ ...primaryBtn }}
        >
          Crear zona
        </button>
        <button onClick={onCancel} style={{ ...ghostBtn }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ── Reusable Field ── */
function Field({ label, value, onChange, type, step, mono, placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; step?: number; mono?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <span style={fieldLabel}>{label}</span>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          ...(mono ? { fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums" } : {}),
        }}
        onFocus={(e) => (e.target.style.borderColor = "#555")}
        onBlur={(e) => (e.target.style.borderColor = "#1E1E1E")}
      />
    </div>
  );
}

function ActionBtn({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  const color = danger ? "#FF3B30" : "#A0A0A0";
  const borderColor = danger ? "rgba(255,59,48,0.25)" : "#1E1E1E";
  return (
    <button
      style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", background: "transparent", border: `1px solid ${borderColor}`, borderRadius: 8, fontSize: 12, color, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = danger ? "rgba(255,59,48,0.5)" : "#333")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = borderColor)}
    >
      {icon} {label}
    </button>
  );
}

/* ── Styles ── */
const card: React.CSSProperties = { background: "rgba(10,10,10,0.8)", border: "1px solid #1E1E1E", borderRadius: 16, padding: "20px 24px", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" };
const headerLabel: React.CSSProperties = { fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555" };
const sectionHead: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: "#fff", flex: 1 };
const fieldLabel: React.CSSProperties = { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: 4, display: "block" };
const inputStyle: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", background: "rgba(255,255,255,0.03)", border: "1px solid #1E1E1E", borderRadius: 8, fontSize: 13, color: "#fff", outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box", transition: "border-color 0.15s" };
const stepperBtn: React.CSSProperties = { width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid #1E1E1E", borderRadius: 8, color: "#A0A0A0", cursor: "pointer", transition: "border-color 0.15s" };
const addBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, height: 28, padding: "0 10px", background: "transparent", border: "1px solid #1E1E1E", borderRadius: 6, fontSize: 11, color: "#A0A0A0", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "border-color 0.15s" };
const demoBadge: React.CSSProperties = { fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 8px", borderRadius: 6, background: "rgba(255,184,0,0.08)", color: "rgba(255,184,0,0.7)", border: "1px solid rgba(255,184,0,0.12)" };
const primaryBtn: React.CSSProperties = { height: 34, padding: "0 16px", background: "#fff", color: "#000", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" };
const ghostBtn: React.CSSProperties = { height: 34, padding: "0 16px", background: "transparent", color: "#666", border: "1px solid #1E1E1E", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif" };
const resetBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", fontSize: 11, color: "#444", cursor: "pointer", padding: 0, fontFamily: "Inter, sans-serif", transition: "color 0.15s" };
function btnHoverIn(e: React.MouseEvent<HTMLButtonElement>) { e.currentTarget.style.borderColor = "#333"; }
function btnHoverOut(e: React.MouseEvent<HTMLButtonElement>) { e.currentTarget.style.borderColor = "#1E1E1E"; }
