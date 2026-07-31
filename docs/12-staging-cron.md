# Staging, Materializacao E Cron

## Decisao

Dashboards de usuario devem ler dados locais materializados por padrao.

O sistema nao deve fazer o usuario esperar Catworld, planilha externa ou API lenta responder durante a abertura de uma pagina comum.

## Fluxo Padrao

```txt
Catworld / CRUD / planilha
  -> staging bruto
  -> modelagem/tratamento
  -> metricas/materializacao
  -> dashboard
```

## Quando Usar Live

Modo live e permitido apenas quando o contrato declarar explicitamente:

```yaml
source:
  mode: live
```

Casos aceitaveis:

- Preview tecnico Super77.
- Teste de query.
- Dataset pequeno.
- Diagnostico.
- Tela onde latencia externa e aceitavel.

## Quando Usar Materializado

Usar materializacao quando:

- Dashboard e acessado por usuario final.
- Dados cruzam Catworld e CRUD interno.
- Dataset e grande.
- Exportacao depende do resultado.
- A origem externa pode ser lenta ou instavel.

## Agendamento

Cada fonte materializada pode ter um cron:

```yaml
refresh:
  strategy: scheduled
  cron: "*/15 * * * *"
  timezone: America/Sao_Paulo
```

O worker deve:

- buscar jobs agendados;
- carregar dados para staging;
- validar contrato;
- transformar para tabelas de metricas;
- registrar linhas lidas/escritas;
- registrar erro tecnico para Super77;
- nunca expor token ou stack trace sensivel ao usuario comum.

## Freshness

Dashboards devem exibir o estado dos dados:

```txt
Atualizado em 10:42
```

Estados recomendados:

- fresh
- stale
- expired
- missing

Se o dado estiver expirado, a tela deve continuar abrindo com o ultimo snapshot valido quando existir.

## Regra De Ouro

Catworld live e excecao. Materializacao local e padrao.
