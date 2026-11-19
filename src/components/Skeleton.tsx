export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-black/10 rounded ${className}`}
    />
  );
}

export function SkeletonLine({ width = '100%', className = '' }: { width?: string; className?: string }) {
  return (
    <div
      className={`animate-pulse bg-black/10 h-4 rounded w-[${width}] ${className}`}
    />
  );
}
