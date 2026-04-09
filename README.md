# SolarCalc Pro

**Real-time solar panel optimization dashboard built with Tauri v2 and React 19.**

![Tauri](https://img.shields.io/badge/Tauri-v2-24C8D8?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Open-Meteo](https://img.shields.io/badge/Weather-Open--Meteo-FF6B35)
![License](https://img.shields.io/badge/License-MIT-green)

## What is it

SolarCalc Pro is a desktop application that calculates the optimal tilt angle for solar panels based on geographic latitude, day of year, and real-time weather conditions. It features an industrial HMI-style single-screen dashboard with live sensor simulation, AI-powered recommendations via OpenRouter, and 7-day weather forecasting through Open-Meteo. Designed for both monitoring and education, it visualizes solar energy production, efficiency losses, and financial savings in real time.

<!-- screenshots -->

## Features

### HMI Dashboard
Single-screen industrial interface inspired by iF Design Award HMI winners. Radial gauges, dot matrix displays, sun arc visualization, and harvest curves — all on one screen with zero page switching. Desktop uses the full HMI layout; mobile devices get a multi-page responsive design.

### AI Solar Assistant
Context-aware AI assistant powered by OpenRouter (Qwen 2.5 7B). Receives live system data — panel angle, weather, production, efficiency — and provides streaming recommendations in Spanish. Predicts production for upcoming days using the real 7-day forecast.

### Real Weather Data
Live weather integration via Open-Meteo (free, no API key). Current conditions (temperature, cloud cover, UV index, solar radiation, wind) plus 7-day daily forecasts with sunshine hours and precipitation data.

### Solar Math Engine
Pure TypeScript functions for solar geometry. Calculates optimal tilt angle, solar declination, sunrise/sunset hours, relative efficiency, energy loss from suboptimal angles, and daily financial savings.

### Multi-zone Management
Configure and switch between multiple solar installations. Each zone stores its own coordinates, panel type (monocrystalline, polycrystalline, thin-film, bifacial), nominal power, tariff, and fixed angle. Persisted via Zustand with localStorage.

### Statistics Page
GitHub-style energy contribution grid, production charts, and historical data visualization using Recharts. Tracks harvested vs expected energy over time.

### Sensor Simulation
Realistic solar production curve that follows the sun arc, with weather-based attenuation from cloud cover. Simulates watts, voltage, and amperage readings throughout the day.

## Tech Stack

| Technology | Purpose |
|---|---|
| **Tauri v2** | Native desktop shell (macOS, Windows, Linux) |
| **React 19** | UI framework |
| **TypeScript 5** | Type safety |
| **Zustand** | State management with persistence |
| **Framer Motion** | Gauge animations, spring physics, transitions |
| **Recharts** | Production charts and statistics |
| **Leaflet** | Interactive location map |
| **Open-Meteo** | Weather API (free, no key required) |
| **OpenRouter** | AI assistant (Qwen 2.5 7B, streaming) |
| **Tailwind CSS 4** | Utility styling |
| **Vite 8** | Build tooling and HMR |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Rust](https://rustup.rs) (latest stable)
- Tauri CLI:
  ```bash
  cargo install tauri-cli
  ```

### Install

```bash
git clone https://github.com/Obed0101/SolarCalc.git
cd SolarCalc
bun install
```

### Development

```bash
# Web only (browser)
bun run dev

# Desktop app (Tauri)
bun run tauri dev
```

### Build

```bash
# Production desktop build
bun run tauri build
```

## Project Structure

```
src/
├── app/                    # Page components
│   ├── ai/                 # AI assistant page (mobile)
│   ├── calculator/         # Angle calculator
│   ├── control/            # Panel control
│   ├── dashboard/          # Mobile dashboard
│   ├── hmi/                # Desktop HMI single-screen
│   ├── onboarding/         # First-run setup wizard
│   ├── sensors/            # Sensor readings
│   ├── settings/           # Configuration
│   ├── stats/              # Statistics & charts
│   └── weather/            # Weather page (mobile)
├── components/
│   ├── hmi/                # HMI dashboard widgets
│   │   ├── ai-assistant    # Streaming AI chat panel
│   │   ├── angle-hero      # Primary angle display
│   │   ├── dot-matrix      # Industrial dot grid
│   │   ├── harvest-curve   # Daily production chart
│   │   ├── mini-gauge      # Radial SVG gauges
│   │   ├── sun-arc         # Sun position arc
│   │   └── weather-chip    # Weather summary
│   ├── layout/             # Sidebar, header, mobile nav
│   └── shared/             # Reusable (animated number, map)
├── hooks/                  # Custom React hooks
│   ├── use-platform        # Desktop vs mobile detection
│   ├── use-sensor-simulation # Simulated sensor data
│   └── use-weather         # Weather data fetching
├── lib/                    # Core logic
│   ├── ai.ts               # OpenRouter streaming client
│   ├── hmi-tokens.ts       # Design tokens (colors, fonts)
│   ├── solar.ts            # Solar math engine
│   └── weather.ts          # Open-Meteo client
├── stores/                 # Zustand state
│   ├── settings-store.ts   # Zones, panel config, persistence
│   └── weather-store.ts    # Cached weather data
└── App.tsx                 # Root: routing + platform switching
src-tauri/                  # Tauri v2 backend (Rust)
```

## Solar Math

The core formula for optimal panel tilt angle:

$$\theta(d) = \varphi - 23.44 \times \sin\!\left(\frac{360}{365}(d - 81)\right)$$

Where:
- $\theta$ = optimal tilt angle (degrees)
- $\varphi$ = latitude of the installation
- $d$ = day of year (1-365)
- $23.44°$ = Earth's axial tilt

Relative efficiency at a non-optimal angle is calculated as:

$$\eta = \cos(\theta_{current} - \theta_{optimal})$$

The engine also computes sunrise/sunset hours, sun progress through the day, daily energy production estimates, and financial savings from angle optimization.

## AI Assistant

The AI assistant uses OpenRouter to access the Qwen 2.5 7B model with streaming responses. On each query, the system prompt is rebuilt with full live context:

- Current panel angle vs calculated optimal
- Real-time production (watts, kWh harvested)
- Weather conditions (temperature, clouds, UV, radiation)
- 7-day forecast data
- Financial savings calculations

This ensures every response is grounded in actual system data rather than generic advice.

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Get your API key at [openrouter.ai/keys](https://openrouter.ai/keys). The AI assistant is optional — all other features work without it.

Open-Meteo requires no API key.

## License

MIT

## Credits

Developed as part of a solar energy optimization project at **Universidad Latina de Panama**.
