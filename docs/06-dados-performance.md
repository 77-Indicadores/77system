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

## Filtros: URL vs Client-Side

### Problema

Filtros na URL causam re-render do servidor a cada mudanca. Cada clique dispara uma nova query SQL e um round-trip de rede. Resultado: filtros que demoram 5-30 s em vez de ser instantaneos.

### Regra

Separe os filtros em dois grupos:

| Tipo | Onde fica | Quando usar |
|------|-----------|-------------|
| **Periodo / Comparacao** | URL (`searchParams`) | Muda o intervalo de datas — o servidor precisa carregar dados diferentes |
| **Dimensao** (marca, vendedor, canal, curva...) | `useState` + `useMemo` | Filtra/agrega os dados ja carregados — zero round-trip |

### Padrao Grain (client-side filtering)

O servidor carrega **todas as linhas do periodo** sem filtros dimensionais.
O componente cliente filtra via `useMemo` — sem nenhum request ao servidor.

```
GET /dashboard/vendas           (periodo = "ano-atual")
  Server:  SELECT * FROM fato_vendas WHERE data BETWEEN ...   ← sem filtro de marca/vendedor
  Client:  useMemo(() => rows.filter(r => marcas.includes(r.marca)), [rows, marcas])
```

Exemplo em `src/app/(app)/dashboard/_screens/financial-dashboard-client.tsx`.

### Quando NAO usar grain

- Tabela de fato tem mais de ~500k linhas no periodo — o payload JSON fica pesado demais.
- A dimensao muda a semantica do calculo (ex: filtro de marca que altera JOIN com outra tabela).
- Nesse caso, mantenha o filtro na URL mas certifique-se de que a query tem os indices certos.

### Indices obrigatorios em tabelas de fato

Toda tabela de fato (`fato_*`) que serve dashboards deve ter indices nas colunas mais filtradas.
Sem eles, cada query com filtro de data faz full table scan — causando lentidao de 10-30 s.

**Minimo obrigatorio:**

```prisma
model FatoVendas {
  // ...
  dataFaturamento DateTime? @map("data_faturamento")
  isLiquida       Boolean   @map("is_liquida")
  classificacao   String?
  clienteId       String?   @map("cliente_id")

  @@index([dataFaturamento])                  // filtro de periodo — CRITICO
  @@index([isLiquida, dataFaturamento])       // combo mais frequente
  @@index([classificacao])                    // WHERE classificacao = 'TRATAMENTO'
  @@index([clienteId])                        // JOINs por cliente
  @@index([vendedorNome])
  @@index([marca])
  @@index([canal])
}
```

Adicione o indice na coluna de data de cada nova tabela de fato antes de ligar o dashboard.

### Multi-vendedor por cliente (ARRAY_AGG)

Quando um cliente pode ter mais de um vendedor (venda por rep diferente), use `ARRAY_AGG`
para incluir os vendedores no grain e filtrar client-side:

```sql
vendedores_por_cliente AS (
  SELECT cliente_id,
    ARRAY_AGG(DISTINCT vendedor_nome) FILTER (
      WHERE vendedor_nome IS NOT NULL AND vendedor_nome <> ''
    ) AS vendedores
  FROM fato_vendas
  WHERE ...
  GROUP BY 1
)
```

No client: `clientes.filter(c => c.vendedores.some(v => vendedor.includes(v)))`.

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
