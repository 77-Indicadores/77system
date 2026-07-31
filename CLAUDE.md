# Claude Code Instructions

You are working on the 77System boilerplate, an internal Equipe 77 template for building one custom web system per customer. This project is designed for AI-assisted development with Claude Code, Codex and human developers.

## Operating Context

- Language: TypeScript/Next.js fullstack with Prisma/PostgreSQL.
- UI: Tailwind and reusable components under `src/components`.
- Auth/RBAC: Auth.js plus domain services under `src/domains/rbac`.
- Data: PostgreSQL, staging/materialization, cron-style jobs and SSE for progress.
- Integrations: Catworld through a Python FastAPI sidecar in `services/catworld-service`.
- Deployment/dev: Docker Compose.

## Read Before Editing

Read the docs that match the requested change:

- `README.md`
- `docs/01-arquitetura.md`
- `docs/02-dominios.md`
- `docs/03-rbac.md`
- `docs/04-indicadores.md`
- `docs/05-cadastros.md`
- `docs/06-dados-performance.md`
- `docs/07-integracao-catworld.md`
- `docs/08-contratos-de-dados.md`
- `docs/09-padroes-para-ia.md`
- `docs/12-staging-cron.md`

## Architecture Rules

- Do not add multi-tenancy. Each repo is isolated per customer.
- Do not add a dashboard visual editor for end users.
- Keep domain logic in `src/domains`, not hidden inside React components.
- Use Prisma models and typed services for data access.
- Treat YAML contracts as source of truth for permissions and data contracts.
- Keep Catworld optional and non-blocking for normal user dashboard loads.
- Use materialized/staged data for indicators by default.
- Expose technical errors and integration health only to Super77 users.

## RBAC Rules

- Any private route must declare a permission in `src/domains/rbac/routes.ts`.
- Any permission used by code must exist in `contracts/permissions/permissions.yaml`.
- Frontend visibility is not enough; backend/server code must enforce access.
- Super77 screens must require `super77.access` or a more specific technical permission.

## Indicators

Indicators use this structure:

```txt
DashboardGroup -> DashboardScreen -> Widget
```

Groups and screens may have different permissions. If adding a dashboard screen:

1. Add the permission contract.
2. Add/seed the group or screen.
3. Add the data contract if the dashboard depends on external data.
4. Implement backend access checks.
5. Add/update integrity or E2E coverage.

## Registries

Cadastros is a module hub, not one fixed CRUD. A customer may have many registry modules such as:

- Vendedores
- Centros de custo
- Filiais
- Produtos
- Metas
- Tabelas auxiliares from spreadsheets

Each registry is defined by `RegistryDefinition.schemaJson` and lives at:

```txt
/registries/{registryKey}
```

Do not hardcode all registry modules to the same fields. Use the schema fields to render forms/tables.

## Data And Performance

Never make a normal dashboard wait on Catworld or another external API unless explicitly requested and documented.

Preferred flow:

```txt
External source -> staging table -> validation -> materialized table -> dashboard
```

Use SSE only for job progress/status, not for heavy analytical payloads.

## Commands

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:integrity
pnpm build
pnpm prisma db seed
docker compose up -d
pnpm docker:health
```

Required before finishing most code changes:

```bash
pnpm test:integrity
```

Also run E2E for UI/auth/navigation/RBAC changes:

```bash
pnpm test:e2e
```

## UI/UX Standards

- Build dense, functional internal software, not marketing pages.
- Dashboards should occupy the available width and support scanning/comparison.
- Provide expected utility actions: logout, back, group tabs/shortcuts, export and filters.
- Avoid toy components and generic empty cards.
- Avoid text overflow in KPI blocks, buttons, tables and chart labels.
- Use icons from `lucide-react` where appropriate.

## Completion Checklist

- Code follows existing project patterns.
- Permissions/contracts are updated.
- Routes are protected.
- Seed remains valid.
- Dashboards use materialized/staged data when appropriate.
- Tests pass.
- Docker health is checked if services changed.
