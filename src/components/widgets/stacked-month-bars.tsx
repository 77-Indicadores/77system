const SERIES = [
  { key: "a" as const, label: "Principal", color: "hsl(var(--primary))" },
  { key: "b" as const, label: "Secundário", color: "hsl(222 47% 32%)" },
  { key: "c" as const, label: "Terciário", color: "hsl(215 20% 65%)" },
];

export function StackedMonthBars({
  rows
}: {
  rows: Array<{ label: string; a: number; b: number; c: number }>;
}) {
  const max = Math.max(...rows.map((row) => row.a + row.b + row.c), 1);
  const chartH = 160;

  return (
    <div>
      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end justify-around gap-2 pt-1" style={{ height: chartH + 28 }}>
        {rows.map((row) => {
          const total = row.a + row.b + row.c;
          const safeTotal = Math.max(total, 1);
          const barH = Math.max((total / max) * (chartH - 24), 8);
          return (
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1" key={row.label}>
              <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{total}</span>
              <div
                className="flex w-full max-w-[28px] flex-col-reverse overflow-hidden rounded-sm"
                style={{ height: barH, gap: "1px", background: "hsl(var(--muted))" }}
              >
                {SERIES.map((s) => (
                  <div
                    key={s.key}
                    style={{
                      height: `${(row[s.key] / safeTotal) * 100}%`,
                      background: s.color,
                      minHeight: row[s.key] > 0 ? 2 : 0,
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">{row.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
