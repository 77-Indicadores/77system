# Filtros Client-Side (Grain Pattern)

Referencia de implementacao para filtros instant sem round-trip ao servidor.

## Problema

Filtros na URL (`router.replace(url + ?marca=X)`) causam:

1. Next.js re-renderiza a pagina no servidor.
2. Nova query SQL com o filtro.
3. Serializar + transmitir o resultado.
4. Hidratacao no cliente.

Tempo total tipico: 2-30 segundos. Experiencia ruim.

## Solucao: Grain Pattern

```
Servidor carrega → TODAS as linhas do periodo (sem filtros dimensionais)
Cliente filtra   → useMemo + useState (sem request)
```

Resultado: filtros instantaneos (<16ms).

## Quando Usar

| Cenario | Abordagem |
|---------|-----------|
| Dataset do periodo cabe em ~5MB JSON | Grain client-side |
| Dataset e muito grande (>500k linhas) | Filtro na URL com indices certos no banco |
| Filtro muda a semantica do calculo (JOIN diferente) | URL |
| Filtro e periodo ou comparacao MoM/YoY | URL (sempre — muda os dados do servidor) |
| Filtro e dimensao (marca, vendedor, canal, curva) | Client-side |

## Implementacao

### 1. Dominio — funcao `getXxxGrain`

```ts
// src/domains/vendas/top-clientes.ts

export type TopClientesGrainRow = {
  clienteId: string;
  nome: string;
  cidade: string;
  vendedorCarteira: string;
  marca: string;        // dimensao — filtravel client-side
  vendas: number;       // periodo atual
  vendasAnterior: number; // periodo anterior
};

/**
 * Carrega todos os clientes x todas as marcas sem filtros dimensionais.
 * Apenas periodo e scope afetam a query.
 */
export async function getTopClientesGrain(filters: TopClientesFilters): Promise<TopClientesGrainRow[]> {
  // ... query SEM filtro de marca/vendedor no WHERE
  const rows = await prisma.$queryRaw`
    SELECT c.cliente_id, c.nome_cliente, c.vendedor_carteira,
      v.marca,
      SUM(v.venda_liquida) FILTER (WHERE v.data >= ${filters.from}) AS vendas,
      SUM(v.venda_liquida) FILTER (WHERE v.data >= ${anterior.from} AND v.data < ${filters.from}) AS vendas_anterior
    FROM dim_cliente c
    LEFT JOIN fato_vendas v ON v.cliente_id = c.cliente_id
    WHERE v.data >= ${uniaoFrom} AND v.data < ${filters.to}
    GROUP BY 1, 2, 3, 4
  `;
  return rows.map(toGrainRow);
}
```

### 2. Servidor — carrega grain, nao overview

```ts
// src/app/(app)/dashboard/[slug]/screens/vendas-top-clientes.tsx

export async function VendasTopClientesScreen({ searchParams }) {
  const filters = parseTopClientesFilters(searchParams, reference);

  const [grain, options] = await Promise.all([
    getTopClientesGrain(filters),   // <-- grain, sem filtros dimensionais
    getTopClientesFilterOptions(),
  ]);

  return (
    <TopClientesClient
      grain={grain}
      options={options}
      preset={filters.preset}
      comparison={filters.comparison}
    />
  );
}
```

### 3. Cliente — filtra e agrega via useMemo

```tsx
// src/app/(app)/dashboard/[slug]/screens/top-clientes-client.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function TopClientesClient({ grain, options, preset, comparison }) {
  // Filtros instant (zero round-trip)
  const [marca, setMarca]     = useState<string[]>([]);
  const [vendedor, setVendedor] = useState<string[]>([]);

  // Periodo/comparacao: URL (re-carrega grain do servidor)
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Filtragem + agregacao: zero request
  const overview = useMemo(
    () => aggregate(grain, marca, vendedor),
    [grain, marca, vendedor],
  );

  return (
    <>
      <MultiSelectFilter label="Marca"    value={marca}    onChange={setMarca}    options={...} />
      <MultiSelectFilter label="Vendedor" value={vendedor} onChange={setVendedor} options={...} />

      {/* Periodo: URL — muda o grain no servidor */}
      <select value={preset} onChange={e => startTransition(() => router.replace(...))}>
        ...
      </select>

      {pending && <Loader2 />}
      <TopClientesTabela overview={overview} />
    </>
  );
}
```

### 4. Funcao de agregacao (pure JS)

```ts
function aggregate(
  grain: TopClientesGrainRow[],
  marcas: string[],
  vendedor: string[],
): TopClientesOverview {
  // Filtrar por vendedor
  const rows = vendedor.length > 0
    ? grain.filter(r => vendedor.includes(r.vendedorCarteira))
    : grain;

  // Somar por cliente, filtrando marcas
  const byClient = new Map<string, { vendas: number; vendasAnterior: number }>();
  for (const r of rows) {
    if (marcas.length > 0 && !marcas.includes(r.marca)) continue;
    const prev = byClient.get(r.clienteId) ?? { vendas: 0, vendasAnterior: 0 };
    byClient.set(r.clienteId, {
      vendas: prev.vendas + r.vendas,
      vendasAnterior: prev.vendasAnterior + r.vendasAnterior,
    });
  }

  const clientes = [...byClient.entries()].map(([id, v]) => ({ id, ...v }));
  const total = clientes.reduce((s, c) => s + c.vendas, 0);
  return { clientes, total, ... };
}
```

## Indices Obrigatorios

Antes de ligar qualquer dashboard com `fato_*`, adicione indices nas colunas de data e filtros frequentes:

```prisma
@@index([dataFaturamento])           // filtro de periodo — CRITICO
@@index([isLiquida, dataFaturamento]) // combo mais frequente
@@index([classificacao])
@@index([clienteId])
@@index([vendedorNome])
@@index([marca])
```

Sem `@@index([dataFaturamento])`, queries com `WHERE data_faturamento >= X` fazem full table scan
e demoram 10-30 s mesmo com tabela materializada.

## Multi-Vendedor (ARRAY_AGG)

Quando um cliente pode ter mais de um vendedor no mesmo periodo:

```sql
-- No grain, incluir array de vendedores por cliente
vendedores_cte AS (
  SELECT cliente_id,
    ARRAY_AGG(DISTINCT vendedor_nome) FILTER (WHERE vendedor_nome IS NOT NULL) AS vendedores
  FROM fato_vendas WHERE ...
  GROUP BY 1
)
```

```ts
// Tipo
type ClienteGrainRow = { clienteId: string; vendedores: string[]; ... };

// Filtro client-side
clientes.filter(c => c.vendedores.some(v => vendedor.includes(v)))
```

## Arquivos de Referencia

- `src/app/(app)/dashboard/_screens/financial-dashboard-client.tsx` — exemplo simples (ano/empresa/departamento)
- `src/components/widgets/dashboard-filter-context.tsx` — cross-filter entre widgets
- `docs/06-dados-performance.md` — regras gerais de performance
