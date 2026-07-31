export function DistributionCard({
  title,
  rows
}: {
  title: string;
  rows: Array<{ label: string; value: number; total: number }>;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-5 space-y-4">
        {rows.map((row) => {
          const percent = row.total > 0 ? (row.value / row.total) * 100 : 0;
          return (
            <div className="grid grid-cols-[120px_1fr_72px] items-center gap-3 text-sm" key={row.label}>
              <span className="truncate text-muted-foreground">{row.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
              </div>
              <strong className="text-right">{row.value}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
