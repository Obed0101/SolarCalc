import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, MapPin, Zap, ArrowRight, Check, Crosshair, Loader2 } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { LocationMap } from "@/components/shared/location-map";

const slideVariants = {
  enter: { opacity: 0, y: 30 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const store = useSettingsStore();

  const next = () => {
    if (step < 3) setStep(step + 1);
    else store.completeSetup();
  };

  // Location step is wider
  const contentWidth = step === 1 ? 520 : 380;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        overflow: "auto",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(255,184,0,0.03)",
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

      {/* Progress dots */}
      <div style={{ position: "absolute", top: 24, display: "flex", gap: 8 }}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ width: i === step ? 24 : 6, backgroundColor: i <= step ? "#fff" : "#333" }}
            transition={{ duration: 0.3 }}
            style={{ height: 6, borderRadius: 3 }}
          />
        ))}
      </div>

      {/* Content area */}
      <motion.div
        animate={{ width: contentWidth }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: "100%", textAlign: "center" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
          >
            {step === 0 && <StepWelcome />}
            {step === 1 && <StepLocation store={store} />}
            {step === 2 && <StepPanel store={store} />}
            {step === 3 && <StepReady store={store} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Button */}
      <motion.button
        onClick={next}
        whileTap={{ scale: 0.97 }}
        style={{
          marginTop: 32,
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 48,
          padding: "0 32px",
          background: "#fff",
          color: "#000",
          borderRadius: 12,
          border: "none",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {step < 3 ? "Continuar" : "Comenzar"}
        <ArrowRight size={16} />
      </motion.button>
    </div>
  );
}

/* ── Step 0: Welcome ── */
function StepWelcome() {
  return (
    <>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(255,184,0,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 32,
        }}
      >
        <Sun size={36} color="#FFB800" />
      </motion.div>
      <h1 style={{ fontSize: 40, fontWeight: 200, letterSpacing: "-0.02em", color: "#fff" }}>
        SolarCalc Pro
      </h1>
      <p style={{ fontSize: 15, color: "#666", marginTop: 12, lineHeight: 1.6 }}>
        Calcula el ángulo óptimo de tus paneles solares y maximiza tu producción de energía.
      </p>
    </>
  );
}

/* ── Step 1: Location with GPS + Map ── */
function StepLocation({ store }: { store: ReturnType<typeof useSettingsStore> }) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS no disponible en este dispositivo");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        store.updateSettings({
          latitude: Math.round(pos.coords.latitude * 10000) / 10000,
          longitude: Math.round(pos.coords.longitude * 10000) / 10000,
        });
        setGpsLoading(false);
        // Try reverse geocode for name
        reverseGeocode(pos.coords.latitude, pos.coords.longitude).then((name) => {
          if (name) store.updateSettings({ locationName: name });
        });
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          err.code === 1 ? "Permiso denegado" :
          err.code === 2 ? "Ubicación no disponible" :
          "Timeout — intenta de nuevo"
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [store]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    store.updateSettings({
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lng * 10000) / 10000,
    });
    reverseGeocode(lat, lng).then((name) => {
      if (name) store.updateSettings({ locationName: name });
    });
  }, [store]);

  return (
    <>
      <h2 style={{ fontSize: 24, fontWeight: 300, color: "#fff", marginBottom: 4 }}>Tu ubicación</h2>
      <p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
        Usa GPS, haz clic en el mapa, o ingresa coordenadas manualmente.
      </p>

      {/* GPS Button */}
      <button
        onClick={requestGPS}
        disabled={gpsLoading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", height: 40,
          background: "transparent", border: "1px solid #333",
          borderRadius: 10, color: "#A0A0A0", fontSize: 13,
          cursor: gpsLoading ? "wait" : "pointer",
          fontFamily: "Inter, sans-serif",
          marginBottom: 12,
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#555")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333")}
      >
        {gpsLoading ? (
          <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Obteniendo ubicación...</>
        ) : (
          <><Crosshair size={14} /> Usar GPS del dispositivo</>
        )}
      </button>
      {gpsError && <p style={{ fontSize: 11, color: "#FF3B30", marginBottom: 8 }}>{gpsError}</p>}

      {/* Map */}
      <div style={{ width: "100%", height: 200, borderRadius: 12, overflow: "hidden", marginBottom: 16, border: "1px solid #1E1E1E" }}>
        <LocationMap
          lat={store.latitude}
          lng={store.longitude}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Manual inputs */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
        <FormField label="Nombre">
          <input
            type="text"
            value={store.locationName}
            onChange={(e) => store.updateSettings({ locationName: e.target.value })}
            style={inputStyle}
          />
        </FormField>
        <div style={{ display: "flex", gap: 10 }}>
          <FormField label="Latitud" style={{ flex: 1 }}>
            <input
              type="number"
              value={store.latitude}
              onChange={(e) => store.updateSettings({ latitude: Number(e.target.value) || 0 })}
              step={0.0001}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </FormField>
          <FormField label="Longitud" style={{ flex: 1 }}>
            <input
              type="number"
              value={store.longitude}
              onChange={(e) => store.updateSettings({ longitude: Number(e.target.value) || 0 })}
              step={0.0001}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </FormField>
        </div>
      </div>
    </>
  );
}

