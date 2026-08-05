import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardScreenLoading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Topbar skeleton */}
      <div
        className="flex h-11 shrink-0 items-center gap-3 px-4"
        style={{ background: "#1A1C23", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Skeleton className="size-7 rounded-md bg-white/10" />
        <Skeleton className="h-4 w-px bg-white/10" />
        <Skeleton className="h-5 w-48 bg-white/10" />
        <div className="flex-1" />
        <Skeleton className="h-7 w-24 rounded-full bg-white/10" />
        <Skeleton className="h-7 w-16 rounded-md bg-white/10" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-end justify-between border-b pb-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-32 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Summary card */}
          <Skeleton className="h-36 w-full rounded-2xl" />

          {/* Charts row 1 */}
          <div className="grid gap-4 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>

          {/* Charts row 2 */}
          <div className="grid gap-4 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
