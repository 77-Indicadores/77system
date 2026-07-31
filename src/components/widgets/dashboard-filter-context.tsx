"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type CrossFilter = {
  dimension: string; // e.g. "empresa", "cliente", "obra"
  value: string;     // e.g. "INFRATECH SP"
  label?: string;    // display label (defaults to value)
};

type DashboardFilterCtx = {
  filters: CrossFilter[];
  /** Toggle a filter on/off. Clicking the same value again clears it. */
  setFilter: (dimension: string, value: string, label?: string) => void;
  clearFilter: (dimension: string) => void;
  clearAll: () => void;
  /** Returns the active value for a dimension, or null if no filter. */
  getActive: (dimension: string) => string | null;
  /** True if this specific value is the active filter for its dimension. */
  isActive: (dimension: string, value: string) => boolean;
  /** True if any dimension has a cross-filter active. */
  hasAnyFilter: boolean;
};

const Ctx = createContext<DashboardFilterCtx | null>(null);

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<CrossFilter[]>([]);

  const setFilter = useCallback((dimension: string, value: string, label?: string) => {
    setFilters((prev) => {
      const existing = prev.find((f) => f.dimension === dimension);
      // Toggle off if same value
      if (existing?.value === value) return prev.filter((f) => f.dimension !== dimension);
      return [...prev.filter((f) => f.dimension !== dimension), { dimension, value, label: label ?? value }];
    });
  }, []);

  const clearFilter = useCallback((dimension: string) => {
    setFilters((prev) => prev.filter((f) => f.dimension !== dimension));
  }, []);

  const clearAll = useCallback(() => setFilters([]), []);

  const getActive = useCallback(
    (dimension: string) => filters.find((f) => f.dimension === dimension)?.value ?? null,
    [filters]
  );

  const isActive = useCallback(
    (dimension: string, value: string) =>
      filters.some((f) => f.dimension === dimension && f.value === value),
    [filters]
  );

  return (
    <Ctx.Provider value={{ filters, setFilter, clearFilter, clearAll, getActive, isActive, hasAnyFilter: filters.length > 0 }}>
      {children}
    </Ctx.Provider>
  );
}

/**
 * Hook to read/write cross-filters from any widget.
 * Safe to call outside DashboardFilterProvider — returns no-op context
 * so widgets work standalone without a provider.
 */
export function useDashboardFilter(): DashboardFilterCtx {
  return (
    useContext(Ctx) ?? {
      filters: [],
      setFilter: () => {},
      clearFilter: () => {},
      clearAll: () => {},
      getActive: () => null,
      isActive: () => false,
      hasAnyFilter: false,
    }
  );
}
