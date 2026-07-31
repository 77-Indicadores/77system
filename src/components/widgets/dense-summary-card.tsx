export function DenseSummaryCard({
  title,
  subtitle,
  badge,
  stats,
  tiles
}: {
  title: string;
  subtitle: string;
  badge?: string;
  stats: Array<{ label: string; value: string }>;
  tiles: Array<{ label: string; value: string; helper: string; tone?: "red" | "dark" | "muted" }>;
}) {
  return (
    <section className="rounded-2xl bg-[linear-gradient(120deg,#090909,#1a090b_55%,#4a0711)] p-5 text-white shadow-sm">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.25fr]">
        <div>
          {badge ? (
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">{badge}</span>
          ) : null}
          <h2 className="mt-4 text-xl font-black">{title}</h2>
          <p className="text-sm text-white/65">{subtitle}</p>
          <div className="mt-5 flex flex-wrap items-end gap-x-10 gap-y-5">
            {stats.map((stat, index) => (
              <div key={stat.label} className={index === 0 ? "min-w-0 flex-1 basis-full sm:basis-auto" : ""}>
                <strong className="block text-3xl font-black leading-none tabular-nums 2xl:text-4xl">{stat.value}</strong>
                <span className="mt-2 block text-xs text-white/65">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {tiles.map((tile) => (
            <div
              className="rounded-lg border border-white/12 bg-white/6 p-4 shadow-sm"
              key={tile.label}
            >
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/60">{tile.label}</p>
              <strong className="mt-2 block break-words text-xl font-black leading-tight 2xl:text-2xl">{tile.value}</strong>
              <p className="mt-2 text-xs text-white/55">{tile.helper}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
