import { describe, expect, it } from "vitest";
import {
  computeMetric,
  listMetrics,
  getMetric,
  formatCurrency,
  formatPercent,
} from "@/domains/indicators/metrics";

const rows = [
  { revenue: 10000, customerCount: 100, date: new Date("2024-01-01"), updatedAt: new Date() },
  { revenue: 12000, customerCount: 120, date: new Date("2024-02-01"), updatedAt: new Date() },
  { revenue: 9000,  customerCount: 90,  date: new Date("2024-03-01"), updatedAt: new Date() },
];

describe("MetricRegistry", () => {
  it("registra métricas financeiras base", () => {
    const keys = listMetrics().map((m) => m.key);
    expect(keys).toContain("financial.revenue.current");
    expect(keys).toContain("financial.revenue.trend");
    expect(keys).toContain("financial.revenue.peak");
    expect(keys).toContain("financial.customers.current");
    expect(keys).toContain("financial.ticket.average");
  });

  it("computa receita atual do período mais recente", () => {
    const result = computeMetric("financial.revenue.current", rows);
    expect(result.value).toBe(9000);
  });

  it("computa variação de receita entre últimos dois períodos", () => {
    const result = computeMetric("financial.revenue.trend", rows);
    // (9000 - 12000) / 12000 * 100 = -25
    expect(result.value).toBeCloseTo(-25, 2);
  });

  it("computa receita pico", () => {
    const result = computeMetric("financial.revenue.peak", rows);
    expect(result.value).toBe(12000);
  });

  it("computa ticket médio", () => {
    const result = computeMetric("financial.ticket.average", rows);
    // 9000 / 90 = 100
    expect(result.value).toBe(100);
  });

  it("retorna zero quando não há dados", () => {
    const result = computeMetric("financial.revenue.current", []);
    expect(result.value).toBe(0);
  });

  it("lança erro para queryRef não registrado", () => {
    expect(() => computeMetric("nao.existe", rows)).toThrow("Métrica não registrada: nao.existe");
  });

  it("getMetric retorna undefined para chave inexistente", () => {
    expect(getMetric("inexistente")).toBeUndefined();
  });

  it("formatCurrency formata em BRL", () => {
    expect(formatCurrency(1234.5)).toMatch(/1\.234/);
  });

  it("formatPercent inclui sinal para positivo e negativo", () => {
    expect(formatPercent(10)).toMatch(/^\+/);
    expect(formatPercent(-5)).toMatch(/^-/);
  });
});
