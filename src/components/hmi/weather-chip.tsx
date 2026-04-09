import { colors, fonts, typography } from "@/lib/hmi-tokens";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { weatherDescription, uvLabel } from "@/lib/weather";
import type { WeatherData } from "@/lib/weather";

interface WeatherChipProps {
  weather: WeatherData | null;
  loading: boolean;
}

export function WeatherChip({ weather, loading }: WeatherChipProps) {
  if (loading || !weather) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
        <span style={{ fontSize: 10, color: colors.textTertiary }}>
          {loading ? "Cargando clima..." : "Sin datos"}
        </span>
      </div>
    );
  }

  const c = weather.current;
  const desc = weatherDescription(c.weatherCode);
  const uvText = uvLabel(c.uvIndex);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", height: "100%" }}>
      <span style={{ ...typography.label, fontSize: 9 }}>Clima Actual</span>

      {/* Main temp */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 200, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums", color: colors.textPrimary, lineHeight: 1 }}>
          <AnimatedNumber value={c.temperature} decimals={0} />
        </span>
        <span style={{ fontSize: 14, color: colors.textSecondary }}>°C</span>
        <span style={{ fontSize: 10, color: colors.textTertiary, marginLeft: 6 }}>{desc}</span>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, flex: 1, alignContent: "center" }}>
        <StatCell label="Nubes" value={`${c.cloudCover}%`} color={c.cloudCover > 50 ? colors.textTertiary : colors.textSecondary} />
        <StatCell label="UV" value={`${c.uvIndex.toFixed(0)} ${uvText}`} color={c.uvIndex > 7 ? colors.red : c.uvIndex > 5 ? colors.amber : colors.green} />
        <StatCell label="Radiacion" value={`${(c.radiation / 1000).toFixed(1)} kW`} color={colors.amber} />
        <StatCell label="Humedad" value={`${c.humidity}%`} color={colors.cyan} />
        <StatCell label="Viento" value={`${c.windSpeed.toFixed(0)} km/h`} color={colors.textSecondary} />
        <StatCell label="Lluvia" value={`${c.precipitation} mm`} color={c.precipitation > 0 ? colors.cyan : colors.textTertiary} />
      </div>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 7, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11, fontFamily: fonts.mono, fontVariantNumeric: "tabular-nums", color, marginTop: 1 }}>{value}</div>
    </div>
  );
}
