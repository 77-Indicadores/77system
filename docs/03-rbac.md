# RBAC

## Modelo

O RBAC deve controlar acesso por usuario, papel, permissao e recurso.

Nao usar apenas flags como `is_admin` ou `is_super77`.

## Papel Tecnico

Deve existir o role:

```txt
super77
```

Esse papel representa a equipe 77 dentro do sistema do cliente.

## Permissoes Base

```txt
indicators.group.view
indicators.group.manage
indicators.dashboard.view
indicators.dashboard.manage

registries.module.view
registries.module.manage
registries.record.view
registries.record.manage

exports.excel.create
exports.pdf.create

integrations.catworld.view
integrations.catworld.manage

system.jobs.view
system.logs.view
system.settings.manage
super77.access
```

## Recursos

Permissoes podem ser globais ou apontar para recursos especificos.

Tipos de recurso:

```txt
dashboard_group
dashboard_screen
registry_module
integration
system_area
```

## Exemplos

Usuario com acesso ao grupo financeiro:

```txt
permission: indicators.group.view
resource_type: dashboard_group
resource_id: financeiro
```

Usuario com acesso a tela de DRE:

```txt
permission: indicators.dashboard.view
resource_type: dashboard_screen
resource_id: financeiro.dre
```

Equipe 77:

```txt
role: super77
permissions:
  - super77.access
  - integrations.catworld.manage
  - system.jobs.view
  - system.logs.view
  - system.settings.manage
```

## Regras

- Todo dashboard deve declarar permissao minima.
- Todo grupo de dashboard deve declarar permissao minima.
- A UI deve esconder o que o usuario nao pode ver.
- O backend deve validar permissao sempre, mesmo quando a UI ja escondeu.
- `super77` deve poder acessar areas tecnicas, mas isso ainda deve passar pelo engine de permissao.

---

## Segregação de dados (Row-Level Security)

RBAC controla acesso a *telas*. Segregação controla acesso a *linhas de dado* dentro de uma tela.

Use quando um usuário deve ver apenas parte dos dados — por empresa, filial, obra, correntista etc.

### Modelo

```txt
UserScope: userId | dimension | value
```

- `dimension` — nome lógico da dimensão (ex: `"empresa"`, `"filial"`, `"obra"`)
- `value` — valor exato permitido no campo materializado

Usuário sem nenhum scope para uma dimensão vê tudo (comportamento admin).
Usuário com scopes vê apenas linhas onde o campo da dimensão está na lista de values.

### Uso em serviços de domínio

```ts
import { getCurrentUserScopeMap, scopeFilter } from "@/domains/rbac/scope";

const scope = await getCurrentUserScopeMap();

const rows = await prisma.infratechFaturamento.findMany({
  where: {
    ...scopeFilter(scope, "empresa", "empresaNome"),
    // outros filtros normais
    ano,
  },
});
```

### API de gestão

```
GET    /api/users/:id/scopes                         lista scopes do usuário
PUT    /api/users/:id/scopes  { dimension, values }  substitui scopes de uma dimensão
DELETE /api/users/:id/scopes?dimension=empresa       limpa uma dimensão (ou todas)
```

Requer permissão `system.settings.manage`.

### Dimensões convencionais

| Dimensão | Campo típico no model Prisma |
|---|---|
| `empresa` | `empresaNome` |
| `filial` | `filialCodigo` |
| `obra` | `obraCodigo` |
| `correntista` | `correntistaNome` |

Documente as dimensões usadas por projeto no contrato de dados correspondente.
