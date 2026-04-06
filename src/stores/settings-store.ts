import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PanelType = "monocrystalline" | "polycrystalline" | "thin-film" | "bifacial";

export interface SolarZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  panelType: PanelType;
  panelCount: number;
  nominalPower: number;
  fixedAngle: number;
  tariffPerKwh: number;
  currency: string;
}

interface SettingsState {
  setupComplete: boolean;
  activeZoneId: string;
  zones: SolarZone[];
  theme: "dark" | "light";

  // Convenience getters derived from active zone
  locationName: string;
  latitude: number;
  longitude: number;
  panelCount: number;
  nominalPower: number;
  fixedAngle: number;
  tariffPerKwh: number;
  currency: string;
  panelType: PanelType;

  completeSetup: () => void;
  updateSettings: (partial: Partial<SolarZone>) => void;
  addZone: (zone: Omit<SolarZone, "id">) => void;
  removeZone: (id: string) => void;
  setActiveZone: (id: string) => void;
}

const DEFAULT_ZONE: SolarZone = {
  id: "default",
  name: "Panama",
  latitude: 9.0,
  longitude: -79.5,
  panelType: "monocrystalline",
  panelCount: 1,
  nominalPower: 400,
  fixedAngle: 10,
  tariffPerKwh: 0.35,
  currency: "USD",
};

function deriveFromZone(zone: SolarZone) {
  return {
    locationName: zone.name,
    latitude: zone.latitude,
    longitude: zone.longitude,
    panelCount: zone.panelCount,
    nominalPower: zone.nominalPower,
    fixedAngle: zone.fixedAngle,
    tariffPerKwh: zone.tariffPerKwh,
    currency: zone.currency,
    panelType: zone.panelType,
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      setupComplete: false,
      activeZoneId: "default",
      zones: [DEFAULT_ZONE],
      theme: "dark",
      ...deriveFromZone(DEFAULT_ZONE),

      completeSetup: () => set({ setupComplete: true }),

      updateSettings: (partial) => {
        const { zones, activeZoneId } = get();
        const updated = zones.map((z) =>
          z.id === activeZoneId ? { ...z, ...partial } : z,
        );
        const active = updated.find((z) => z.id === activeZoneId) ?? updated[0]!;
        set({ zones: updated, ...deriveFromZone(active) });
      },

      addZone: (zone) => {
        const id = `zone-${Date.now()}`;
        const newZone = { ...zone, id };
        const zones = [...get().zones, newZone];
        set({ zones, activeZoneId: id, ...deriveFromZone(newZone) });
      },

      removeZone: (id) => {
        const zones = get().zones.filter((z) => z.id !== id);
        if (zones.length === 0) zones.push(DEFAULT_ZONE);
        const active = zones[0]!;
        set({ zones, activeZoneId: active.id, ...deriveFromZone(active) });
      },

      setActiveZone: (id) => {
        const zone = get().zones.find((z) => z.id === id);
        if (zone) set({ activeZoneId: id, ...deriveFromZone(zone) });
      },
    }),
    { name: "solarcalc-settings" },
  ),
);
