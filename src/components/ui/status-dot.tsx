interface StatusDotProps {
  status: "connected" | "warning" | "error" | "inactive";
  size?: "sm" | "md";
}

const statusColors = {
  connected: "bg-accent-success",
  warning: "bg-accent-warning",
  error: "bg-accent-danger",
  inactive: "bg-text-disabled",
} as const;

export function StatusDot({ status, size = "sm" }: StatusDotProps) {
  const sizeClass = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <span
      className={`inline-block rounded-full ${sizeClass} ${statusColors[status]}`}
      aria-label={`Estado: ${status}`}
    />
  );
}
