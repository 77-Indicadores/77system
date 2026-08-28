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

## Alçada de acesso (concessão por usuário)

A permissão do papel é **global**: quem tem `indicators.dashboard.view` vê todas as telas.
A alçada é o outro lado — concede **um recurso específico** a **um usuário específico**,
gravando em `ResourcePolicy`.

Por isso o papel `operador` **não** recebe `indicators.group.view`,
`indicators.dashboard.view` nem `registries.module.view` no contrato. Se recebesse, todo
operador veria tudo e a alçada seria decorativa.

### Modelo

```txt
ResourcePolicy: userId | permissionId | resourceType | resourceId
```

`resourceId` guarda o **slug** (ou a `key` do cadastro), nunca o id do banco — é com o
slug que `listVisibleDashboardGroups`, `requireDashboardAccess` e `cadastrosVisiveis`
comparam. Gravar o id faz a política aparecer marcada na tela e não conceder nada.

| O que se concede | `resourceType` | `resourceId` | permissão |
|---|---|---|---|
| Grupo de indicadores | `dashboard_group` | slug do grupo | `indicators.group.view` |
| Tela de indicadores | `dashboard_screen` | slug da tela | `indicators.dashboard.view` |
| Cadastro | `registry_module` | `key` do `RegistryDefinition` | `registries.module.view` |

### Regra de resolução

- Conceder o **grupo** libera o bloco inteiro, telas incluídas.
- Conceder **telas soltas** libera apenas elas — o grupo não é necessário.
- A permissão **global** do papel continua liberando tudo (é o acesso da equipe 77).

### Onde vive

```txt
src/domains/rbac/policies.ts        catálogo, leitura e gravação da alçada
src/domains/registries/acesso.ts    cadastros visíveis e bloqueio por URL
src/domains/indicators/service.ts   resolução de grupos e telas visíveis
src/app/(app)/users                 painel "Alçada de acesso"
```

O catálogo de cadastros concedíveis sai de `RegistryDefinition` ativos, não de uma
constante: cada cliente cadastra os módulos dele pelo seed, sem editar código.

### API de gestão

```
GET  /api/users/:id/policies                                    alçada atual, em slugs
PUT  /api/users/:id/policies  { grupos, telas, cadastros }      substitui o conjunto
```

Requer permissão `users.manage`. O `PUT` é substituição completa: o que não vier na lista
é revogado, em transação.

### Convite de acesso

Usuário novo nasce com senha aleatória que ninguém conhece e recebe um link de definição
de senha válido por **24 horas** (`INVITE_TTL_MS`). Se o SMTP falhar, a conta continua
criada e a tela devolve o link para o administrador entregar por outro caminho — o erro
volta como texto, não derruba a tela.

Um operador recém-criado **não enxerga nada** até receber a alçada.

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
