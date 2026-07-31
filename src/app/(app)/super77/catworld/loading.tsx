import { Skeleton } from "@/components/ui/skeleton";

export default function CatworldLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-20 rounded-md" />
        <Skeleton className="h-3 w-56" />
      </div>
    </div>
  );
}
