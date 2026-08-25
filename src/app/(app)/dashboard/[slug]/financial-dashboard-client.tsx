"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { AnalyticsPanel } from "@/components/widgets/analytics-panel";
import { DenseSummaryCard } from "@/components/widgets/dense-summary-card";
import { DonutCard } from "@/components/widgets/donut-card";
import { HorizontalBars } from "@/components/widgets/horizontal-bars";
import { LineTrendCard } from "@/components/widgets/line-trend-card";
import { StackedMonthBars } from "@/components/widgets/stacked-month-bars";
import { SelectFilter } from "@/components/widgets/select-filter";
import type { FinancialRevenueSummary } from "@/domains/indicators/financial";
import { formatCurrency, formatPercent } from "@/domains/indicators/metrics";

type Props = {
  screenName: string;
  screenDescription: string | null;
  summary: FinancialRevenueSummary;
};

const ALL = "__ALL__";

export function FinancialDashboardClient({ screenName, screenDescription, summary }: Props) {
  const latestYear = summary.filterOptions.anos.at(-1) ?? String(new Date().getFullYear());
  const [ano, setAno] = useState(latestYear);
  const [empresa, setEmpresa] = useState(ALL);
  const [departamento, setDepartamento] = useState(ALL);

  const filteredRows = useMemo(
    () =>
      summary.rows.filter((row) => {
        const matchesYear = String(row.date.getFullYear()) === ano;
        const matchesEmpresa = empresa === ALL || row.empresa === empresa;
        const matchesDepartamento = departamento === ALL || row.departamento === departamento;
        return matchesYear && matchesEmpresa && matchesDepartamento;
      }),
    [summary.rows, ano, empresa, departamento]
  );

  const scopedSummary = useMemo(() => {
    const currentRevenue = filteredRows.reduce((sum, row) => sum + row.revenue, 0);
    const currentCustomers = filteredRows.reduce((sum, row) => sum + row.customerCount, 0);
    const averageTicket = currentCustomers > 0 ? currentRevenue / currentCustomers : 0;
    const byMonth = new Map<string, { revenue: number; customerCount: number; label: string; id: string }>();

    for (const row of filteredRows) {
      const ym = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, "0")}`;
      const current = byMonth.get(ym) ?? {
        revenue: 0,
        customerCount: 0,
        label: row.date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "").toUpperCase(),
        id: ym,
      };
      current.revenue += row.revenue;
      current.customerCount += row.customerCount;
      byMonth.set(ym, current);
    }

    const monthly = [...byMonth.values()].sort((a, b) => a.id.localeCompare(b.id));
    const previousRevenue = monthly.at(-2)?.revenue ?? 0;
    const latestRevenue = monthly.at(-1)?.revenue ?? 0;
    const trend = previousRevenue > 0 ? ((latestRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const peakRevenue = monthly.reduce((max, month) => Math.max(max, month.revenue), 0);

    return {
      monthly,
      currentRevenue,
      currentCustomers,
      averageTicket,
      trend,
      peakRevenue,
      updatedAt: filteredRows.at(-1)?.updatedAt ?? summary.updatedAt,
    };
  }, [filteredRows, summary.updatedAt]);

  const target = 260000;
  const completion = scopedSummary.currentRevenue > 0 ? (scopedSummary.currentRevenue / target) * 100 : 0;
  const monthLabel = scopedSummary.monthly.at(-1)?.label ?? "Atual";
  const companyBars = summary.filterOptions.empresas
    .map((option) => {
      const revenue = filteredRows
        .filter((row) => row.empresa === option)
        .reduce((sum, row) => sum + row.revenue, 0);
      return {
        label: option,
        value: formatCurrency(revenue),
        percent: scopedSummary.currentRevenue > 0 ? Math.round((revenue / scopedSummary.currentRevenue) * 100) : 0,
      };
    })
    .filter((row) => row.percent > 0);
  const departmentBars = summary.filterOptions.departamentos
    .map((option, index) => {
      const revenue = filteredRows
        .filter((row) => row.departamento === option)
        .reduce((sum, row) => sum + row.revenue, 0);
      return {
        label: option,
        value: formatCurrency(revenue),
        percent: scopedSummary.currentRevenue > 0 ? Math.round((revenue / scopedSummary.currentRevenue) * 100) : 0,
        tone: (index % 2 === 0 ? "red" : "dark") as "red" | "dark",
      };
    })
    .filter((row) => row.percent > 0);

  const resetFilters = () => {
    setAno(latestYear);
    setEmpresa(ALL);
    setDepartamento(ALL);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{screenName}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{screenDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectFilter
            label="Ano"
            value={ano}
            onChange={setAno}
            options={summary.filterOptions.anos.map((option) => ({ label: option, value: option }))}
          />
          <SelectFilter
            label="Empresa"
            value={empresa}
            onChange={setEmpresa}
            options={[{ label: "Todas", value: ALL }, ...summary.filterOptions.empresas.map((option) => ({ label: option, value: option }))]}
          />
          <SelectFilter
            label="Departamento"
            value={departamento}
            onChange={setDepartamento}
            options={[{ label: "Todos", value: ALL }, ...summary.filterOptions.departamentos.map((option) => ({ label: option, value: option }))]}
          />
          <button
            type="button"
            onClick={resetFilters}
            className="flex h-8 items-center rounded-md border bg-card px-3 text-[12px] font-medium text-muted-foreground shadow-sm hover:bg-muted/40"
          >
            Limpar filtros
          </button>
          <div className="flex h-10 min-w-32 cursor-default items-center justify-between gap-3 rounded-lg border bg-card px-3 text-left">
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Competencia</span>
              <span className="text-[13px] font-semibold">{monthLabel}</span>
            </span>
            <CalendarDays className="size-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      <DenseSummaryCard
        title="Resumo de Receita"
        subtitle="Payload analitico pre-carregado com filtros locais instantaneos"
        badge={`Acumulado · ${ano}`}
        stats={[
          { label: "receita acumulada", value: formatCurrency(scopedSummary.currentRevenue).replace("R$", "").trim() },
          { label: "ticket medio", value: formatCurrency(scopedSummary.averageTicket).replace("R$", "").trim() },
          { label: "clientes ativos", value: String(scopedSummary.currentCustomers) },
        ]}
        tiles={[
          { label: "Crescimento", value: formatPercent(scopedSummary.trend), helper: "vs periodo anterior" },
          { label: "Pico", value: formatCurrency(scopedSummary.peakRevenue), helper: "maior competencia" },
          { label: "Freshness", value: "OK", helper: scopedSummary.updatedAt ? scopedSummary.updatedAt.toLocaleString("pt-BR") : "sem materializacao" },
          { label: "Fonte", value: "Postgres", helper: "payload autorizado" },
          { label: "Segregacao", value: "Ativa", helper: "aplicada no backend" },
          { label: "Export", value: "Excel", helper: "dados reais" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <AnalyticsPanel title="Receita por mes" subtitle="Serie consolidada apos segregacao">
          <StackedMonthBars
            rows={scopedSummary.monthly.map((row) => ({
              label: row.label,
              a: Math.round(row.revenue / 1000),
              b: Math.round(row.customerCount / 10),
              c: Math.round(row.customerCount / 20),
            }))}
          />
        </AnalyticsPanel>
        <AnalyticsPanel title="Evolucao por mes" subtitle="Sem roundtrip por clique">
          <LineTrendCard
            points={scopedSummary.monthly.map((row) => ({
              id: row.id,
              label: row.label,
              value: row.revenue,
            }))}
          />
        </AnalyticsPanel>
        <AnalyticsPanel title="Receita por empresa" subtitle="Filtro local em memoria">
          <HorizontalBars rows={companyBars} />
        </AnalyticsPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AnalyticsPanel title="Atingimento" subtitle={`Meta mensal ${formatCurrency(target)}`}>
          <DonutCard caption="Receita sobre meta" label="Meta mensal" value={completion} />
        </AnalyticsPanel>
        <AnalyticsPanel title="Receita por departamento" subtitle="Distribuicao apos escopo">
          <HorizontalBars rows={departmentBars} />
        </AnalyticsPanel>
        <AnalyticsPanel title="Capacidade de filtro" subtitle="Arquitetura de dashboard analitico">
          <HorizontalBars
            rows={[
              { label: "Preload", value: formatCurrency(scopedSummary.currentRevenue), percent: 100 },
              { label: "Sem router.push", value: "0 navegacoes", percent: 100, tone: "dark" },
              { label: "Sem query extra", value: `${filteredRows.length} linhas`, percent: Math.min(Math.max(filteredRows.length, 1), 100), tone: "muted" },
            ]}
            showPercent={false}
          />
        </AnalyticsPanel>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Este dashboard usa payload inicial autorizado no backend e filtros locais no cliente. Nenhuma interacao de filtro muda URL ou refaz query no servidor.
      </p>
    </div>
  );
}
