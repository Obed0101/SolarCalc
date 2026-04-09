/**
 * Open-Meteo weather service — free, no API key required.
 * Provides current conditions + 7-day daily forecast.
 */

export interface CurrentWeather {
  temperature: number;       // °C
  humidity: number;          // %
  cloudCover: number;        // %
  windSpeed: number;         // km/h
  uvIndex: number;           // 0-11+
  precipitation: number;     // mm
  weatherCode: number;       // WMO code
  isDay: boolean;
  radiation: number;         // W/m² (shortwave)
  directRadiation: number;   // W/m² (direct normal irradiance)
}

export interface DailyForecast {
  date: string;              // YYYY-MM-DD
  tempMax: number;
  tempMin: number;
  cloudCoverMean: number;    // %
  uvIndexMax: number;
  precipitationSum: number;  // mm
  sunshineHours: number;     // hours
  weatherCode: number;
  windSpeedMax: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
  fetchedAt: number;         // Date.now()
}

const BASE = "https://api.open-meteo.com/v1/forecast";

/** Fetch current weather + 7-day forecast from Open-Meteo */
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "cloud_cover",
      "wind_speed_10m",
      "uv_index",
      "precipitation",
      "weather_code",
      "is_day",
      "shortwave_radiation",
      "direct_normal_irradiance",
    ].join(","),
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "cloud_cover_mean",
      "uv_index_max",
      "precipitation_sum",
      "sunshine_duration",
      "weather_code",
      "wind_speed_10m_max",
    ].join(","),
    timezone: "auto",
    forecast_days: "7",
  });

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const json = await res.json();

  const c = json.current;
  const current: CurrentWeather = {
    temperature: c.temperature_2m,
    humidity: c.relative_humidity_2m,
    cloudCover: c.cloud_cover,
    windSpeed: c.wind_speed_10m,
    uvIndex: c.uv_index,
    precipitation: c.precipitation,
    weatherCode: c.weather_code,
    isDay: c.is_day === 1,
    radiation: c.shortwave_radiation,
    directRadiation: c.direct_normal_irradiance,
  };

  const d = json.daily;
  const daily: DailyForecast[] = d.time.map((date: string, i: number) => ({
    date,
    tempMax: d.temperature_2m_max[i],
    tempMin: d.temperature_2m_min[i],
    cloudCoverMean: d.cloud_cover_mean[i],
    uvIndexMax: d.uv_index_max[i],
    precipitationSum: d.precipitation_sum[i],
    sunshineHours: d.sunshine_duration[i] / 3600, // API returns seconds
    weatherCode: d.weather_code[i],
    windSpeedMax: d.wind_speed_10m_max[i],
  }));

  return { current, daily, fetchedAt: Date.now() };
}

/** WMO weather code to short description */
export function weatherDescription(code: number): string {
  if (code === 0) return "Despejado";
  if (code <= 3) return "Parcialmente nublado";
  if (code <= 48) return "Niebla";
  if (code <= 57) return "Llovizna";
  if (code <= 67) return "Lluvia";
  if (code <= 77) return "Nieve";
  if (code <= 82) return "Aguacero";
  if (code <= 86) return "Nieve fuerte";
  if (code <= 99) return "Tormenta";
  return "Desconocido";
}

/** UV index to risk label */
export function uvLabel(uv: number): string {
  if (uv <= 2) return "bajo";
  if (uv <= 5) return "moderado";
  if (uv <= 7) return "alto";
  if (uv <= 10) return "muy alto";
  return "extremo";
}

/** Cloud cover to estimated efficiency factor (0-1) */
export function cloudEfficiencyFactor(cloudCover: number): number {
  return 1 - (cloudCover / 100) * 0.75;
}
