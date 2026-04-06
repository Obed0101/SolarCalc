import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DashboardPage } from "@/app/dashboard/page";
import { CalculatorPage } from "@/app/calculator/page";
import { WeatherPage } from "@/app/weather/page";
import { SensorsPage } from "@/app/sensors/page";
import { ControlPage } from "@/app/control/page";
import { SettingsPage } from "@/app/settings/page";
import { OnboardingPage } from "@/app/onboarding/page";
import { useSettingsStore } from "@/stores/settings-store";

function AppRoutes() {
  const location = useLocation();
  const { setupComplete, locationName } = useSettingsStore();

  if (!setupComplete) {
    return <OnboardingPage />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#000", width: "100%" }}>
      <Sidebar />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <Header locationName={locationName} />

        <main style={{ flex: "1 1 0", overflowY: "scroll", padding: "0 32px 80px 32px", boxSizing: "border-box", width: "100%", height: 0 }}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="/sensors" element={<SensorsPage />} />
              <Route path="/control" element={<ControlPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
