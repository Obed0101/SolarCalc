import { create } from "zustand";

interface RuntimeState {
  hmiMode: "production" | "calculator" | "climate";
  connectionStatus: "ok" | "demo" | "warning" | "error";
  servoAngle: number;
  servoMode: "auto" | "manual" | "monthly";
  setHmiMode: (mode: RuntimeState["hmiMode"]) => void;
  setServoAngle: (angle: number) => void;
  setServoMode: (mode: RuntimeState["servoMode"]) => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  hmiMode: "production",
  connectionStatus: "demo",
  servoAngle: 10,
  servoMode: "auto",
  setHmiMode: (mode) => set({ hmiMode: mode }),
  setServoAngle: (angle) => set({ servoAngle: angle }),
  setServoMode: (mode) => set({ servoMode: mode }),
}));
