# 77System Boilerplate

Template interno da equipe 77 para criar sistemas web de indicadores, cadastros e integracoes por cliente.

Este projeto nasce para substituir entregas baseadas em Power BI por aplicacoes web mais bonitas, controladas e personalizadas.

## Decisoes Principais

- Um repositorio por cliente.
- Sem multi-tenancy.
- Sem editor visual de dashboard para usuario final.
- Dashboards desenvolvidos como codigo pela equipe 77 com apoio de IA.
- Catworld como integracao pronta e opcional.
- CRUDs internos para complementar dados e substituir planilhas.
- Permissoes por usuario, papel e recurso.
- Area tecnica `super77` para equipe 77.
- Exportacao Excel/PDF como capacidade base.
- SSE usado para progresso/eventos, nao para grandes datasets.
- Dashboards leem dados materializados por padrao; Catworld live e excecao.
- Refresh de fontes por cron e jobs tecnicos na area `super77`.

## Documentacao

- [Guia Para Codex](AGENTS.md)
- [Guia Para Claude Code](CLAUDE.md)
- [Visao do Produto](docs/00-visao-produto.md)
- [Arquitetura](docs/01-arquitetura.md)
- [Dominios](docs/02-dominios.md)
- [RBAC](docs/03-rbac.md)
- [Indicadores](docs/04-indicadores.md)
- [Cadastros](docs/05-cadastros.md)
- [Dados e Performance](docs/06-dados-performance.md)
- [Integracao Catworld](docs/07-integracao-catworld.md)
- [Contratos de Dados](docs/08-contratos-de-dados.md)
- [Padroes Para IA](docs/09-padroes-para-ia.md)
- [Roadmap MVP](docs/10-roadmap-mvp.md)
- [Staging, Materializacao E Cron](docs/12-staging-cron.md)
- [Mapa De Melhorias](docs/13-mapa-melhorias.md)

## Contratos

- [Permissoes](contracts/permissions/permissions.yaml)
- [Exemplo de Contrato de Dados](contracts/data/financial-revenue-summary.yaml)

## ADRs

- [ADR 0001: Template Isolado Por Cliente](adr/0001-template-por-cliente.md)
- [ADR 0002: Monolito Modular](adr/0002-monolito-modular.md)
- [ADR 0003: Catworld Como Integracao Pronta](adr/0003-catworld-como-integracao-pronta.md)

## Stack Planejada

- Next.js
- TypeScript
- PostgreSQL
- Docker Compose
- Worker para jobs
- Servico Python opcional para Catworld e processamento pesado

## Regra De Ouro

Antes de implementar qualquer feature, leia os documentos do dominio afetado, os contratos de dados e as permissoes envolvidas.
