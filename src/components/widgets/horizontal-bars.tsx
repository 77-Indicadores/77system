"use client";

import { useState } from "react";

const TONE_COLOR: Record<string, string> = {
  red: "hsl(var(--primary))",
  dark: "hsl(222 47% 32%)",
  muted: "hsl(215 20% 65%)",
};

export function HorizontalBars({
  rows,
  showPercent = true,
}: {
  rows: Array<{ label: string; value: number | string; percent: number; tone?: "red" | "dark" | "muted"; tooltip?: string }>;
  showPercent?: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const color = TONE_COLOR[row.tone ?? "red"];
        const isHovered = hovered === row.label;
        const tooltipText = row.tooltip ?? (typeof row.value === "string" ? row.value : null);

        return (
          <div
            key={row.label}
            className="group relative"
            onMouseEnter={() => setHovered(row.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={`truncate text-[12px] transition-colors ${isHovered ? "text-card-foreground" : "text-muted-foreground"}`}>
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
                  opacity: isHovered ? 1 : 0.8,
                }}
              />
            </div>

            {/* Tooltip */}
            {isHovered && tooltipText && (
              <div className="pointer-events-none absolute -top-8 left-0 z-20 rounded-md border bg-card px-2.5 py-1 text-[11px] shadow-md">
                <span className="font-semibold text-card-foreground">{row.label}</span>
                <span className="ml-2 tabular-nums text-muted-foreground">{tooltipText}</span>
                {showPercent && (
                  <span className="ml-1 text-muted-foreground">· {row.percent}%</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
