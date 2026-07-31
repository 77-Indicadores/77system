"use client";

import { useDashboardFilter } from "./dashboard-filter-context";

export type MatrixRow = {
  id: string;
  label: string;
  values: Record<string, number>;
  total?: number;
  isGroup?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  highlight?: "positive" | "negative" | "neutral";
  drillable?: boolean;
  /** Value emitted to cross-filter on click. Defaults to row.label. */
  filterValue?: string;
};

export type MatrixColumn = {
  id: string;
  label: string;
  showMoM?: boolean;
};

type Props = {
  columns: MatrixColumn[];
  rows: MatrixRow[];
  formatValue?: (v: number) => string;
  onDrill?: (row: MatrixRow) => void;
  /** Cross-filter dimension emitted when a drillable row is clicked (e.g. "obra", "conta"). */
  filterDimension?: string;
};

const defaultFormat = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

function mom(curr: number, prev: number | undefined): string {
  if (prev == null || prev === 0) return "—";
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function momColor(curr: number, prev: number | undefined): string {
  if (prev == null || prev === 0) return "text-muted-foreground";
  return curr >= prev ? "text-green-600" : "text-primary";
}

export function MatrixTable({ columns, rows, formatValue, onDrill, filterDimension }: Props) {
  const fmt = formatValue ?? ((v: number) => defaultFormat.format(v));
  const hasMoM = columns.some((c) => c.showMoM);
  const { setFilter, getActive, isActive } = useDashboardFilter();

  const activeValue = filterDimension ? getActive(filterDimension) : null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b">
            <th className="sticky left-0 bg-card py-2 pl-2 pr-4 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Conta
            </th>
            {columns.map((col, i) => (
              <th key={col.id} className="py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {col.label}
                {hasMoM && col.showMoM && i > 0 && (
                  <span className="ml-1 text-[9px] font-semibold text-muted-foreground/60">AH%</span>
                )}
              </th>
            ))}
            <th className="py-2 text-right text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.isGroup) {
              return (
                <tr key={row.id} className="border-b bg-muted/40">
                  <td colSpan={columns.length + 2} className="py-2 pl-2 text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                    {row.label}
                  </td>
                </tr>
              );
            }

            const filterVal = row.filterValue ?? row.label;
            const isClickable = (!!onDrill && row.drillable) || (!!filterDimension && !row.isTotal && !row.isSubtotal);
            const isSelected = filterDimension ? isActive(filterDimension, filterVal) : false;
            const isDimmed = activeValue !== null && !isSelected && !row.isTotal && !row.isSubtotal && !row.isGroup;

            const totalVal = row.total ?? columns.reduce((s, c) => s + (row.values[c.id] ?? 0), 0);

            const highlightClass =
              row.isTotal
                ? "bg-[hsl(222_47%_20%)] text-white font-black"
                : row.isSubtotal
                  ? "bg-muted/10 font-bold border-b-2"
                  : row.highlight === "positive"
                    ? "text-green-700"
                    : row.highlight === "negative"
                      ? "text-primary"
                      : "";

            function handleClick() {
              if (filterDimension && !row.isTotal && !row.isSubtotal) {
                setFilter(filterDimension, filterVal, row.label);
              }
              if (onDrill && row.drillable) onDrill(row);
            }

            return (
              <tr
                key={row.id}
                onClick={isClickable ? handleClick : undefined}
                className={`border-b transition-opacity ${highlightClass} ${isDimmed ? "opacity-35" : ""} ${isSelected ? "ring-1 ring-inset ring-primary/30" : ""} ${isClickable ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/20"}`}
              >
                <td className={`sticky left-0 py-1.5 pl-4 pr-4 ${row.isTotal ? "bg-[hsl(222_47%_20%)]" : "bg-card"}`}>
                  {row.isSubtotal ? <span className="font-bold">{row.label}</span> : row.label}
                </td>
                {columns.map((col, i) => {
                  const v = row.values[col.id] ?? 0;
                  const prev = i > 0 ? row.values[columns[i - 1].id] : undefined;
                  return (
                    <td key={col.id} className="py-1.5 text-right tabular-nums">
                      {fmt(v)}
                      {hasMoM && col.showMoM && i > 0 && (
                        <span className={`ml-1 text-[10px] ${momColor(v, prev)}`}>{mom(v, prev)}</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-1.5 text-right font-bold tabular-nums">{fmt(totalVal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
