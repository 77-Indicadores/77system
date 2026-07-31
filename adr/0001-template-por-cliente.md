# ADR 0001: Template Isolado Por Cliente

## Status

Aceito

## Contexto

A equipe 77 nao pretende vender o sistema como SaaS multiempresa. Cada cliente tera seu proprio repositorio criado a partir de um template Git.

## Decisao

O boilerplate sera desenvolvido como sistema isolado por cliente, sem multi-tenancy.

## Consequencias

Positivas:

- Menor complexidade.
- Deploy mais simples.
- Customizacao por cliente mais direta.
- Desenvolvimento com IA mais previsivel.

Negativas:

- Atualizacoes do template para clientes existentes exigem processo de merge ou reaplicacao.
- Nao ha painel central unico para todos os clientes.

## Regras

- Nao criar `tenant_id` em todas as tabelas por padrao.
- Nao implementar isolamento multiempresa.
- Nao criar features de SaaS se nao forem necessarias para o cliente isolado.
