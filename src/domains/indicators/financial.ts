import { prisma } from "@/lib/prisma";
import { computeMetric } from "@/domains/indicators/metrics";
import { getCurrentUserScopeMap, shouldBypassDataScope } from "@/domains/rbac/scope";

const ANALYTIC_SCOPE_FIELDS = {
  empresa: "empresa",
  filial: "filial",
  obra: "obra",
  correntista: "correntista",
  departamento: "departamento",
} as const;

export type FinancialRevenueRow = {
  id: string;
  date: Date;
  revenue: number;
  customerCount: number;
  empresa: string | null;
  departamento: string | null;
  updatedAt: Date;
};

function uniqueSorted(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

function applyAnalyticScope(rows: FinancialRevenueRow[], scopeMap: Record<string, string[]>, canBypass: boolean) {
  if (canBypass) return rows;

  let scopedRows = rows;
  let appliedScope = 0;

  for (const [dimension, field] of Object.entries(ANALYTIC_SCOPE_FIELDS)) {
    const datasetValues = uniqueSorted(
      scopedRows.map((row) => row[field as keyof FinancialRevenueRow] as string | null | undefined)
    );
    if (datasetValues.length === 0) continue;

    const allowedValues = scopeMap[dimension] ?? [];
    if (allowedValues.length === 0) continue;

    appliedScope += 1;
    scopedRows = scopedRows.filter((row) => {
      const value = row[field as keyof FinancialRevenueRow];
      return typeof value === "string" && allowedValues.includes(value);
    });
  }

  return appliedScope > 0 ? scopedRows : [];
}

export async function getFinancialRevenueSummary() {
  const [rows, scopeMap, canBypass] = await Promise.all([
    prisma.financialRevenueMetric.findMany({
      orderBy: [{ date: "asc" }, { empresa: "asc" }, { departamento: "asc" }],
    }),
    getCurrentUserScopeMap(),
    shouldBypassDataScope(),
  ]);

  const normalized: FinancialRevenueRow[] = rows.map((row) => ({
    ...row,
    revenue: Number(row.revenue),
    empresa: row.empresa ?? null,
    departamento: row.departamento ?? null,
  }));

  const scopedRows = applyAnalyticScope(normalized, scopeMap, canBypass);
  const currentRevenue = computeMetric("financial.revenue.current", scopedRows);
  const trend = computeMetric("financial.revenue.trend", scopedRows);
  const peakRevenue = computeMetric("financial.revenue.peak", scopedRows);
  const currentCustomers = computeMetric("financial.customers.current", scopedRows);
  const averageTicket = computeMetric("financial.ticket.average", scopedRows);

  return {
    rows: scopedRows,
    trendPoints: scopedRows.map((row) => ({
      id: row.id,
      label: row.date
        .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
        .replace(".", "")
        .toUpperCase(),
      value: row.revenue,
    })),
    filterOptions: {
      anos: uniqueSorted(scopedRows.map((row) => String(row.date.getFullYear()))),
      empresas: uniqueSorted(scopedRows.map((row) => row.empresa)),
      departamentos: uniqueSorted(scopedRows.map((row) => row.departamento)),
    },
    currentRevenue: currentRevenue.value,
    currentRevenueFormatted: currentRevenue.formatted,
    currentCustomers: currentCustomers.value,
    averageTicket: averageTicket.value,
    averageTicketFormatted: averageTicket.formatted,
    trend: trend.value,
    trendFormatted: trend.formatted,
    peakRevenue: peakRevenue.value,
    peakRevenueFormatted: peakRevenue.formatted,
    updatedAt: scopedRows.at(-1)?.updatedAt ?? null,
  };
}

export type FinancialRevenueSummary = Awaited<ReturnType<typeof getFinancialRevenueSummary>>;
