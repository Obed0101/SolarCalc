import { type HTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ animated = true, className = "", children, ...props }, ref) => {
    const Component = animated ? motion.div : "div";
    const animProps = animated ? { variants: fadeUp } : {};

    return (
      <Component
        ref={ref}
        {...animProps}
        className={`bg-bg-secondary border border-border-default rounded-2xl p-6 transition-colors duration-200 hover:border-border-hover ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Card.displayName = "Card";
