"use client";

import { useRef, useEffect, useState, useCallback } from "react";

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

type TooltipState = {
  idx: number;
  screenX: number;
  screenY: number;
} | null;

type Props =
  | { points: TrendPoint[]; series?: never; framed?: boolean }
  | { series: TrendSeries[]; points?: never; framed?: boolean };

export function LineTrendCard(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState(900);
  const [tooltip, setTooltip] = useState<TooltipState>(null);

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svgEl = svgRef.current;
      if (!svgEl || xLabels.length === 0) return;
      const rect = svgEl.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
      const total = xLabels.length;
      const idx = Math.max(
        0,
        Math.min(Math.round(((mouseX - paddingX) / plotW) * (total - 1)), total - 1)
      );
      // Convert SVG coords to rendered pixel coords (for tooltip positioning)
      const svgX = cx(idx, total);
      const minY = Math.min(...series.map((s) => cy(s.points[idx]?.value ?? min)));
      const screenX = (svgX / svgWidth) * rect.width;
      const screenY = (minY / viewH) * rect.height;
      setTooltip({ idx, screenX, screenY });
    },
    [svgWidth, xLabels.length, plotW, paddingX, series, min]
  );

  const chart = (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        className="h-[220px] w-full overflow-visible"
        viewBox={`0 0 ${svgWidth} ${viewH}`}
        role="img"
        aria-label="Gráfico de tendência"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid + Y labels */}
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

        {/* Crosshair vertical line on hover */}
        {tooltip !== null && (
          <line
            x1={cx(tooltip.idx, xLabels.length)}
            x2={cx(tooltip.idx, xLabels.length)}
            y1={paddingTop}
            y2={viewH - paddingBottom}
            stroke="hsl(215 20% 70%)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {/* Series */}
        {series.map((s, si) => {
          const color = s.color ?? SERIES_COLORS[si % SERIES_COLORS.length];
          const coords = s.points.map((p, i) => ({ ...p, x: cx(i, s.points.length), y: cy(p.value) }));
          const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

          return (
            <g key={s.id}>
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
                const isHovered = tooltip?.idx === i;
                const showLabel = (isLast || isPeak) && c.value !== 0 && !isHovered;
                return (
                  <g key={c.id}>
                    <circle
                      cx={c.x}
                      cy={c.y}
                      fill="hsl(var(--card))"
                      r={isHovered ? 6 : multiSeries ? 3.5 : 5}
                      stroke={color}
                      strokeWidth={isHovered ? 3 : 2.5}
                    />
                    {showLabel && (
                      <text fill="hsl(var(--card-foreground))" fontSize="11" fontWeight="800" textAnchor="middle" x={c.x} y={Math.max(c.y - 11, 14)}>
                        {compactCurrency.format(c.value)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* X labels */}
        {xLabels.map((p, i) => (
          <text
            key={p.id}
            fill={tooltip?.idx === i ? "hsl(var(--card-foreground))" : "hsl(var(--muted-foreground))"}
            fontSize="11"
            fontWeight={tooltip?.idx === i ? "800" : "600"}
            textAnchor="middle"
            x={cx(i, xLabels.length)}
            y={viewH - 6}
          >
            {p.label}
          </text>
        ))}
      </svg>

      {/* Tooltip overlay */}
      {tooltip !== null && (
        <div
          className="pointer-events-none absolute z-20 min-w-[120px] rounded-md border bg-card px-3 py-2 shadow-lg"
          style={{
            left: Math.min(tooltip.screenX + 12, svgWidth - 140),
            top: Math.max(tooltip.screenY - 16, 0),
          }}
        >
          <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">
            {xLabels[tooltip.idx]?.label}
          </p>
          {series.map((s, si) => {
            const color = s.color ?? SERIES_COLORS[si % SERIES_COLORS.length];
            const v = s.points[tooltip.idx]?.value;
            if (v == null) return null;
            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full" style={{ background: color }} />
                {multiSeries && (
                  <span className="text-[11px] text-muted-foreground">{s.label}</span>
                )}
                <span className="ml-auto text-[12px] font-black tabular-nums text-card-foreground">
                  {compactCurrency.format(v)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend — multi-series only */}
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
  return <section className="rounded-lg border bg-card p-4">{chart}</section>;
}
