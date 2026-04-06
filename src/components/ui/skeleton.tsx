interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = "", width, height }: SkeletonProps) {
  return (
    <div
      className={`bg-bg-tertiary rounded-lg animate-pulse ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** Skeleton that mimics a stat card */
export function SkeletonCard() {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-10 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
