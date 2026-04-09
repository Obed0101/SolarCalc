import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * Checks both OS prefers-reduced-motion AND manual app toggle.
 * Returns true if animations should be reduced.
 */
export function useReducedMotion(): boolean {
  const osPrefers = useFramerReducedMotion();
  return !!osPrefers;
}
