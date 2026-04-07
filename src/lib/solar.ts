/**
 * SolarCalc Pro — Solar Math Engine
 * Pure functions for solar angle calculations.
 */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Get day of year (1-365) from a Date */
export function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Solar declination angle for a given day of year */
export function solarDeclination(day: number): number {
  return 23.44 * Math.sin((360 / 365) * (day - 81) * DEG_TO_RAD);
}

/**
 * Optimal panel tilt angle for a given latitude and day.
 * θ(d) = φ − 23.44 × sin[(360/365)(d − 81)]
 */
export function optimalAngle(latitude: number, day: number): number {
  return latitude - solarDeclination(day);
}

/** Direction label based on angle sign */
export function angleDirection(angle: number): "Sur" | "Norte" | "Horizontal" {
  if (Math.abs(angle) < 0.5) return "Horizontal";
  return angle > 0 ? "Sur" : "Norte";
}

/** Relative efficiency: how much energy you capture at current vs optimal angle */
export function relativeEfficiency(currentAngle: number, optimalAngle: number): number {
  const diff = Math.abs(currentAngle - optimalAngle);
  return Math.max(0, Math.cos(diff * DEG_TO_RAD));
}

/** Energy loss percentage from suboptimal angle */
export function energyLossPercent(currentAngle: number, optimalAngle: number): number {
  return (1 - relativeEfficiency(currentAngle, optimalAngle)) * 100;
}

/** Estimated production in watts */
export function estimatedProduction(
  nominalPower: number,
  currentAngle: number,
  optAngle: number,
  cloudPercent: number = 15,
  sunHours: number = 6,
): number {
  const efficiency = relativeEfficiency(currentAngle, optAngle);
  const climateFactor = ((100 - cloudPercent) / 100) * 0.8 + 0.2;
  return nominalPower * efficiency * climateFactor;
}

/** Mid-day of each month (approximate) */
const MONTH_DAYS = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349] as const;
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

export interface MonthAngle {
  month: string;
  monthIndex: number;
  day: number;
  declination: number;
  angle: number;
  direction: "Sur" | "Norte" | "Horizontal";
}

/** Calculate optimal angles for all 12 months */
export function monthlyAngles(latitude: number): MonthAngle[] {
  return MONTH_DAYS.map((day, i) => {
    const decl = solarDeclination(day);
    const angle = optimalAngle(latitude, day);
    return {
      month: MONTH_NAMES[i]!,
      monthIndex: i,
      day,
      declination: decl,
      angle,
      direction: angleDirection(angle),
    };
  });
}

/** Generate 365-day curve data for charting */
export function annualCurve(latitude: number): Array<{ day: number; angle: number }> {
  const data: Array<{ day: number; angle: number }> = [];
  for (let d = 1; d <= 365; d++) {
    data.push({ day: d, angle: optimalAngle(latitude, d) });
  }
  return data;
}

/** Approximate sunrise/sunset hours for production estimation */
export function sunHoursEstimate(latitude: number, day: number): number {
  const decl = solarDeclination(day) * DEG_TO_RAD;
  const lat = latitude * DEG_TO_RAD;
  const cosH = -Math.tan(lat) * Math.tan(decl);
  if (cosH < -1) return 24; // midnight sun
  if (cosH > 1) return 0;   // polar night
  const H = Math.acos(cosH) * RAD_TO_DEG;
  return (2 * H) / 15; // hours
}

/** Sunrise hour (decimal, e.g. 6.38 = 6:23 AM) */
export function sunriseHour(latitude: number, day: number): number {
  const sunH = sunHoursEstimate(latitude, day);
  const solarNoon = 12; // approximate
  return solarNoon - sunH / 2;
}

/** Sunset hour (decimal, e.g. 18.8 = 6:48 PM) */
export function sunsetHour(latitude: number, day: number): number {
  const sunH = sunHoursEstimate(latitude, day);
  const solarNoon = 12;
  return solarNoon + sunH / 2;
}

/** Sun progress through the day (0 = sunrise, 0.5 = noon, 1 = sunset) */
export function sunProgress(latitude: number, day: number, hour: number): number {
  const rise = sunriseHour(latitude, day);
  const set = sunsetHour(latitude, day);
  if (hour <= rise) return 0;
  if (hour >= set) return 1;
  return (hour - rise) / (set - rise);
}

/** Format decimal hour to HH:MM string */
export function formatHour(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/** Daily savings calculation */
export function dailySavings(
  nominalPower: number,
  currentAngle: number,
  optAngle: number,
  tariffPerKwh: number,
  sunHours: number,
): { optimal: number; actual: number; savings: number } {
  const optProd = nominalPower * sunHours / 1000; // kWh
  const efficiency = relativeEfficiency(currentAngle, optAngle);
  const actProd = optProd * efficiency;
  return {
    optimal: optProd * tariffPerKwh,
    actual: actProd * tariffPerKwh,
    savings: (optProd - actProd) * tariffPerKwh,
  };
}
