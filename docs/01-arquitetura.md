# Arquitetura

## Decisao Base

O boilerplate deve ser um monolito modular com suporte a jobs de dados.

Stack recomendada:

- Next.js para aplicacao web.
- Node.js/TypeScript para backend principal.
- PostgreSQL como banco principal.
- Docker Compose para ambiente local e deploy simples.
- Worker interno para jobs de importacao, refresh e exportacao.
- Servico Python interno opcional para Catworld e processamento pesado de dados.
- Worker para cron, staging, materializacao e refresh de fontes.

## Por Que Monolito Modular

Como cada cliente tera um repositorio isolado, nao existe necessidade inicial de complexidade SaaS. O monolito modular reduz custo de desenvolvimento, facilita manutencao por IA e acelera entregas personalizadas.

O codigo deve continuar separado por dominio para evitar um monolito baguncado.

## Componentes

```txt
apps/web
  UI, rotas, API routes/server actions

packages/domain
  regras de negocio e contratos internos

packages/db
  schema, migrations, repositories

packages/rbac
  engine de permissoes

packages/integrations
  contratos de integracao

services/catworld
  servico Python opcional para uso do catworld-sdk

workers
  importacoes, refresh, exportacoes
```

## Banco

PostgreSQL deve ser a fonte de verdade do sistema do cliente.

Catworld pode alimentar dashboards diretamente em alguns casos, mas dados usados de forma recorrente, pesada ou combinada com CRUDs internos devem ser materializados no Postgres.

Dashboards de usuario devem ler materializacoes locais por padrao. Consultas live em Catworld ficam restritas a excecoes declaradas em contrato e a telas tecnicas.

## SSE

SSE deve ser usado para eventos e progresso, nao para trafegar grandes volumes de dados.

Casos bons para SSE:

- Progresso de importacao.
- Refresh de fonte.
- Geracao de PDF.
- Status de jobs.
- Avisos tecnicos para `super77`.

Casos ruins para SSE:

- Enviar 1M de linhas para o frontend.
- Atualizar tabela inteira em tempo real.
- Substituir cache, paginacao ou materializacao.

## Performance Para Dados Grandes

Para tabelas com mais de 1M de linhas:

- Usar indices adequados.
- Usar paginacao cursor-based.
- Usar agregacoes no banco.
- Usar materialized views quando necessario.
- Limitar resultados por padrao.
- Cachear queries caras.
- Processar importacoes em lotes.
- Evitar renderizar datasets brutos no frontend.

## Deploy

O deploy inicial deve caber em Docker Compose:

- app
- postgres
- redis opcional
- worker
- catworld-service opcional

Redis entra quando houver necessidade real de fila, cache distribuido ou pub/sub.
