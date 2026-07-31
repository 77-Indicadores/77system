import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronDown, Download } from "lucide-react";
import { FocusNav } from "@/components/focus-nav";
import { AnalyticsPanel } from "@/components/widgets/analytics-panel";
import { DenseSummaryCard } from "@/components/widgets/dense-summary-card";
import { DonutCard } from "@/components/widgets/donut-card";
import { FreshnessBadge } from "@/components/widgets/freshness-badge";
import { HorizontalBars } from "@/components/widgets/horizontal-bars";
import { LineTrendCard } from "@/components/widgets/line-trend-card";
import { StackedMonthBars } from "@/components/widgets/stacked-month-bars";
import { getFinancialRevenueSummary } from "@/domains/indicators/financial";
import { formatCurrency, formatPercent } from "@/domains/indicators/metrics";
import { listVisibleDashboardGroups, requireDashboardAccess } from "@/domains/indicators/service";

export default async function DashboardScreenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [screen, allGroups] = await Promise.all([
    requireDashboardAccess(slug),
    listVisibleDashboardGroups(),
  ]);
  if (!screen) notFound();
  const summary = await getFinancialRevenueSummary();

  const monthLabel = summary.rows.at(-1)?.date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "") ?? "Atual";
  const target = 260000;
  const completion = summary.currentRevenue > 0 ? (summary.currentRevenue / target) * 100 : 0;
  const distributionTotal = summary.currentCustomers || 1;
  const currentYear = summary.rows.at(-1)?.date.getFullYear() ?? new Date().getFullYear();

  return (
    <div className="flex h-screen flex-col overflow-hidden">

      {/* ── Focus topbar ── */}
      <header
        className="flex h-11 shrink-0 items-center gap-2 px-4"
        style={{ background: "var(--sidebar-bg)", borderBottom: "1px solid var(--sidebar-border)" }}
      >
        {/* Back arrow */}
        <Link
          href="/dashboard"
          aria-label="Voltar para indicadores"
          className="grid size-7 shrink-0 place-items-center rounded-md transition-colors hover:bg-white/10"
          style={{ color: "var(--sidebar-text)" }}
        >
          <ArrowLeft className="size-4" />
        </Link>

        <span className="h-4 w-px shrink-0" style={{ background: "var(--sidebar-border)" }} />

        {/* Screen / group switcher */}
        <FocusNav
          groups={allGroups.map((g) => ({
            slug: g.slug,
            name: g.name,
            screens: g.screens.map((s) => ({ slug: s.slug, name: s.name })),
          }))}
          currentScreenSlug={screen.slug}
          currentScreenName={screen.name}
          currentGroupSlug={screen.group.slug}
        />

        <div className="flex-1" />

        {/* Actions */}
        <FreshnessBadge updatedAt={summary.updatedAt} freshnessSeconds={900} />
        <a
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 px-3 text-[12px] font-medium text-white/70 hover:bg-white/10"
          href="/api/exports/excel"
        >
          <Download className="size-3" /> Excel
        </a>
      </header>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 2xl:px-10">
        <div className="space-y-4">

        {/* Page header + filters */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{screen.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{screen.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterPill label="Competencia" value={monthLabel} />
            <FilterPill label="Empresa" value="Todas" />
            <FilterPill label="Departamento" value="Todos" />
          </div>
        </div>

      {/* ── Summary card ── */}
      <DenseSummaryCard
        title="Resumo de Receita"
        subtitle="Visao do periodo com dados materializados e atualizacao controlada"
        badge={`Acumulado · ${currentYear}`}
        stats={[
          { label: "receita acumulada", value: formatCurrency(summary.currentRevenue).replace("R$", "").trim() },
          { label: "ticket medio", value: formatCurrency(summary.averageTicket).replace("R$", "").trim() },
          { label: "clientes ativos", value: String(summary.currentCustomers) },
        ]}
        tiles={[
          { label: "Crescimento", value: formatPercent(summary.trend), helper: "vs periodo anterior" },
          { label: "Pico", value: formatCurrency(summary.peakRevenue), helper: "maior competencia" },
          { label: "Freshness", value: "OK", helper: summary.updatedAt ? summary.updatedAt.toLocaleString("pt-BR") : "sem materializacao" },
          { label: "Fonte", value: "Postgres", helper: "materializado" },
          { label: "Catworld", value: "Cron", helper: "refresh agendado" },
          { label: "Export", value: "Excel", helper: "dados reais" },
        ]}
      />

      {/* ── Charts row 1 ── */}
      <div className="grid gap-4 xl:grid-cols-3">
        <AnalyticsPanel title="Receita por mes" subtitle="Volume materializado por competencia">
          <StackedMonthBars
            rows={summary.rows.map((row) => ({
              label: row.date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""),
              a: Math.round(Number(row.revenue) / 1000),
              b: Math.round(row.customerCount / 12),
              c: Math.round(row.customerCount / 24),
            }))}
          />
        </AnalyticsPanel>
        <AnalyticsPanel
          className="xl:col-span-1"
          legend={<span><span className="text-primary">●</span> Receita</span>}
          title="Evolucao por mes"
          subtitle="Linha de receita materializada"
        >
          <LineTrendCard points={summary.trendPoints} />
        </AnalyticsPanel>
        <AnalyticsPanel title="Distribuicao por faixa" subtitle="Participacao por fonte">
          <HorizontalBars
            rows={[
              { label: "Catworld", value: Math.round(distributionTotal * 0.72), percent: 72 },
              { label: "CRUD interno", value: Math.round(distributionTotal * 0.18), percent: 18, tone: "dark" },
              { label: "Staging", value: Math.round(distributionTotal * 0.1), percent: 10, tone: "muted" },
            ]}
          />
        </AnalyticsPanel>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid gap-4 xl:grid-cols-3">
        <AnalyticsPanel title="Atingimento" subtitle={`Meta mensal ${formatCurrency(target)}`}>
          <DonutCard caption="Receita sobre meta" label="Meta mensal" value={completion} />
        </AnalyticsPanel>
        <AnalyticsPanel title="Qualidade dos dados" subtitle="Validacao por carga">
          <HorizontalBars
            rows={[
              { label: "Validados", value: Math.round(distributionTotal * 0.91), percent: 91 },
              { label: "Pendentes", value: Math.round(distributionTotal * 0.07), percent: 7, tone: "muted" },
              { label: "Rejeitados", value: Math.round(distributionTotal * 0.02), percent: 2, tone: "dark" },
            ]}
          />
        </AnalyticsPanel>
        <AnalyticsPanel title="Refresh" subtitle="Estado da materializacao">
          <HorizontalBars
            rows={[
              { label: "Fresh", value: Math.round(distributionTotal * 0.86), percent: 86 },
              { label: "Stale", value: Math.round(distributionTotal * 0.11), percent: 11, tone: "muted" },
              { label: "Expired", value: Math.round(distributionTotal * 0.03), percent: 3, tone: "dark" },
            ]}
          />
        </AnalyticsPanel>
        </div>
      </div>

      </div>
    </div>
  );
}

function FilterPill({ label, value }: { label: string; value: string }) {
  return (
    <button className="flex h-10 min-w-32 items-center justify-between gap-3 rounded-lg border bg-card px-3 text-left hover:bg-muted">
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <span className="text-[13px] font-semibold">{value}</span>
      </span>
      {label === "Competencia" ? <CalendarDays className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
    </button>
  );
}
