# Codex Agent Guide

This repository is an internal 77System boilerplate for one isolated customer per repo. It is built to replace Power BI deliveries with a custom web system maintained by Equipe 77 and AI agents.

## First Read

Before changing code, read the documents related to the area you will touch:

- Product and scope: `docs/00-visao-produto.md`
- Architecture: `docs/01-arquitetura.md`
- Domains: `docs/02-dominios.md`
- RBAC: `docs/03-rbac.md`
- Indicators: `docs/04-indicadores.md`
- Registries: `docs/05-cadastros.md`
- Data/performance: `docs/06-dados-performance.md`
- Catworld: `docs/07-integracao-catworld.md`
- Data contracts: `docs/08-contratos-de-dados.md`
- AI standards: `docs/09-padroes-para-ia.md`
- Staging/materialization/cron: `docs/12-staging-cron.md`

## Non-Negotiables

- One repo per customer. Do not add global multi-tenancy or `tenant_id`.
- Dashboards are code-driven. Do not add a visual dashboard editor for end users.
- Catworld is optional and must not block normal dashboard page loads.
- Dashboard pages should read materialized data by default.
- Use staging, materialization and scheduled jobs for external or heavy datasets.
- RBAC must be enforced in backend and reflected in frontend navigation.
- Super77-only technical features must stay restricted to Equipe 77.
- Every protected route must declare a permission in `src/domains/rbac/routes.ts`.
- Every permission used by code must exist in `contracts/permissions/permissions.yaml`.
- Every indicator backed by external data should have a data contract in `contracts/data/`.

## Commands

Use pnpm.

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:integrity
pnpm build
pnpm prisma db seed
docker compose up -d
```

Before considering a change complete, run at least:

```bash
pnpm test:integrity
```

For UI/navigation/auth changes, also run:

```bash
pnpm test:e2e
```

For Docker/service changes, run:

```bash
docker compose up -d
pnpm docker:health
```

## Project Shape

- `src/app`: Next.js App Router pages, route handlers and layouts.
- `src/domains`: business/domain logic. Prefer changing this before pushing logic into UI.
- `src/components`: reusable UI and dashboard widgets.
- `prisma/schema.prisma`: database schema.
- `prisma/seed.ts`: initial super77 user, RBAC, dashboard screens, data contracts and registry modules.
- `contracts/permissions`: RBAC source of truth.
- `contracts/data`: indicator data contracts.
- `scripts`: integrity checks, workers and operational scripts.
- `services/catworld-service`: FastAPI wrapper for `catworld-sdk`.
- `tests`: Vitest and Playwright coverage.

## Domain Rules

### Indicators

Indicators are organized as:

```txt
DashboardGroup -> DashboardScreen -> Widget
```

Groups and screens have `requiredPermission`. A user may see one screen in a group and not another. Never rely only on hiding links; backend access must be checked.

### Registries

Registries are modules inside the Cadastros area. `/registries` is only the hub. Each registry has its own route:

```txt
/registries/{registryKey}
```

Forms and tables must be generated from `RegistryDefinition.schemaJson`. Do not hardcode all registries to `nome/meta/ativo`.

### Data

External data should flow like this:

```txt
Source -> Staging -> Validation -> Materialized Tables -> Dashboard
```

SSE is for progress/status events, not for streaming large analytical datasets into dashboards.

### Catworld

Catworld belongs behind `services/catworld-service` and Super77 configuration screens. Normal users should not need Catworld to respond live to open a dashboard.

## UI Expectations

- Build actual internal tools, not landing pages.
- Dashboards should use full available width and dense, scannable layouts.
- Provide utility actions where expected: logout, back navigation, group shortcuts, export, filters.
- Avoid toy-looking charts and generic cards when building executive dashboards.
- Avoid nesting cards inside cards.
- Keep text legible and prevent overflow in KPIs, buttons, tables and charts.

## Integrity Checklist

When a feature is done, verify:

- TypeScript passes.
- Lint passes.
- Prisma schema validates.
- Contracts validate.
- RBAC integrity passes.
- Private routes declare permissions.
- Seed still creates `super77`.
- E2E smoke still logs in and reaches critical pages.
- Large data paths use materialized/staged reads where appropriate.
