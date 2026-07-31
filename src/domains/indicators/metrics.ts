export type MetricUnit = "currency" | "percent" | "integer" | "decimal";

export type MetricRow = Record<string, unknown>;

export type MetricComputed = {
  value: number;
  formatted: string;
};

export type MetricDefinition<TRow extends MetricRow = MetricRow> = {
  key: string;
  label: string;
  unit: MetricUnit;
  description?: string;
  compute: (rows: TRow[]) => number;
  format: (value: number) => string;
};

const registry = new Map<string, MetricDefinition>();

export function defineMetric<TRow extends MetricRow>(def: MetricDefinition<TRow>): MetricDefinition<TRow> {
  if (registry.has(def.key)) throw new Error(`Métrica já registrada: ${def.key}`);
  registry.set(def.key, def as MetricDefinition);
  return def;
}

export function computeMetric(key: string, rows: MetricRow[]): MetricComputed {
  const def = registry.get(key);
  if (!def) throw new Error(`Métrica não registrada: ${key}`);
  const value = def.compute(rows);
  return { value, formatted: def.format(value) };
}

export function getMetric(key: string): MetricDefinition | undefined {
  return registry.get(key);
}

export function listMetrics(): MetricDefinition[] {
  return Array.from(registry.values());
}

// --- Formatters compartilhados ---

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}%`;
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

export function formatDecimal(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// --- Domínio: financial ---

type RevenueRow = {
  revenue: number | string;
  customerCount: number;
  date: Date;
  updatedAt: Date;
};

defineMetric<RevenueRow>({
  key: "financial.revenue.current",
  label: "Receita Atual",
  unit: "currency",
  description: "Receita do período mais recente.",
  compute: (rows) => Number(rows.at(-1)?.revenue ?? 0),
  format: formatCurrency,
});

defineMetric<RevenueRow>({
  key: "financial.revenue.trend",
  label: "Variação de Receita",
  unit: "percent",
  description: "Variação percentual entre os dois últimos períodos.",
  compute: (rows) => {
    const current = Number(rows.at(-1)?.revenue ?? 0);
    const previous = Number(rows.at(-2)?.revenue ?? 0);
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  },
  format: formatPercent,
});

defineMetric<RevenueRow>({
  key: "financial.revenue.peak",
  label: "Receita Pico",
  unit: "currency",
  description: "Maior receita registrada no conjunto de dados.",
  compute: (rows) => Math.max(...rows.map((r) => Number(r.revenue)), 0),
  format: formatCurrency,
});

defineMetric<RevenueRow>({
  key: "financial.customers.current",
  label: "Clientes Ativos",
  unit: "integer",
  description: "Quantidade de clientes no período mais recente.",
  compute: (rows) => rows.at(-1)?.customerCount ?? 0,
  format: formatInteger,
});

defineMetric<RevenueRow>({
  key: "financial.ticket.average",
  label: "Ticket Médio",
  unit: "currency",
  description: "Receita dividida pelo número de clientes no período mais recente.",
  compute: (rows) => {
    const last = rows.at(-1);
    if (!last || !last.customerCount) return 0;
    return Number(last.revenue) / last.customerCount;
  },
  format: formatCurrency,
});
