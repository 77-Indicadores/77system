import { prisma } from "@/lib/prisma";
import { computeMetric } from "@/domains/indicators/metrics";

export async function getFinancialRevenueSummary() {
  const rows = await prisma.financialRevenueMetric.findMany({ orderBy: { date: "asc" } });

  const normalized = rows.map((row) => ({
    ...row,
    revenue: Number(row.revenue),
  }));

  const currentRevenue = computeMetric("financial.revenue.current", normalized);
  const trend = computeMetric("financial.revenue.trend", normalized);
  const peakRevenue = computeMetric("financial.revenue.peak", normalized);
  const currentCustomers = computeMetric("financial.customers.current", normalized);
  const averageTicket = computeMetric("financial.ticket.average", normalized);

  return {
    rows,
    trendPoints: rows.map((row) => ({
      id: row.id,
      label: row.date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "").toUpperCase(),
      value: Number(row.revenue),
    })),
    currentRevenue: currentRevenue.value,
    currentRevenueFormatted: currentRevenue.formatted,
    currentCustomers: currentCustomers.value,
    averageTicket: averageTicket.value,
    averageTicketFormatted: averageTicket.formatted,
    trend: trend.value,
    trendFormatted: trend.formatted,
    peakRevenue: peakRevenue.value,
    peakRevenueFormatted: peakRevenue.formatted,
    updatedAt: rows.at(-1)?.updatedAt ?? null,
  };
}
