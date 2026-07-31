import { cn } from "@/lib/utils";

export function KpiCard({ label, value, trend, tone = "default" }: { label: string; value: string; trend: string; tone?: "default" | "warning" }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <strong className="text-2xl font-black tabular-nums text-card-foreground">{value}</strong>
        <span className={cn("mb-0.5 text-[12px] font-semibold", tone === "warning" ? "text-destructive" : "text-primary")}>{trend}</span>
      </div>
    </section>
  );
}
