const TONE_COLOR: Record<string, string> = {
  red: "hsl(var(--primary))",
  dark: "hsl(222 47% 32%)",
  muted: "hsl(215 20% 65%)",
};

export function HorizontalBars({
  rows,
  showPercent = true
}: {
  rows: Array<{ label: string; value: number | string; percent: number; tone?: "red" | "dark" | "muted" }>;
  showPercent?: boolean;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const color = TONE_COLOR[row.tone ?? "red"];
        return (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-[12px] text-muted-foreground">{row.label}</span>
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-[12px] font-bold text-card-foreground">{row.value}</span>
                {showPercent && (
                  <span className="min-w-[36px] text-right text-[11px] font-semibold text-muted-foreground">{row.percent}%</span>
                )}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(row.percent, 2)}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
