import { Skeleton } from "@/components/ui/skeleton";

export default function RegistryDetailLoading() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="mt-1 size-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <Skeleton className="h-4 w-28 mb-4" />
        <div className="grid gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
          <Skeleton className="h-10 rounded-md" />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-5 py-4">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
