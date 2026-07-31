"use client";

import { X, Filter } from "lucide-react";
import { useDashboardFilter } from "./dashboard-filter-context";

/**
 * Drop this anywhere inside a DashboardFilterProvider to show active cross-filters
 * as dismissible chips. Renders nothing when no filter is active.
 */
export function FilterChipBar() {
  const { filters, clearFilter, clearAll } = useDashboardFilter();
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        <Filter className="h-3 w-3" />
        Filtro ativo:
      </span>
      {filters.map((f) => (
        <button
          key={`${f.dimension}:${f.value}`}
          type="button"
          onClick={() => clearFilter(f.dimension)}
          className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          <span className="text-primary/60">{f.dimension}:</span>
          {f.label ?? f.value}
          <X className="h-3 w-3 opacity-60" />
        </button>
      ))}
      {filters.length > 1 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-[11px] font-semibold text-muted-foreground underline-offset-2 hover:text-card-foreground hover:underline"
        >
          Limpar todos
        </button>
      )}
    </div>
  );
}
