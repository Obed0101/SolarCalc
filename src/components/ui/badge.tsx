type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-bg-tertiary text-text-secondary border-border-default",
  success: "bg-accent-success/10 text-accent-success border-accent-success/20",
  warning: "bg-accent-warning/10 text-accent-warning border-accent-warning/20",
  danger: "bg-accent-danger/10 text-accent-danger border-accent-danger/20",
  info: "bg-accent-info/10 text-accent-info border-accent-info/20",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-overline border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
