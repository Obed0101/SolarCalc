import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colors, fonts } from "@/lib/hmi-tokens";
import { streamChat, buildSystemPrompt } from "@/lib/ai";
import { useSettingsStore } from "@/stores/settings-store";
import { useWeatherStore } from "@/stores/weather-store";
import { useRuntimeStore } from "@/stores/runtime-store";
import { useSensorSimulation } from "@/hooks/use-sensor-simulation";
import { optimalAngle, relativeEfficiency, dayOfYear, sunHoursEstimate, sunriseHour, sunsetHour, dailySavings, formatHour } from "@/lib/solar";
import { weatherDescription } from "@/lib/weather";
import { Bot, ArrowUp, TrendingUp, Cloud, Zap, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  time: string;
}

interface Alert {
  id: string;
  type: "info" | "warning" | "success";
  icon: React.ReactNode;
  message: string;
  time: string;
}

/** Simple markdown renderer: **bold**, `code`, \n, - lists */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    if (line.trim() === "") return <div key={li} style={{ height: 4 }} />;
    const isList = line.trimStart().startsWith("- ");
    const content = isList ? line.trimStart().slice(2) : line;

    const parts: React.ReactNode[] = [];
    let remaining = content;
    let pk = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`(.+?)`/);
      const matches = [
        boldMatch ? { idx: boldMatch.index!, len: boldMatch[0].length, type: "bold" as const, inner: boldMatch[1]! } : null,
        codeMatch ? { idx: codeMatch.index!, len: codeMatch[0].length, type: "code" as const, inner: codeMatch[1]! } : null,
      ].filter(Boolean).sort((a, b) => a!.idx - b!.idx);

      if (matches.length === 0) { parts.push(<span key={pk++}>{remaining}</span>); break; }
      const m = matches[0]!;
      if (m.idx > 0) parts.push(<span key={pk++}>{remaining.slice(0, m.idx)}</span>);
      if (m.type === "bold") {
        parts.push(<strong key={pk++} style={{ color: colors.textPrimary, fontWeight: 600 }}>{m.inner}</strong>);
      } else {
        parts.push(<code key={pk++} style={{ background: "rgba(255,255,255,0.06)", padding: "1px 4px", borderRadius: 3, fontSize: 9, fontFamily: fonts.mono }}>{m.inner}</code>);
      }
      remaining = remaining.slice(m.idx + m.len);
    }

    return (
      <div key={li} style={{ display: "flex", gap: isList ? 6 : 0 }}>
        {isList && <span style={{ color: colors.cyan, fontSize: 8, marginTop: 2 }}>●</span>}
        <span>{parts}</span>
      </div>
    );
  });
}

