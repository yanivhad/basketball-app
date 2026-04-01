export function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-gray-700 rounded-xl ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-brand-card rounded-2xl p-5 space-y-3">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-10 w-full mt-2" />
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="bg-brand-card rounded-2xl p-4 flex items-center gap-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-8 w-10" />
    </div>
  );
}