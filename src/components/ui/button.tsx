import { type ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { scalePress } from "@/lib/motion";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-white text-black hover:opacity-90 active:opacity-80",
  secondary:
    "bg-transparent border border-border-default text-text-primary hover:border-border-hover",
  danger:
    "bg-transparent border border-accent-danger text-accent-danger hover:bg-accent-danger/10",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-caption rounded-md gap-1.5",
  md: "h-10 px-4 text-body rounded-lg gap-2",
  lg: "h-12 px-6 text-body font-medium rounded-lg gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        {...scalePress}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200 select-none ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? "opacity-40 pointer-events-none" : ""} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
