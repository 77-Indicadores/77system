import { Skeleton } from "@/components/ui/skeleton";

export default function Super77DataLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-8 w-36 rounded-md" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-16 rounded-md" />
              ))}
            </div>
            <Skeleton className="h-32 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
