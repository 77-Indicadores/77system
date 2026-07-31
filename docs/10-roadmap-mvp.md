# Roadmap MVP

## Fase 1: Base

- Criar app Next.js.
- Criar Docker Compose.
- Configurar PostgreSQL.
- Criar autenticacao.
- Criar usuarios.
- Criar roles e permissoes.
- Criar papel `super77`.

## Fase 2: Indicadores

- Criar grupos de dashboards.
- Criar telas de dashboards.
- Aplicar RBAC em grupos e telas.
- Criar componentes base de widgets.
- Criar contrato de dados de exemplo.

## Fase 3: Catworld

- Criar servico Python interno.
- Integrar `catworld-sdk`.
- Criar tela Super77 de configuracao.
- Testar conexao.
- Listar projetos, datasets e tabelas.
- Executar query read-only de teste.
- Registrar logs tecnicos.

## Fase 4: Cadastros

- Criar motor simples de CRUD declarativo.
- Criar importacao de planilhas.
- Criar validacao de campos.
- Criar logs de erro para Super77.

## Fase 5: Dados Grandes

- Criar jobs.
- Criar DataSource.
- Criar DataRefreshSchedule com cron.
- Criar DataSyncJob.
- Criar staging/materializacao por contrato.
- Criar progresso via SSE.
- Criar materializacao no Postgres.
- Criar cache de queries.
- Criar paginacao para tabelas.

## Fase 6: Exportacoes

- Exportar tabela para Excel.
- Exportar dashboard para PDF.
- Rodar exportacoes grandes como job.
- Mostrar progresso via SSE.

## Fase 7: Template Git

- Limpar dados de exemplo.
- Criar guia para novo cliente.
- Criar checklist de bootstrap.
- Criar contrato padrao de dashboard.
- Criar contrato padrao de CRUD.

## Fase 8: Primeiro Cliente Piloto

- Escolher um cliente real.
- Mapear grupos e telas que substituem Power BI.
- Mapear usuarios e permissoes.
- Conectar Catworld.
- Criar primeiro dashboard real.
- Criar primeiro CRUD complementar.
- Validar exportacao Excel/PDF.
- Medir performance com dados reais.
