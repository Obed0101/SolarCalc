import { motion } from "framer-motion";
import { transitions } from "@/lib/motion";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-white" : "bg-bg-tertiary border border-border-default"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <motion.span
        animate={{ x: checked ? 22 : 2 }}
        transition={transitions.spring}
        className={`inline-block h-4 w-4 rounded-full ${
          checked ? "bg-black" : "bg-text-tertiary"
        }`}
      />
    </button>
  );
}
