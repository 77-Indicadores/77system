# Integracao Catworld

## Objetivo

Catworld e a integracao de dados principal do boilerplate, mas deve continuar opcional por cliente.

Como a equipe 77 usa Catworld na maioria dos casos, o boilerplate deve trazer essa integracao pronta.

## SDK

O pacote oficial e `catworld-sdk`.

Recursos confirmados:

- `query`
- `upload`
- `projects`
- `datasets`
- `tables`
- `sources`
- `rows`
- `live_query`
- `refresh_source`

Fonte: https://pypi.org/project/catworld-sdk/

## Arquitetura Recomendada

Usar um servico Python interno para encapsular o SDK.

```txt
Next.js app -> Integration service/repository -> catworld-service -> Catworld API
```

Motivos:

- SDK oficial e Python.
- Facilita uso de pandas/dataframe quando necessario.
- Isola falhas da integracao.
- Evita misturar detalhes do SDK no app principal.

## Tela Super77

A area Super77 deve permitir:

- Cadastrar base URL.
- Cadastrar token.
- Testar conexao.
- Listar projetos.
- Listar datasets.
- Listar tabelas.
- Ver fontes.
- Executar query read-only de teste.
- Disparar refresh de fonte.
- Ver logs e erros.

## Seguranca

- Token Catworld nunca deve aparecer para usuario comum.
- Token deve ser criptografado em repouso.
- Logs nao devem expor token.
- Queries livres devem ser limitadas a usuarios `super77`.
- Queries de dashboard devem vir de contratos versionados.

## Uso Em Dashboards

Existem dois modos:

### Live

Dashboard consulta Catworld no momento da requisicao.

Usar quando:

- Dados sao pequenos.
- Latencia e aceitavel.
- Query e simples.

### Materializado

Job busca dados do Catworld e grava no Postgres.

Usar quando:

- Tabela e grande.
- Indicador e muito acessado.
- Dados precisam cruzar com CRUD interno.
- Exportacao depende do resultado.
