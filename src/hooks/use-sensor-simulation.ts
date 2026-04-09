import { useState, useEffect, useRef, useCallback } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { useWeatherStore } from "@/stores/weather-store";
import { sunriseHour, sunsetHour, dayOfYear } from "@/lib/solar";

export interface SensorReading {
  watts: number;
  voltage: number;
  amps: number;
  timestamp: number;
}

const UPDATE_INTERVAL_MS = 5_000; // 5 seconds — realistic refresh rate
const HISTORY_MAX = 120; // 10 minutes of history at 5s intervals

/**
 * Simulates solar sensor data following real solar physics:
 * - Uses actual sunrise/sunset for latitude
 * - Applies cloud cover attenuation from real weather
 * - Bell curve production peaking at solar noon
 * - Small noise for realism (±3%)
 * - Night = 0W, dawn/dusk = ramp up/down
 */
export function useSensorSimulation() {
  const { latitude, nominalPower } = useSettingsStore();
  const weatherData = useWeatherStore((s) => s.data);

  const generate = useCallback((): SensorReading => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    const today = dayOfYear();

    const rise = sunriseHour(latitude, today);
    const set = sunsetHour(latitude, today);
    const dayLength = set - rise;

    // No production at night
    if (hour <= rise || hour >= set || dayLength <= 0) {
      return { watts: 0, voltage: 0, amps: 0, timestamp: Date.now() };
    }

    // Solar factor: sine curve from sunrise to sunset
    const progress = (hour - rise) / dayLength;
    const solarFactor = Math.sin(progress * Math.PI);

    // Cloud attenuation from real weather (0-100% cloud cover → 25-100% efficiency)
    const cloudCover = weatherData?.current.cloudCover ?? 15;
    const cloudFactor = 1 - (cloudCover / 100) * 0.75;

    // Temperature derating (panels lose ~0.4% per °C above 25°C)
    const temp = weatherData?.current.temperature ?? 28;
    const tempFactor = temp > 25 ? 1 - (temp - 25) * 0.004 : 1;

    // Base production
    const baseWatts = nominalPower * solarFactor * cloudFactor * tempFactor;

    // Small realistic noise (±3%)
    const noise = 1 + (Math.random() - 0.5) * 0.06;
    const watts = Math.max(0, baseWatts * noise);

    // Voltage: 36-40V when producing, proportional to production
    const voltage = watts > 0 ? 36 + (watts / nominalPower) * 4 + (Math.random() - 0.5) * 0.5 : 0;
    const amps = voltage > 0 ? watts / voltage : 0;

    return { watts, voltage, amps, timestamp: Date.now() };
  }, [latitude, nominalPower, weatherData]);

  const [current, setCurrent] = useState<SensorReading>(generate);
  const [history, setHistory] = useState<Array<{ watts: number; time: string }>>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    // Initial reading
    const reading = generate();
    setCurrent(reading);

    intervalRef.current = setInterval(() => {
      const r = generate();
      setCurrent(r);
      setHistory((prev) => {
        const timeStr = new Date().toLocaleTimeString("es", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const next = [...prev, { watts: r.watts, time: timeStr }];
        return next.slice(-HISTORY_MAX);
      });
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generate]);

  return { current, history, isSimulated: true };
}
