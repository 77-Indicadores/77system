# Dados E Performance

## Direcao

O sistema deve substituir Power BI com melhor experiencia web, mas sem tentar carregar datasets inteiros no navegador.

## Regras Para Grandes Volumes

Para tabelas acima de 1M de linhas:

- Nunca retornar tudo ao frontend.
- Sempre filtrar, agregar ou paginar.
- Criar indices para filtros frequentes.
- Usar materialized views para indicadores pesados.
- Usar jobs para processamento demorado.
- Usar cache para queries repetidas.

## Camadas De Dados

```txt
source
  Catworld, CRUD, importacao

staging
  dados brutos importados ou sincronizados

model
  tabelas tratadas para negocio

metrics
  agregacoes usadas por dashboards

presentation
  payload final para widgets
```

Dashboards devem ler a camada `presentation` ou `metrics`, nunca depender diretamente de fonte externa lenta por padrao.

## Queries

Queries devem ter:

- Nome.
- Dono.
- Contrato de entrada.
- Contrato de saida.
- Limite padrao.
- Timeout.
- Politica de cache.
- Permissao necessaria.

## Materializacao

Materializar quando:

- Query passa de alguns segundos.
- Dashboard e acessado frequentemente.
- Existe juncao entre Catworld e CRUD interno.
- Fonte externa e instavel ou lenta.

## Cron E Refresh

Fontes materializadas devem ter refresh manual ou agendado. O agendamento padrao recomendado para dados operacionais e cron configuravel por Super77.

Exemplo:

```txt
*/15 * * * *
```

O refresh deve rodar em worker e registrar status, progresso, linhas lidas, linhas escritas, erro e duracao.

## Exportacao

Excel e PDF devem rodar em job quando:

- Dataset for grande.
- PDF tiver muitas paginas.
- Consulta depender de fonte externa.

O progresso pode ser entregue via SSE.
