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
