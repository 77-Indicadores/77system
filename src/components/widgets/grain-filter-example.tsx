"use client";

/**
 * Exemplo de referencia: Grain Pattern para filtros client-side.
 *
 * O servidor carrega TODAS as linhas do periodo sem filtros dimensionais.
 * Este componente filtra via useMemo — zero round-trip ao servidor.
 *
 * Ver docs/14-filtros-client-side.md para guia completo.
 *
 * Para usar em uma tela real:
 *   1. Crie um tipo `XxxGrainRow` no dominio.
 *   2. Crie `getXxxGrain(filters)` que carrega sem filtros dimensionais.
 *   3. Passe o grain como prop para o componente cliente.
 *   4. Filtre com useMemo aqui dentro.
 */

import { useMemo, useState, useTransition, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";
import { MultiSelectFilter } from "@/components/widgets/multi-select-filter";

// ── Tipos de exemplo ─────────────────────────────────────────────────────────

/** Uma linha do grain: (entidade × dimensao) com metricas do periodo. */
type ExampleGrainRow = {
  id: string;
  nome: string;
  dimensaoA: string; // ex: "marca", "canal", "vendedor"
  dimensaoB: string; // ex: "segmento", "cidade"
  valorAtual: number;
  valorAnterior: number;
};

type ExampleFilterOptions = {
  dimensaoA: string[];
  dimensaoB: string[];
};

// ── Agregacao client-side (funcao pura — sem side effects) ───────────────────

function aggregate(
  grain: ExampleGrainRow[],
  dimA: string[],
  dimB: string[],
) {
  // 1. Aplicar filtros dimensionais
  const filtered = grain.filter((r) => {
    if (dimA.length > 0 && !dimA.includes(r.dimensaoA)) return false;
    if (dimB.length > 0 && !dimB.includes(r.dimensaoB)) return false;
    return true;
  });

  // 2. Agregar por entidade
  const byId = new Map<string, { nome: string; valorAtual: number; valorAnterior: number }>();
  for (const r of filtered) {
    const prev = byId.get(r.id) ?? { nome: r.nome, valorAtual: 0, valorAnterior: 0 };
    byId.set(r.id, {
      nome: r.nome,
      valorAtual: prev.valorAtual + r.valorAtual,
      valorAnterior: prev.valorAnterior + r.valorAnterior,
    });
  }

  const rows = Array.from(byId.entries())
    .map(([id, v]) => ({
      id,
      nome: v.nome,
      valorAtual: v.valorAtual,
      valorAnterior: v.valorAnterior,
      variacao: v.valorAnterior > 0 ? ((v.valorAtual - v.valorAnterior) / v.valorAnterior) * 100 : null,
    }))
    .sort((a, b) => b.valorAtual - a.valorAtual);

  const totalAtual = rows.reduce((s, r) => s + r.valorAtual, 0);
  const totalAnterior = rows.reduce((s, r) => s + r.valorAnterior, 0);

  return { rows, totalAtual, totalAnterior };
}

// ── Componente ────────────────────────────────────────────────────────────────

// Periodos de exemplo — substitua por PERIOD_PRESETS do seu dominio
const PERIODO_OPCOES = [
  { value: "mes-atual", label: "Mês atual" },
  { value: "trimestre", label: "Trimestre" },
  { value: "ano-atual", label: "Ano atual" },
] as const;

export function GrainFilterExample({
  grain,
  options,
  preset,
}: {
  grain: ExampleGrainRow[];
  options: ExampleFilterOptions;
  /** Valor atual do preset de periodo (vem da URL via searchParams). */
  preset: string;
}) {
  // ── Filtros instant (zero round-trip) ──────────────────────────────────────
  const [dimA, setDimA] = useState<string[]>([]);
  const [dimB, setDimB] = useState<string[]>([]);

  // ── Periodo → URL (muda o grain no servidor) ───────────────────────────────
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setPeriodo = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("periodo", value);
      startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
    },
    [pathname, router, searchParams],
  );

  // ── Filtragem + agregacao: nenhum request ao servidor ─────────────────────
  const { rows, totalAtual, totalAnterior } = useMemo(
    () => aggregate(grain, dimA, dimB),
    [grain, dimA, dimB],
  );

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Barra de filtros */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {/* Dimensoes: instant */}
        <MultiSelectFilter
          label="Dimensao A"
          options={options.dimensaoA.map((v) => ({ label: v, value: v }))}
          value={dimA}
          onChange={setDimA}
        />
        <MultiSelectFilter
          label="Dimensao B"
          options={options.dimensaoB.map((v) => ({ label: v, value: v }))}
          value={dimB}
          onChange={setDimB}
        />

        {/* Periodo: URL — re-carrega grain com novo intervalo */}
        <label className="flex h-8 items-center gap-2 rounded-md border bg-card px-3 text-[12px] shadow-sm">
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Periodo:</span>
          <select
            className="bg-transparent font-semibold outline-none"
            value={preset}
            onChange={(e) => setPeriodo(e.target.value)}
          >
            {PERIODO_OPCOES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        {pending && <Loader2 className="size-4 animate-spin text-primary" aria-label="Atualizando" />}
      </div>

      {/* KPIs */}
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total Atual</p>
          <p className="text-xl font-black tabular-nums">{totalAtual.toLocaleString("pt-BR")}</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Total Anterior</p>
          <p className="text-xl font-black tabular-nums text-muted-foreground">{totalAnterior.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 min-h-0 overflow-auto rounded-lg border bg-card">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0 bg-muted/60">
            <tr className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Nome</th>
              <th className="px-3 py-2 text-right">Atual</th>
              <th className="px-3 py-2 text-right">Anterior</th>
              <th className="px-3 py-2 text-right">Var.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{r.nome}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.valorAtual.toLocaleString("pt-BR")}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{r.valorAnterior.toLocaleString("pt-BR")}</td>
                <td className="px-3 py-2 text-right">
                  {r.variacao === null ? "—" : (
                    <span className={r.variacao >= 0 ? "text-emerald-600" : "text-destructive"}>
                      {r.variacao >= 0 ? "+" : ""}{r.variacao.toFixed(1)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum resultado para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
