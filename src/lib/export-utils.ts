"use client";

/**
 * Client-side Excel export utilities.
 *
 * Use these to export the exact filtered slice the user is looking at,
 * not a server-side full dump.
 *
 * Requires: pnpm add -w xlsx
 */
import * as XLSX from "xlsx";

export type ExportColumn<T> = {
  header: string;
  key: keyof T;
  format?: (value: T[keyof T]) => string | number;
};

export function exportToExcel<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = "Dados"
) {
  const data = rows.map((row) =>
    Object.fromEntries(
      columns.map(({ header, key, format }) => [
        header,
        format ? format(row[key]) : (row[key] ?? ""),
      ])
    )
  );

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto column widths
  const colWidths = columns.map(({ header, key }) => ({
    wch: Math.max(
      header.length,
      ...rows.map((r) => String(r[key] ?? "").length)
    ),
  }));
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const safeFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}

/** Convenience: export a flat array of objects with auto-detected columns */
export function exportSimple(
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = "Dados"
) {
  if (rows.length === 0) return;
  const cols = Object.keys(rows[0]).map((k) => ({
    header: k,
    key: k as keyof typeof rows[0],
  }));
  exportToExcel(rows, cols, filename, sheetName);
}