export function AIAssistant() {
  const { latitude, longitude, locationName, fixedAngle, nominalPower, tariffPerKwh, panelCount } = useSettingsStore();
  const weatherData = useWeatherStore((s) => s.data);
  const servoMode = useRuntimeStore((s) => s.servoMode);
  const { current } = useSensorSimulation();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "init", role: "assistant", text: "Hola! Soy tu asistente solar con **IA**. Preguntame lo que necesites sobre tu instalacion.", time: timeNow() },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatHistory = useRef<Array<{ role: "system" | "user" | "assistant"; content: string }>>([]);

  // Auto-generate alerts based on real data
  const alerts = useAlerts(latitude, fixedAngle, weatherData, current.watts);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(() => {
    if (!input.trim() || streaming) return;
    const timeStr = timeNow();

    // Add user message
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: input, time: timeStr };
    setMessages((prev) => [...prev, userMsg]);
    const q = input;
    setInput("");

    // Build full context
    const today = dayOfYear();
    const optimal = optimalAngle(latitude, today);
    const efficiency = relativeEfficiency(fixedAngle, optimal) * 100;
    const sunH = sunHoursEstimate(latitude, today);
    const rise = sunriseHour(latitude, today);
    const set = sunsetHour(latitude, today);
    const now = new Date();
    const hourDecimal = now.getHours() + now.getMinutes() / 60;
    const harvestedKwh = Math.max(0, (current.watts * Math.max(0, hourDecimal - rise)) / 1000);
    const expectedKwh = (nominalPower * sunH) / 1000;
    const savings = dailySavings(nominalPower, fixedAngle, optimal, tariffPerKwh, sunH);

    const forecast = weatherData?.daily.map((d) => ({
      date: d.date,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      clouds: d.cloudCoverMean,
      sunshineH: d.sunshineHours,
      rain: d.precipitationSum,
    }));

    const systemPrompt = buildSystemPrompt({
      latitude, longitude, locationName,
      currentAngle: fixedAngle,
      optimalAngle: Math.abs(optimal),
      efficiency,
      currentWatts: current.watts,
      harvestedKwh, expectedKwh,
      servoMode,
      nominalPower,
      panelCount,
      sunriseHour: formatHour(rise),
      sunsetHour: formatHour(set),
      sunHours: sunH,
      savingsActual: savings.actual,
      savingsOptimal: savings.optimal,
      temperature: weatherData?.current.temperature,
      cloudCover: weatherData?.current.cloudCover,
      uvIndex: weatherData?.current.uvIndex,
      humidity: weatherData?.current.humidity,
      windSpeed: weatherData?.current.windSpeed,
      radiation: weatherData?.current.radiation,
      weatherDesc: weatherData ? weatherDescription(weatherData.current.weatherCode) : undefined,
      forecast,
    });

    // Build message history for API
    if (chatHistory.current.length === 0) {
      chatHistory.current.push({ role: "system", content: systemPrompt });
    } else {
      chatHistory.current[0] = { role: "system", content: systemPrompt };
    }
    chatHistory.current.push({ role: "user", content: q });

    // Create streaming message
    const aiMsgId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", text: "", time: timeStr }]);
    setStreaming(true);

    let rawAccumulated = "";

    streamChat(
      chatHistory.current,
      (chunk) => {
        rawAccumulated += chunk;
        // Strip <think>...</think> blocks (including partial ones)
        let visible = rawAccumulated
          .replace(/<think>[\s\S]*?<\/think>/g, "")  // Complete think blocks
          .replace(/<think>[\s\S]*$/, "");             // Partial think block at end (still streaming)
        // Also strip any remaining tags
        visible = visible.replace(/<\/?think>/g, "").trim();
        // Show raw if nothing visible (model might not use think tags)
        const display = visible || (rawAccumulated.includes("</think>") ? "" : rawAccumulated.trim());
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, text: display } : m)
        );
      },
      () => {
        let finalText = rawAccumulated
          .replace(/<think>[\s\S]*?<\/think>/g, "")
          .replace(/<\/?think>/g, "")
          .trim();
        // If filter ate everything, show raw without think tags
        if (!finalText) finalText = rawAccumulated.replace(/<\/?think>/g, "").trim();
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, text: finalText } : m)
        );
        chatHistory.current.push({ role: "assistant", content: finalText });
        // Keep history manageable (last 10 exchanges)
        if (chatHistory.current.length > 22) {
          chatHistory.current = [chatHistory.current[0]!, ...chatHistory.current.slice(-20)];
        }
        setStreaming(false);
      },
      (error) => {
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, text: `Error: ${error}` } : m)
        );
        setStreaming(false);
      },
    );
  }, [input, streaming, latitude, longitude, locationName, fixedAngle, nominalPower, current.watts, weatherData, servoMode]);

  const alertColor = (type: Alert["type"]) =>
    type === "warning" ? colors.amber : type === "success" ? colors.green : colors.cyan;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", width: "100%",
      background: colors.bgCard, borderRadius: 10, border: `1px solid ${colors.border}`,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
        borderBottom: `1px solid ${colors.border}`, flexShrink: 0,
      }}>
        <Bot size={14} color={colors.cyan} />
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.textTertiary }}>
          Asistente Solar IA
        </span>
        <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: streaming ? colors.amber : colors.green, animation: "hmi-dot-pulse 2s ease-in-out infinite" }} />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ padding: "6px 10px", borderBottom: `1px solid ${colors.border}`, flexShrink: 0, maxHeight: 90, overflowY: "auto" }}>
          {alerts.map((alert) => (
            <div key={alert.id} style={{
              display: "flex", alignItems: "flex-start", gap: 6, padding: "3px 0",
              fontSize: 9, color: colors.textSecondary, lineHeight: 1.4,
            }}>
              <span style={{ color: alertColor(alert.type), flexShrink: 0, marginTop: 1 }}>{alert.icon}</span>
              <span style={{ flex: 1 }}>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chat area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "90%",
                padding: "8px 10px",
                borderRadius: msg.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                background: msg.role === "user" ? "rgba(255,255,255,0.06)" : "rgba(0,188,212,0.06)",
                border: `1px solid ${msg.role === "user" ? "rgba(255,255,255,0.08)" : "rgba(0,188,212,0.12)"}`,
                fontSize: 10, color: colors.textSecondary, lineHeight: 1.5,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {msg.text ? renderMarkdown(msg.text) : (
                  <span style={{ color: colors.textTertiary, fontStyle: "italic" }}>Pensando...</span>
                )}
              </div>
              <div style={{ fontSize: 7, color: colors.textTertiary, marginTop: 4, textAlign: "right" }}>{msg.time}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 10px",
        borderTop: `1px solid ${colors.border}`, flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={streaming ? "Esperando respuesta..." : "Pregunta algo..."}
          disabled={streaming}
          style={{
            flex: 1, height: 30, padding: "0 10px", background: "rgba(255,255,255,0.03)",
            border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 11,
            color: colors.textPrimary, outline: "none", fontFamily: fonts.primary,
            transition: "border-color 0.15s",
            opacity: streaming ? 0.5 : 1,
          }}
          onFocus={(e) => (e.target.style.borderColor = "#333")}
          onBlur={(e) => (e.target.style.borderColor = colors.border)}
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          style={{
            width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
            background: input.trim() && !streaming ? colors.cyan : "transparent",
            border: "none", borderRadius: "50%", cursor: streaming ? "wait" : "pointer",
            color: input.trim() && !streaming ? "#000" : colors.textTertiary,
            transition: "all 0.15s",
          }}
        >
          {streaming ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <ArrowUp size={14} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  );
}

function timeNow(): string {
  return new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

/** Generate real alerts based on current data */
function useAlerts(latitude: number, fixedAngle: number, weatherData: any, currentWatts: number): Alert[] {
  const today = dayOfYear();
  const optimal = optimalAngle(latitude, today);
  const angleDiff = Math.abs(fixedAngle - Math.abs(optimal));
  const cloud = weatherData?.current?.cloudCover ?? 0;
  const tomorrow = weatherData?.daily?.[1];

  const alerts: Alert[] = [];

  if (angleDiff > 3) {
    alerts.push({
      id: "angle", type: "info", icon: <TrendingUp size={12} />,
      message: `Panel a ${fixedAngle}°, optimo ${Math.abs(optimal).toFixed(1)}°. Ajustar reduciria perdidas.`,
      time: timeNow(),
    });
  }

  if (tomorrow && tomorrow.cloudCoverMean > 60) {
    alerts.push({
      id: "cloud", type: "warning", icon: <Cloud size={12} />,
      message: `Manana: ${tomorrow.cloudCoverMean}% nubes. Produccion reducida esperada.`,
      time: timeNow(),
    });
  }

  if (currentWatts > 100) {
    alerts.push({
      id: "prod", type: "success", icon: <Zap size={12} />,
      message: `Produciendo ${currentWatts.toFixed(0)}W. Buen rendimiento solar.`,
      time: timeNow(),
    });
  }

  return alerts;
}
