import { create } from "zustand";
import { fetchWeather, type WeatherData } from "@/lib/weather";

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 min

interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  fetch: (lat: number, lng: number) => Promise<void>;
  isFresh: () => boolean;
}

export const useWeatherStore = create<WeatherState>()((set, get) => ({
  data: null,
  loading: false,
  error: null,

  fetch: async (lat, lng) => {
    // Skip if cache is fresh
    if (get().isFresh()) return;

    set({ loading: true, error: null });
    try {
      const data = await fetchWeather(lat, lng);
      set({ data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  isFresh: () => {
    const { data } = get();
    if (!data) return false;
    return Date.now() - data.fetchedAt < CACHE_DURATION_MS;
  },
}));
