import { useState, useEffect, useRef } from "react";

export interface SensorReading {
  watts: number;
  voltage: number;
  amps: number;
  timestamp: number;
}

/**
 * Simulates solar sensor data at 1Hz following a realistic solar production curve.
 * Peaks at noon, zero at night.
 */
export function useSensorSimulation() {
  const [current, setCurrent] = useState<SensorReading>(generate());
  const [history, setHistory] = useState<Array<{ watts: number; time: string }>>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const reading = generate();
      setCurrent(reading);
      setHistory((prev) => {
        const next = [
          ...prev,
          {
            watts: reading.watts,
            time: new Date().toLocaleTimeString("es", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          },
        ];
        return next.slice(-60);
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { current, history, isSimulated: true };
}

function generate(): SensorReading {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  const solarFactor = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
  const base = 400 * solarFactor;
  const noise = (Math.random() - 0.5) * 20;
  const watts = Math.max(0, base + noise);
  const voltage = watts > 0 ? 36 + Math.random() * 4 : 0;
  const amps = voltage > 0 ? watts / voltage : 0;
  return { watts, voltage, amps, timestamp: Date.now() };
}
