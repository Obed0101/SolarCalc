/**
 * OpenRouter AI service for SolarCalc solar assistant.
 * Uses streaming for real-time response display.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "qwen/qwen-2.5-7b-instruct";

function getApiKey(): string {
  return import.meta.env.VITE_OPENROUTER_API_KEY ?? "";
}

interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

interface SolarContext {
  latitude: number;
  longitude: number;
  locationName: string;
  currentAngle: number;
  optimalAngle: number;
  efficiency: number;
  currentWatts: number;
  harvestedKwh: number;
  expectedKwh: number;
  servoMode: string;
  nominalPower: number;
  panelCount: number;
  sunriseHour: string;
  sunsetHour: string;
  sunHours: number;
  savingsActual: number;
  savingsOptimal: number;
  // Weather
  temperature?: number;
  cloudCover?: number;
  uvIndex?: number;
  humidity?: number;
  windSpeed?: number;
  radiation?: number;
  weatherDesc?: string;
  // 7-day forecast
  forecast?: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    clouds: number;
    sunshineH: number;
    rain: number;
  }>;
}

/** Build the system prompt with full solar + weather context */
export function buildSystemPrompt(context: SolarContext): string {
  const c = context;
  const forecastStr = c.forecast?.map((d) =>
    `  ${d.date}: ${d.tempMin.toFixed(0)}-${d.tempMax.toFixed(0)}°C, nubes ${d.clouds}%, sol ${d.sunshineH.toFixed(1)}h, lluvia ${d.rain}mm`
  ).join("\n") ?? "  No disponible";

  return `Eres el asistente IA de SolarCalc Pro, una app de optimizacion de paneles solares. Respondes en español.

UBICACION Y PANEL:
- Lugar: ${c.locationName} (lat ${c.latitude.toFixed(4)}°, lon ${c.longitude.toFixed(4)}°)
- Paneles: ${c.panelCount} x ${c.nominalPower}W (${c.panelCount * c.nominalPower}W total)
- Angulo actual del panel: ${c.currentAngle}°
- Angulo optimo calculado (hoy): ${c.optimalAngle.toFixed(1)}°
- Eficiencia angular: ${c.efficiency.toFixed(1)}%
- Servo motor: modo ${c.servoMode}

PRODUCCION HOY:
- Produccion ahora: ${c.currentWatts.toFixed(0)}W
- Cosechado hoy: ${c.harvestedKwh.toFixed(2)} kWh de ${c.expectedKwh.toFixed(2)} kWh esperados (${c.expectedKwh > 0 ? ((c.harvestedKwh / c.expectedKwh) * 100).toFixed(0) : 0}%)
- Horas de sol hoy: ${c.sunHours.toFixed(1)}h (${c.sunriseHour} - ${c.sunsetHour})
- Ahorro hoy: $${c.savingsActual.toFixed(2)} actual vs $${c.savingsOptimal.toFixed(2)} optimo

CLIMA ACTUAL:
${c.temperature != null ? `- Descripcion: ${c.weatherDesc ?? "—"}` : "- No disponible"}
${c.temperature != null ? `- Temperatura: ${c.temperature.toFixed(1)}°C` : ""}
${c.cloudCover != null ? `- Nubosidad: ${c.cloudCover}%` : ""}
${c.uvIndex != null ? `- UV: ${c.uvIndex.toFixed(1)}` : ""}
${c.humidity != null ? `- Humedad: ${c.humidity}%` : ""}
${c.windSpeed != null ? `- Viento: ${c.windSpeed.toFixed(0)} km/h` : ""}
${c.radiation != null ? `- Radiacion solar: ${c.radiation.toFixed(0)} W/m²` : ""}

PRONOSTICO 7 DIAS:
${forecastStr}

FORMULA ANGULO OPTIMO:
θ(d) = latitud - 23.44 × sin((360/365)(d - 81)), donde d = dia del año

CAPACIDADES:
- Predecir produccion de los proximos dias usando el pronostico
- Recomendar ajustes de angulo por mes o estacion
- Calcular ahorro potencial si se ajusta el angulo
- Alertar sobre dias de baja produccion (nubes, lluvia)
- Explicar como afecta cada variable (nubes, temperatura, angulo) a la produccion
- Dar consejos de mantenimiento segun clima

REGLAS:
- Usa SIEMPRE los datos reales del contexto, nunca inventes numeros
- Responde conciso (3-5 oraciones) a menos que pidan detalle
- Usa **negritas** para valores importantes y listas con - para datos
- Si predicen futuro, basa en el pronostico real de 7 dias
- Sé proactivo: si ves algo que mejorar, mencionalo`;
}

/** Stream chat completion from OpenRouter */
export async function streamChat(
  messages: ChatMsg[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    onError("API key no configurada. Agrega VITE_OPENROUTER_API_KEY en .env");
    onDone();
    return;
  }

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://solarcalc.app",
        "X-Title": "SolarCalc Pro",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        max_tokens: 500,
        temperature: 0.7,
        provider: { sort: "price" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      onError(`OpenRouter error ${res.status}: ${err.slice(0, 100)}`);
      onDone();
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError("No stream available");
      onDone();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // Skip malformed chunks
        }
      }
    }

    onDone();
  } catch (err) {
    onError(`Network error: ${(err as Error).message}`);
    onDone();
  }
}
