import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const getCurrentUserScopeMap = vi.fn();
const shouldBypassDataScope = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    financialRevenueMetric: {
      findMany,
    },
  },
}));

vi.mock("@/domains/rbac/scope", () => ({
  getCurrentUserScopeMap,
  shouldBypassDataScope,
}));

describe("getFinancialRevenueSummary", () => {
  beforeEach(() => {
    vi.resetModules();
    findMany.mockReset();
    getCurrentUserScopeMap.mockReset();
    shouldBypassDataScope.mockReset();
  });

  it("filters revenue rows by scoped dimensions for non-admin users", async () => {
    findMany.mockResolvedValue([
      {
        id: "a",
        date: new Date("2026-01-01T00:00:00.000Z"),
        revenue: 1000,
        customerCount: 10,
        empresa: "Empresa A",
        departamento: "Comercial",
        updatedAt: new Date("2026-01-10T00:00:00.000Z"),
      },
      {
        id: "b",
        date: new Date("2026-02-01T00:00:00.000Z"),
        revenue: 2000,
        customerCount: 20,
        empresa: "Empresa B",
        departamento: "Operacoes",
        updatedAt: new Date("2026-02-10T00:00:00.000Z"),
      },
    ]);
    getCurrentUserScopeMap.mockResolvedValue({ empresa: ["Empresa A"] });
    shouldBypassDataScope.mockResolvedValue(false);

    const { getFinancialRevenueSummary } = await import("@/domains/indicators/financial");
    const result = await getFinancialRevenueSummary();

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.empresa).toBe("Empresa A");
    expect(result.filterOptions.empresas).toEqual(["Empresa A"]);
  });

  it("returns no rows when a restricted user has no matching scoped dimensions", async () => {
    findMany.mockResolvedValue([
      {
        id: "a",
        date: new Date("2026-01-01T00:00:00.000Z"),
        revenue: 1000,
        customerCount: 10,
        empresa: "Empresa A",
        departamento: "Comercial",
        updatedAt: new Date("2026-01-10T00:00:00.000Z"),
      },
    ]);
    getCurrentUserScopeMap.mockResolvedValue({ empresa: ["Empresa B"] });
    shouldBypassDataScope.mockResolvedValue(false);

    const { getFinancialRevenueSummary } = await import("@/domains/indicators/financial");
    const result = await getFinancialRevenueSummary();

    expect(result.rows).toEqual([]);
    expect(result.currentRevenue).toBe(0);
  });
});
