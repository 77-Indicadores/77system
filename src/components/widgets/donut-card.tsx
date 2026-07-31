export function DonutCard({ value, label, caption }: { value: number; label: string; caption: string }) {
  const pct = Math.max(0, Math.min(value, 100));
  const r = 34;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;

  const toneColor = pct >= 80 ? "hsl(142 71% 45%)" : pct >= 50 ? "hsl(38 92% 50%)" : "hsl(var(--primary))";

  return (
    <div className="flex items-center gap-5">
      {/* Ring */}
      <div className="relative shrink-0">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={r}
            fill="none"
            stroke={toneColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeDashoffset={circ * 0.25}
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <strong className="text-[18px] font-black leading-none tabular-nums">{pct.toFixed(1)}%</strong>
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0">
        <p className="text-[13px] font-bold leading-tight text-card-foreground">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{caption}</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: toneColor, transition: "width 0.6s ease" }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">{pct.toFixed(0)}/100</span>
        </div>
      </div>
    </div>
  );
}