/* ── Step 2: Panel config ── */
function StepPanel({ store }: { store: ReturnType<typeof useSettingsStore> }) {
  return (
    <>
      <IconBox><Zap size={24} color="#A0A0A0" /></IconBox>
      <h2 style={{ fontSize: 28, fontWeight: 300, color: "#fff" }}>Tu panel solar</h2>
      <p style={{ fontSize: 14, color: "#666", marginTop: 8, marginBottom: 24 }}>
        Configura los datos de tu instalación solar.
      </p>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <FormField label="Paneles" style={{ flex: 1 }}>
            <input
              type="number"
              value={store.panelCount}
              onChange={(e) => store.updateSettings({ panelCount: Number(e.target.value) || 1 })}
              min={1}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </FormField>
          <FormField label="Potencia (W)" style={{ flex: 1 }}>
            <input
              type="number"
              value={store.nominalPower}
              onChange={(e) => store.updateSettings({ nominalPower: Number(e.target.value) || 400 })}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
            />
          </FormField>
        </div>
        <FormField label="Ángulo fijo actual (°)">
          <input
            type="number"
            value={store.fixedAngle}
            onChange={(e) => store.updateSettings({ fixedAngle: Number(e.target.value) || 0 })}
            style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
          />
        </FormField>
      </div>
    </>
  );
}

/* ── Step 3: Ready ── */
function StepReady({ store }: { store: ReturnType<typeof useSettingsStore> }) {
  return (
    <>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(0,210,106,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Check size={32} color="#00D26A" />
      </motion.div>
      <h2 style={{ fontSize: 28, fontWeight: 300, color: "#fff" }}>Todo listo</h2>
      <p style={{ fontSize: 14, color: "#666", marginTop: 8, lineHeight: 1.6 }}>
        {store.locationName} — {store.latitude.toFixed(4)}°, {store.longitude.toFixed(4)}°
        <br />
        {store.panelCount} panel{store.panelCount > 1 ? "es" : ""} × {store.nominalPower}W
      </p>
    </>
  );
}

/* ── Shared ── */

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: "rgba(255,255,255,0.04)", border: "1px solid #1E1E1E",
      display: "flex", alignItems: "center", justifyContent: "center",
      marginBottom: 20,
    }}>
      {children}
    </div>
  );
}

function FormField({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "left", ...style }}>
      <label style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 2 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 42, padding: "0 14px",
  background: "#111", border: "1px solid #1E1E1E", borderRadius: 10,
  fontSize: 14, color: "#fff", outline: "none",
  fontFamily: "Inter, sans-serif", boxSizing: "border-box",
};

/** Simple reverse geocode using Nominatim (free, no key) */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { "Accept-Language": "es" } }
    );
    const data = await res.json();
    const addr = data.address;
    return addr?.city ?? addr?.town ?? addr?.state ?? addr?.country ?? null;
  } catch {
    return null;
  }
}
