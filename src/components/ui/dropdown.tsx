import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fade } from "@/lib/motion";
import { ChevronDown } from "lucide-react";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  trigger?: ReactNode;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  label,
  trigger,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-flex flex-col gap-1.5">
      {label && (
        <span className="text-caption text-text-secondary">{label}</span>
      )}

      {trigger ? (
        <div onClick={() => setOpen(!open)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between h-10 px-3 min-w-[160px] bg-bg-tertiary border border-border-default rounded-lg text-body transition-colors duration-200 hover:border-border-hover focus:border-border-active focus:outline-none"
        >
          <span className={selected ? "text-text-primary" : "text-text-disabled"}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-text-tertiary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            variants={fade}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-full left-0 right-0 mt-1 z-50 bg-bg-elevated border border-border-default rounded-lg py-1 shadow-lg min-w-[160px]"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-body transition-colors duration-150 ${
                  option.value === value
                    ? "text-text-primary bg-bg-tertiary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
