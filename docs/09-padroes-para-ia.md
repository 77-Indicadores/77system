# Padroes Para Desenvolvimento Com IA

## Objetivo

Este boilerplate deve ser facil para Claude, Codex e outros agentes entenderem e alterarem com seguranca.

## Regras

- Cada dominio deve ter documentacao propria.
- Cada dashboard deve declarar contrato de dados.
- Cada rota protegida deve declarar permissao.
- Cada CRUD deve ter schema claro.
- Nomes devem ser estaveis e descritivos.
- Evitar logica critica escondida em componentes de UI.
- Separar consulta, regra de negocio e apresentacao.
- Nao fazer dashboard de usuario depender de Catworld live por padrao.
- Usar staging e materializacao quando o contrato declarar `mode: materialized`.

## Estrutura Esperada Por Feature

```txt
feature/
  README.md
  schema.ts
  repository.ts
  service.ts
  permissions.ts
  routes.ts
  components/
  tests/
```

## Prompt Base Para Novas Features

```txt
Leia os docs do dominio, o contrato de dados e as permissoes antes de implementar.
Mantenha o padrao existente.
Nao crie editor visual.
Nao assuma multi-tenancy.
Nao troque materializacao por live sem decisao explicita.
Respeite que este repositorio e isolado por cliente.
```

## Checklist Antes De Finalizar

- A feature respeita RBAC?
- Existe contrato de dados quando envolve indicador?
- Existe limite/paginacao para dados grandes?
- Existe staging/materializacao quando a fonte externa alimenta dashboard?
- O dashboard mostra freshness ou ultima atualizacao?
- Exportacao respeita permissao?
- Erros tecnicos ficam visiveis para Super77?
- O frontend nao mostra opcoes sem permissao?
- O backend valida permissao novamente?
