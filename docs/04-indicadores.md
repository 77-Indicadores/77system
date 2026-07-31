# Indicadores

## Estrutura

O modulo de indicadores organiza telas em dois niveis:

```txt
grupo > tela
```

Um grupo pode conter varias telas.

## DashboardGroup

Campos sugeridos:

```txt
id
name
slug
description
icon
order
is_active
required_permission
```

## DashboardScreen

Campos sugeridos:

```txt
id
group_id
name
slug
description
layout_json
filters_json
data_contract_id
required_permission
order
is_active
```

## Widget

Campos sugeridos:

```txt
id
dashboard_screen_id
type
title
query_ref
visualization_config_json
position_json
refresh_policy
```

## Tipos De Widget

Tipos iniciais:

- KPI
- line_chart
- bar_chart
- area_chart
- pie_chart
- table
- pivot_table
- ranking
- status_card

## Desenvolvimento Com IA

Dashboards devem ser implementados por codigo. A IA deve ler:

- Contrato de dados.
- Permissoes necessarias.
- Layout esperado.
- Regra de negocio do indicador.

O frontend nao precisa ter editor visual para usuario final.

## Exportacao

Cada dashboard pode declarar se suporta:

- Exportacao Excel.
- Exportacao PDF.
- Exportacao de dados brutos filtrados.

Exportacao deve respeitar RBAC.
