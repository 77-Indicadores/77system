# Mapa De Melhorias

## Prioridade Alta

- Investigar runtime HTTP local: `pnpm build` passa, mas `pnpm dev`/`pnpm start` nao responderam health dentro do timeout nesta maquina.
- Melhorar Docker do app para nao depender de instalacao lenta em volume Windows.
- Adicionar runner de cron real para `DataRefreshSchedule`.
- Implementar extractor Catworld real por contrato, gravando staging antes de metricas.
- Criar badge de freshness em dashboards.
- Criar tela Super77 de logs e erros tecnicos por job.

## Frontend

- Evoluir dashboard shell para layout mais denso e operacional.
- Adicionar componentes de chart reais.
- Criar estados de loading, empty, stale e error para widgets.
- Mostrar "Atualizado em" e status fresh/stale/expired por tela.
- Melhorar login e layout mobile.
- Criar tela de usuarios e permissoes com acoes reais.

## Backend

- Implementar scheduler que transforma cron em jobs `QUEUED`.
- Separar worker continuo de worker one-shot.
- Criar tabelas fisicas de staging/metrics por contrato ou migrations geradas por feature.
- Criptografar tokens de integracao (`IntegrationConnection.encryptedToken` — campo existe mas sem servico de crypto).
- Adicionar auditoria para acoes Super77.
- Adicionar endpoint interno para disparar refresh manual com RBAC.
- Registrar handlers em `query-resolver.ts` conforme novos dashboards forem criados.

## Testes

- Adicionar teste de servidor HTTP quando runtime estiver estavel.
- Adicionar E2E de login real com banco seedado.
- Adicionar teste de bloqueio de rotas Super77 para usuario comum.
- Adicionar teste de export Excel autenticado.
- Adicionar teste do ciclo cron -> job -> staging -> metrics.

## Feito

- MetricRegistry centralizado em `src/domains/indicators/metrics.ts` com metricas financeiras base.
- `financial.ts` refatorado para usar MetricRegistry (sem calculos soltos).
- `formatCurrency` e `formatPercent` movidos para `metrics.ts` como formatters compartilhados.
- `getUserPermissionSet` em `rbac/service.ts` para eliminar N+1 em loops de permissao.
- `indicators/service.ts` usa batch de permissoes (1 query por chamada, nao por item).
- `createRegistryRecord` valida dados contra `RegistrySchema` antes de gravar.
- `query-resolver.ts` criado para mapear `Widget.queryRef` a handlers tipados.
- `ExportJob.requestedBy` adicionado ao schema para auditoria de exports.

## Orientacao Para IA

- Antes de criar dashboard, ler `docs/12-staging-cron.md`.
- Nao consultar Catworld em render de pagina de usuario sem contrato `mode: live`.
- Criar ou atualizar contrato antes de implementar widget novo.
- Ao adicionar metrica nova, registrar em `src/domains/indicators/metrics.ts` com `defineMetric`.
- Ao adicionar dashboard com widgets, registrar queryRef em `src/domains/indicators/query-resolver.ts`.
- Validar `pnpm test:integrity` antes de finalizar qualquer alteracao.
- Atualizar este mapa quando descobrir gargalo ou decisao tecnica nova.
