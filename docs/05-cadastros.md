# Cadastros

## Objetivo

Cadastros existem para substituir planilhas auxiliares e permitir que dados internos complementem os indicadores.

O modulo e opcional por cliente.

## Exemplos

- Centros de custo.
- Filiais.
- Vendedores.
- Produtos.
- Metas.
- Categorias financeiras.
- Parametros comerciais.

## Modelo

Para CRUDs simples, o boilerplate pode usar definicoes declarativas.

```yaml
id: cost-centers
name: Centros de Custo
fields:
  - name: code
    type: string
    required: true
  - name: name
    type: string
    required: true
  - name: active
    type: boolean
    default: true
```

Para CRUDs complexos, criar modulo especifico no codigo.

## Importacao De Planilhas

Fluxo esperado:

1. Equipe 77 cria definicao do cadastro.
2. Equipe 77 sobe planilha ou configura importador.
3. Sistema valida campos.
4. Sistema registra erros tecnicos para `super77`.
5. Dados passam a compor dashboards e regras internas.

## Regra

Cliente final nao deve precisar entender erro tecnico de importacao. A equipe 77 opera falhas e ajustes.
