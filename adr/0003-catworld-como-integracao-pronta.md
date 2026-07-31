# ADR 0003: Catworld Como Integracao Pronta

## Status

Aceito

## Contexto

A equipe 77 usa Catworld na maioria dos projetos, mas ele nao deve ser obrigatorio para todos os clientes.

## Decisao

O boilerplate tera integracao Catworld pronta e opcional, visivel e configuravel pela area `super77`.

## Consequencias

Positivas:

- Acelera projetos reais da equipe 77.
- Mantem caminho padrao para dados externos.
- Permite reaproveitar contratos e telas tecnicas.

Negativas:

- Adiciona dependencia Python opcional.
- Exige cuidado com tokens e logs.

## Regras

- Token deve ser protegido.
- Tela Catworld deve ser restrita a `super77`.
- Dashboards devem usar contratos versionados.
- Consultas livres devem ser tecnicas e read-only.
