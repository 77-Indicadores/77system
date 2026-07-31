type Point = {
  id: string;
  label: string;
  value: number;
};

const compactCurrency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  notation: "compact",
  style: "currency"
});

export function LineTrendCard({ points, framed = false }: { points: Point[]; framed?: boolean }) {
  const width = 900;
  const height = 240;
  const paddingX = 54;
  const paddingTop = 42;
  const paddingBottom = 38;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const coordinates = points.map((point, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / Math.max(points.length - 1, 1);
    const y = height - paddingBottom - ((point.value - min) / range) * (height - paddingTop - paddingBottom);
    return { ...point, x, y };
  });
  const path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${coordinates.at(-1)?.x ?? paddingX} ${height - paddingBottom} L ${paddingX} ${height - paddingBottom} Z`;

  const chart = (
      <svg className="h-[220px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolucao mensal da receita">
        {[0, 1, 2, 3].map((line) => {
          const y = paddingTop + (line * (height - paddingTop - paddingBottom)) / 3;
          return <line key={line} stroke="hsl(215 20% 88%)" strokeWidth="1" x1={paddingX} x2={width - paddingX} y1={y} y2={y} />;
        })}
        <path d={area} fill="hsl(var(--primary) / 0.08)" />
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeWidth="3" />
        {coordinates.map((point) => (
          <g key={point.id}>
            <circle cx={point.x} cy={point.y} fill="hsl(var(--card))" r="5" stroke="hsl(var(--primary))" strokeWidth="2.5" />
            <text fill="hsl(var(--card-foreground))" fontSize="11" fontWeight="800" textAnchor="middle" x={point.x} y={Math.max(point.y - 11, 14)}>
              {compactCurrency.format(point.value)}
            </text>
            <text fill="hsl(var(--muted-foreground))" fontSize="11" fontWeight="600" textAnchor="middle" x={point.x} y={height - 6}>
              {point.label}
            </text>
          </g>
        ))}
      </svg>
  );

  if (!framed) return chart;

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[13px] font-bold text-card-foreground">Evolucao mensal da receita</h2>
          <p className="text-[11px] text-muted-foreground">Dados materializados por competencia</p>
        </div>
        <span className="rounded-full border bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">últimos {points.length} meses</span>
      </div>
      {chart}
    </section>
  );
}
