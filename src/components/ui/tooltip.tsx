import { useState, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fade } from "@/lib/motion";

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 400);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            variants={fade}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`absolute z-50 px-2.5 py-1.5 bg-bg-elevated border border-border-default rounded-lg text-caption text-text-primary whitespace-nowrap pointer-events-none ${
              side === "top"
                ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
                : "top-full left-1/2 -translate-x-1/2 mt-2"
            }`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
