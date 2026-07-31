import { cn } from "@/lib/utils";

export function MetricHeroCard({
  label,
  value,
  helper,
  tone = "default"
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "red" | "blue" | "orange";
}) {
  return (
    <section
      className={cn(
        "rounded-lg border bg-white p-4 text-foreground shadow-sm",
        tone === "red" && "bg-red-500/15",
        tone === "blue" && "bg-blue-500/15",
        tone === "orange" && "bg-amber-500/15"
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <strong className="mt-4 block text-2xl leading-tight">{value}</strong>
      <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">{helper}</p>
    </section>
  );
}
