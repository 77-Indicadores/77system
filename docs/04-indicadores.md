# Indicadores

## Estrutura

```txt
DashboardGroup → DashboardScreen → Widget
```

Um grupo pode conter várias telas com permissões distintas.

---

## Biblioteca de widgets BI

Os widgets do template estão em `src/components/widgets/`. Eles formam a mini-biblioteca BI
da Equipe 77 — use-os antes de criar componentes novos.

### Filtros

| Componente | Quando usar |
|---|---|
| `SelectFilter` | Dimensão temporal-base ou comparação single — ex: ano base YoY, mês de matriz |
| `MultiSelectFilter` | Dimensões que o usuário precisa cruzar — empresa, obra, cliente, conta, fornecedor |

**Regra analítica:** o tipo não depende do campo, depende da pergunta da tela.
- Multi: o usuário quer agregar (ex: "soma de todas as obras selecionadas").
- Single: o usuário quer comparar (ex: "faturamento de 2024 vs 2023").

Coloque filtros em uma barra horizontal acima do conteúdo, nunca dentro de cards.

### Gráficos

| Componente | Uso |
|---|---|
| `LineTrendCard` | Evolução mensal. `points` = série única. `series` = array para múltiplos anos/categorias. Inclui legenda automática para multi-série e `ResizeObserver` para ocupar largura real do card. |
| `HorizontalBars` | Ranking de participação (top N). Valor + percentual. |
| `StackedMonthBars` | Composição por mês (ex: faturamento bruto vs líquido). |
| `DonutCard` | Participação de uma dimensão. Compacto horizontal — não ocupa coluna inteira. |

### Tabelas e matrizes

| Componente | Uso |
|---|---|
| `MatrixTable` | DRE, resultado de obra, qualquer matriz financeira. Suporta linhas de grupo, subtotal, total, highlight positivo/negativo, MoM% e callback de drill por linha. |
| `AnalyticsPanel` | Wrapper genérico com título/subtítulo para qualquer conteúdo. |

### KPIs e cards

| Componente | Uso |
|---|---|
| `KpiCard` | Valor principal + label. Use para o bloco de KPIs no topo. |
| `MetricHeroCard` | KPI com variação vs período anterior. |
| `DenseSummaryCard` | Múltiplos valores menores em grid. |

### Drill e export

| Componente/utilitário | Uso |
|---|---|
| `DrillModal` | Modal de detalhe com tabela + botão Excel. Recebe `columns`, `rows` e `exportFilename`. |
| `src/lib/export-utils.ts` | `exportToExcel(rows, columns, filename)` — export client-side do recorte exato aberto. Não exige servidor. |
| `POST /api/exports/excel` | Export server-side de datasets completos que não passam pelo cliente. Recebe `{ rows, filename, sheetName }`. |

**Regra:** todo detalhamento (modal, drawer, drill) deve ter botão "Baixar Excel".

---

## Padrão de layout narrativo

Dashboards são lidos, não explorados. A ordem das seções deve seguir:

1. **KPIs** — quanto está acontecendo (totais, variação YoY)
2. **Tendência** — como evoluiu (LineTrendCard)
3. **Composição/concentração** — onde está (HorizontalBars, DonutCard)
4. **Matriz/detalhe** — por que está acontecendo (MatrixTable)
5. **Drill/export** — como auditar (DrillModal + Excel)

Evite:
- Dois painéis com exatamente o mesmo ranking (tabela + barras).
- Textos opinativos ou técnicos visíveis para usuário final.
- Seções sem hierarquia — não é grid de componentes, é história analítica.

---

## Datas de ERP/BI

Use `parseErpDate()` de `src/lib/dates.ts` sempre que processar datas vindas de APIs externas,
planilhas ou bancos legados. Nunca use `new Date(rawString)` ou `new Date(excelSerial)`.

Use `defaultYear(years)` para selecionar o ano padrão de filtros — retorna o ano mais recente ≤ ano atual,
evitando que datas futuras/corrompidas dominem o filtro.

---

## Branding

Textos de produto, título da aba, nome na tela de login e assinatura de e-mail vêm de `src/lib/brand.ts`.
Configure via variáveis de ambiente `NEXT_PUBLIC_BRAND_*` — não edite o arquivo para cada cliente.

---

## Exportação

- Client-side (drill modal): `exportToExcel` de `src/lib/export-utils.ts`.
- Server-side (dataset completo): `POST /api/exports/excel` com `{ rows, filename, sheetName }`.
- Ambos requerem permissão `exports.excel.create`.

---

## DashboardGroup / DashboardScreen

Campos sugeridos para grupo:

```txt
id, name, slug, description, icon, order, is_active, required_permission
```

Campos sugeridos para tela:

```txt
id, group_id, name, slug, description, layout_json, filters_json,
data_contract_id, required_permission, order, is_active
```

Ao adicionar uma tela:

1. Adicione a permissão em `contracts/permissions/permissions.yaml`.
2. Adicione/popule o grupo ou tela via seed.
3. Adicione o contrato de dados se a tela depende de fonte externa.
4. Implemente verificação de acesso no server component.
5. Atualize ou adicione testes de integridade.
