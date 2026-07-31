"use client";

import { useRef, useEffect, useState } from "react";

export type TrendPoint = {
  id: string;
  label: string;
  value: number;
};

export type TrendSeries = {
  id: string;
  label: string;
  points: TrendPoint[];
  color?: string;
};

// Fixed categorical order — never cycle
const SERIES_COLORS = [
  "hsl(var(--primary))",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(199 89% 48%)",
];

const compactCurrency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  notation: "compact",
  style: "currency",
});

// Single-series: pass points. Multi-series: pass series array.
type Props =
  | { points: TrendPoint[]; series?: never; framed?: boolean }
  | { series: TrendSeries[]; points?: never; framed?: boolean };

export function LineTrendCard(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(900);

  // Responsive width via ResizeObserver — fixes SVG clipping on narrow cards
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setSvgWidth(Math.round(w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const series: TrendSeries[] =
    props.series ?? [{ id: "default", label: "", points: props.points ?? [] }];

  const multiSeries = series.length > 1;
  const allValues = series.flatMap((s) => s.points.map((p) => p.value));
  const min = allValues.length ? Math.min(...allValues) : 0;
  const max = allValues.length ? Math.max(...allValues) : 1;
  const range = Math.max(max - min, 1);

  const viewH = 240;
  const paddingX = 54;
  const paddingTop = 42;
  const paddingBottom = 38;
  const plotW = svgWidth - paddingX * 2;
  const plotH = viewH - paddingTop - paddingBottom;

  const xLabels = series[0]?.points ?? [];

  function cx(index: number, total: number) {
    return paddingX + (index * plotW) / Math.max(total - 1, 1);
  }
  function cy(value: number) {
    return viewH - paddingBottom - ((value - min) / range) * plotH;
  }

  const chart = (
    <div ref={containerRef} className="w-full">
      <svg
        className="h-[220px] w-full overflow-visible"
        viewBox={`0 0 ${svgWidth} ${viewH}`}
        role="img"
        aria-label="Gráfico de tendência"
      >
        {/* Horizontal grid + Y labels */}
        {[0, 1, 2, 3].map((i) => {
          const y = paddingTop + (i * plotH) / 3;
          const v = max - (i * range) / 3;
          return (
            <g key={i}>
              <line stroke="hsl(215 20% 88%)" strokeWidth="1" x1={paddingX} x2={svgWidth - paddingX} y1={y} y2={y} />
              <text fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="end" x={paddingX - 4} y={y + 4}>
                {compactCurrency.format(v)}
              </text>
            </g>
          );
        })}

        {/* Series lines */}
        {series.map((s, si) => {
          const color = s.color ?? SERIES_COLORS[si % SERIES_COLORS.length];
          const coords = s.points.map((p, i) => ({ ...p, x: cx(i, s.points.length), y: cy(p.value) }));
          const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

          return (
            <g key={s.id}>
              {/* Area fill only for single series */}
              {!multiSeries && (
                <path
                  d={`${path} L ${coords.at(-1)?.x ?? paddingX} ${viewH - paddingBottom} L ${paddingX} ${viewH - paddingBottom} Z`}
                  fill={color}
                  fillOpacity="0.08"
                />
              )}
              <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeWidth={multiSeries ? 2.5 : 3} />
              {coords.map((c, i) => {
                const isLast = i === coords.length - 1;
                const isPeak = c.value === max;
                // Only label last point + global peak to avoid clutter
                const showLabel = (isLast || isPeak) && c.value !== 0;
                return (
                  <g key={c.id}>
                    <circle cx={c.x} cy={c.y} fill="hsl(var(--card))" r={multiSeries ? 3.5 : 5} stroke={color} strokeWidth="2.5" />
                    {showLabel && (
                      <text
                        fill="hsl(var(--card-foreground))"
                        fontSize="11"
                        fontWeight="800"
                        textAnchor="middle"
                        x={c.x}
                        y={Math.max(c.y - 11, 14)}
                      >
                        {compactCurrency.format(c.value)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* X-axis labels */}
        {xLabels.map((p, i) => (
          <text
            key={p.id}
            fill="hsl(var(--muted-foreground))"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            x={cx(i, xLabels.length)}
            y={viewH - 6}
          >
            {p.label}
          </text>
        ))}
      </svg>

      {/* Legend — only for multi-series */}
      {multiSeries && (
        <div className="mt-2 flex flex-wrap gap-3 px-1">
          {series.map((s, si) => {
            const color = s.color ?? SERIES_COLORS[si % SERIES_COLORS.length];
            return (
              <div key={s.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-block h-2 w-5 rounded-full" style={{ background: color }} />
                {s.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (!props.framed) return chart;

  return (
    <section className="rounded-lg border bg-card p-4">
      {chart}
    </section>
  );
}
