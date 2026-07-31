"use client";

import { useState } from "react";
import { useDashboardFilter } from "./dashboard-filter-context";

const TONE_COLOR: Record<string, string> = {
  red: "hsl(var(--primary))",
  dark: "hsl(222 47% 32%)",
  muted: "hsl(215 20% 65%)",
};

type Row = {
  label: string;
  value: number | string;
  percent: number;
  tone?: "red" | "dark" | "muted";
  tooltip?: string;
  /** Value emitted to cross-filter context when row is clicked. Defaults to label. */
  filterValue?: string;
};

export function HorizontalBars({
  rows,
  showPercent = true,
  /** Cross-filter dimension this widget represents (e.g. "cliente", "obra"). */
  filterDimension,
}: {
  rows: Row[];
  showPercent?: boolean;
  filterDimension?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { setFilter, getActive, hasAnyFilter } = useDashboardFilter();

  const activeValue = filterDimension ? getActive(filterDimension) : null;
  const hasLocalFilter = filterDimension !== undefined && activeValue !== null;

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const color = TONE_COLOR[row.tone ?? "red"];
        const isHovered = hovered === row.label;
        const filterVal = row.filterValue ?? row.label;
        const isSelected = hasLocalFilter && activeValue === filterVal;
        const isDimmed = hasLocalFilter && !isSelected;
        const isClickable = !!filterDimension;
        const tooltipText = row.tooltip ?? (typeof row.value === "string" ? row.value : null);

        return (
          <div
            key={row.label}
            className={`group relative transition-opacity ${isDimmed ? "opacity-35" : "opacity-100"}`}
            onMouseEnter={() => setHovered(row.label)}
            onMouseLeave={() => setHovered(null)}
            onClick={isClickable ? () => setFilter(filterDimension!, filterVal, row.label) : undefined}
            style={{ cursor: isClickable ? "pointer" : undefined }}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={`truncate text-[12px] transition-colors ${isHovered || isSelected ? "text-card-foreground font-semibold" : "text-muted-foreground"}`}>
                {row.label}
              </span>
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-[12px] font-bold text-card-foreground">{row.value}</span>
                {showPercent && (
                  <span className="min-w-[36px] text-right text-[11px] font-semibold text-muted-foreground">
                    {row.percent}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${Math.max(row.percent, 2)}%`,
                  background: color,
                  opacity: isHovered || isSelected ? 1 : 0.8,
                  boxShadow: isSelected ? `0 0 0 1px ${color}` : undefined,
                }}
              />
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute -left-2 top-0 h-full w-1 rounded-full" style={{ background: color }} />
            )}

            {/* Hover tooltip */}
            {isHovered && tooltipText && (
              <div className="pointer-events-none absolute -top-8 left-0 z-20 rounded-md border bg-card px-2.5 py-1 text-[11px] shadow-md">
                <span className="font-semibold text-card-foreground">{row.label}</span>
                <span className="ml-2 tabular-nums text-muted-foreground">{tooltipText}</span>
                {showPercent && <span className="ml-1 text-muted-foreground">· {row.percent}%</span>}
                {isClickable && (
                  <span className="ml-2 text-primary">{isSelected ? "Clique para remover filtro" : "Clique para filtrar"}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
