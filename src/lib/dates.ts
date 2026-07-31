/**
 * Defensive ERP date parser.
 *
 * ERP/BI exports often carry Excel serial numbers, regional strings (dd/mm/yyyy),
 * compact strings (yyyymmdd, ddmmyyyy), or plain ISO. new Date(raw) is banned
 * here because it silently accepts numbers like 46000 as milliseconds,
 * returning a date in 1970, and strings like "abr.65" as garbage.
 *
 * Returns null for anything it cannot parse safely.
 */

const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30)).getTime();

export function parseErpDate(raw: unknown): Date | null {
  if (raw == null) return null;

  // Excel serial number (integer 1-99999 — covers 1900-2173)
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 99999) {
    return new Date(EXCEL_EPOCH + raw * 86400000);
  }

  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  // ISO: 2024-03-15 or 2024-03-15T...
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isValid(d) ? d : null;
  }

  // dd/mm/yyyy or dd/mm/yy
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (dmy) {
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += year >= 50 ? 1900 : 2000;
    const d = new Date(Date.UTC(year, parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)));
    return isValid(d) ? d : null;
  }

  // yyyymmdd
  if (/^\d{8}$/.test(s)) {
    const d = new Date(Date.UTC(parseInt(s.slice(0, 4), 10), parseInt(s.slice(4, 6), 10) - 1, parseInt(s.slice(6, 8), 10)));
    return isValid(d) ? d : null;
  }

  // ddmmyyyy
  if (/^\d{8}$/.test(s)) {
    const d = new Date(Date.UTC(parseInt(s.slice(4, 8), 10), parseInt(s.slice(2, 4), 10) - 1, parseInt(s.slice(0, 2), 10)));
    return isValid(d) ? d : null;
  }

  return null;
}

function isValid(d: Date): boolean {
  return !isNaN(d.getTime()) && d.getFullYear() >= 1990 && d.getFullYear() <= 2100;
}

/** Returns the most recent year ≤ current year present in an array of year numbers. */
export function defaultYear(years: number[]): number {
  const now = new Date().getFullYear();
  const past = years.filter((y) => y <= now).sort((a, b) => b - a);
  return past[0] ?? years[years.length - 1] ?? now;
}
