import { useEffect } from "react";
import { useWeatherStore } from "@/stores/weather-store";
import { useSettingsStore } from "@/stores/settings-store";

/** Auto-fetches weather data when latitude/longitude change or cache expires */
export function useWeather() {
  const { latitude, longitude } = useSettingsStore();
  const { data, loading, error, fetch: fetchWeather } = useWeatherStore();

  useEffect(() => {
    fetchWeather(latitude, longitude);
    // Refresh every 15 min
    const id = setInterval(() => fetchWeather(latitude, longitude), 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [latitude, longitude, fetchWeather]);

  return { weather: data, loading, error };
}
