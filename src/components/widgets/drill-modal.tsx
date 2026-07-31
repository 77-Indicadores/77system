"use client";

import { useEffect } from "react";
import { X, Download } from "lucide-react";
import { exportSimple } from "@/lib/export-utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** KPI chips shown in the modal header */
  chips?: Array<{ label: string; value: string; tone?: "up" | "down" | "neutral" }>;
  /** Column definitions for the detail table */
  columns: Array<{ key: string; header: string; align?: "left" | "right" }>;
  /** Flat rows — values must be string or number */
  rows: Record<string, string | number>[];
  exportFilename?: string;
};

const TONE_CLASS: Record<string, string> = {
  up: "text-green-600 dark:text-green-400",
  down: "text-primary",
  neutral: "text-card-foreground",
};

export function DrillModal({ open, onClose, title, subtitle, chips, columns, rows, exportFilename }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[86vh] w-[min(860px,94vw)] flex-col overflow-hidden rounded-xl border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-black text-card-foreground">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
            {chips && chips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-4">
                {chips.map((chip) => (
                  <div key={chip.label} className="text-[11px] text-muted-foreground">
                    <span className={`block text-[14px] font-black tabular-nums ${TONE_CLASS[chip.tone ?? "neutral"]}`}>
                      {chip.value}
                    </span>
                    {chip.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {exportFilename && rows.length > 0 && (
              <button
                type="button"
                onClick={() => exportSimple(rows as Record<string, unknown>[], exportFilename)}
                className="flex h-8 items-center gap-1.5 rounded-md border bg-muted px-3 text-[12px] font-semibold text-muted-foreground hover:bg-muted/70"
              >
                <Download className="h-3.5 w-3.5" />
                Excel
              </button>
            )}
            <button
              type="button"
              aria-label="Fechar"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-5 pb-4 pt-2">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted-foreground">Sem registros para este recorte.</p>
          ) : (
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`sticky top-0 bg-card py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground ${col.align === "right" ? "text-right" : "text-left"}`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-1.5 tabular-nums ${col.align === "right" ? "text-right" : "text-left"}`}
                      >
                        {row[col.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
