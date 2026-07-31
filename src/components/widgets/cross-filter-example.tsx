"use client";

/**
 * EXEMPLO DE USO — cross-filtering no template.
 *
 * Estrutura de um dashboard com cross-filter:
 *
 * 1. Envolver o dashboard inteiro em <DashboardFilterProvider>
 * 2. Adicionar <FilterChipBar /> logo abaixo dos filtros de header
 * 3. Passar filterDimension para HorizontalBars / MatrixTable
 * 4. Ler useDashboardFilter() no componente pai para sub-filtrar os dados
 *
 * Este arquivo não é um componente real — é documentação executável.
 * Copie o padrão para seus dashboards.
 */

import { DashboardFilterProvider, useDashboardFilter } from "./dashboard-filter-context";
import { FilterChipBar } from "./filter-chip-bar";
import { HorizontalBars } from "./horizontal-bars";
import { MatrixTable, type MatrixRow, type MatrixColumn } from "./matrix-table";
import { LineTrendCard } from "./line-trend-card";

// ─── Dados fictícios ──────────────────────────────────────────────────────────

const CLIENTES = [
  { label: "Cliente Alpha", value: "R$ 420 mil", percent: 42, filterValue: "ALPHA" },
  { label: "Cliente Beta", value: "R$ 310 mil", percent: 31, filterValue: "BETA" },
  { label: "Cliente Gamma", value: "R$ 180 mil", percent: 18, filterValue: "GAMMA" },
];

const COLUMNS: MatrixColumn[] = [
  { id: "jan", label: "Jan", showMoM: false },
  { id: "fev", label: "Fev", showMoM: true },
  { id: "mar", label: "Mar", showMoM: true },
];

const ROWS_ALL: MatrixRow[] = [
  { id: "alpha", label: "ALPHA", values: { jan: 140000, fev: 160000, mar: 120000 }, drillable: true, filterValue: "ALPHA" },
  { id: "beta",  label: "BETA",  values: { jan: 100000, fev: 110000, mar: 100000 }, drillable: true, filterValue: "BETA" },
  { id: "gamma", label: "GAMMA", values: { jan:  60000, fev:  55000, mar:  65000 }, drillable: true, filterValue: "GAMMA" },
];

// ─── Inner component (inside provider, can call useDashboardFilter) ───────────

function ExampleContent() {
  const { getActive } = useDashboardFilter();
  const activeCliente = getActive("cliente");

  // Sub-filter MatrixTable rows based on active cross-filter
  const visibleRows = activeCliente
    ? ROWS_ALL.filter((r) => r.filterValue === activeCliente)
    : ROWS_ALL;

  // Sub-filter trend points — in a real dashboard, build series per-client from raw data
  const trendPoints = [
    { id: "jan", label: "Jan", value: activeCliente === "ALPHA" ? 140000 : activeCliente === "BETA" ? 100000 : 300000 },
    { id: "fev", label: "Fev", value: activeCliente === "ALPHA" ? 160000 : activeCliente === "BETA" ? 110000 : 325000 },
    { id: "mar", label: "Mar", value: activeCliente === "ALPHA" ? 120000 : activeCliente === "BETA" ? 100000 : 285000 },
  ];

  return (
    <div className="space-y-4">
      {/* FilterChipBar — aparece só quando há filtro ativo */}
      <FilterChipBar />

      <div className="grid gap-4 xl:grid-cols-2">
        {/* HorizontalBars com filterDimension — clicável, emite cross-filter */}
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-[13px] font-bold">Top clientes</p>
          <HorizontalBars rows={CLIENTES} filterDimension="cliente" />
        </div>

        {/* LineTrendCard reage ao filtro via re-derivação dos dados no componente pai */}
        <div className="rounded-lg border bg-card p-4">
          <p className="mb-3 text-[13px] font-bold">
            Evolução {activeCliente ? `— ${activeCliente}` : "geral"}
          </p>
          <LineTrendCard points={trendPoints} />
        </div>
      </div>

      {/* MatrixTable com filterDimension — clique na linha filtra o dashboard */}
      <div className="rounded-lg border bg-card p-4">
        <p className="mb-3 text-[13px] font-bold">Detalhe por cliente</p>
        <MatrixTable columns={COLUMNS} rows={visibleRows} filterDimension="cliente" />
      </div>
    </div>
  );
}

// ─── Componente raiz (exportado para uso real) ────────────────────────────────

export function ExampleDashboard() {
  return (
    // DashboardFilterProvider deve envolver TODOS os widgets que participam do cross-filter
    <DashboardFilterProvider>
      <ExampleContent />
    </DashboardFilterProvider>
  );
}
