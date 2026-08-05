import { getFreshnessStatus } from "@/domains/data/freshness";

const config = {
  fresh:   { label: "Atualizado",    dot: "bg-green-400",  className: "border-white/10 bg-white/[8%] text-green-400" },
  stale:   { label: "Desatualizado", dot: "bg-amber-400",  className: "border-white/10 bg-white/[8%] text-amber-400" },
  expired: { label: "Expirado",      dot: "bg-red-400",    className: "border-white/10 bg-white/[8%] text-red-400" },
  missing: { label: "Sem dados",     dot: "bg-white/30",   className: "border-white/10 bg-white/[8%] text-white/50" },
};

export function FreshnessBadge({
  updatedAt,
  freshnessSeconds = 900,
}: {
  updatedAt: Date | null;
  freshnessSeconds?: number;
}) {
  const status = getFreshnessStatus(updatedAt, freshnessSeconds);
  const { label, className, dot } = config[status];

  const timeLabel = updatedAt
    ? updatedAt.toLocaleString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
        timeZone: "America/Sao_Paulo",
      })
    : null;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      <span className={`size-1.5 rounded-full ${dot}`} />
      {label}
      {timeLabel ? <span className="font-normal opacity-60">· {timeLabel}</span> : null}
    </span>
  );
}
