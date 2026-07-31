# Contratos De Dados

## Objetivo

Contratos de dados orientam desenvolvimento com IA e reduzem ambiguidade.

Cada dashboard ou widget relevante deve apontar para um contrato.

## Contrato Minimo

```yaml
id: financial-revenue-summary
name: Resumo de Receita
domain: financeiro
source:
  type: catworld
  dataset: financeiro
  mode: materialized
refresh:
  strategy: scheduled
  cron: "*/15 * * * *"
  timezone: "America/Sao_Paulo"
query:
  ref: financial.revenue_summary
staging:
  table: stg_financial_revenue
  retention_days: 30
materialization:
  table: metric_financial_revenue_summary
  incremental: true
  freshness_seconds: 900
  allow_live_fallback: false
inputs:
  - name: start_date
    type: date
    required: true
  - name: end_date
    type: date
    required: true
outputs:
  - name: date
    type: date
    required: true
  - name: revenue
    type: decimal
    required: true
permissions:
  - indicators.dashboard.view
performance:
  default_limit: 10000
  timeout_seconds: 30
  cache_ttl_seconds: 300
exports:
  excel: true
  pdf: true
```

## Regras Para IA

Ao criar ou alterar um indicador, a IA deve:

- Ler o contrato antes de implementar.
- Nao inventar colunas.
- Nao remover filtros obrigatorios.
- Respeitar permissoes.
- Respeitar limites de performance.
- Nao trocar `materialized` por `live` sem decisao explicita.
- Preservar staging/materialization em dashboards de usuario.
- Atualizar contrato quando mudar a saida.
- Criar ou ajustar testes quando houver regra de negocio.

## Versionamento

Contratos devem ser versionados junto com o codigo do cliente.

Mudancas em contrato que quebrem dashboard existente devem ser tratadas como breaking change.
