# Perguntas Respondidas

## O sistema sera vendido como SaaS?

Nao. Sera usado como template interno. Cada cliente tera um repositorio isolado.

## Vai ter multi-tenancy?

Nao. Cada cliente tera banco, deploy e configuracao separados.

## Quem desenvolve dashboards e cadastros?

A equipe 77, com apoio de IA como Codex e Claude.

## Cliente final cria dashboards pelo frontend?

Nao no escopo inicial. Dashboards sao desenvolvidos como codigo.

## Catworld e obrigatorio?

Nao, mas deve vir pronto porque e usado na maioria dos projetos da equipe 77.

## Quais fontes de dados principais?

Catworld e CRUDs internos. Planilhas podem entrar por importacao para virar cadastro ou tabela materializada.

## O sistema substitui Power BI?

Sim. O objetivo e entregar dashboards web mais bonitos, flexiveis e personalizados.

## Vai exportar Excel e PDF?

Sim. Exportacoes devem respeitar permissoes e podem rodar como jobs quando forem pesadas.

## Quem resolve erros tecnicos?

Somente a equipe 77. Erros tecnicos devem aparecer na area `super77`.

## Permissao sera por usuario?

Sim. O modelo tambem suporta papeis e recursos para evitar configuracoes repetitivas.

## SSE resolve dados grandes?

Nao. SSE serve para progresso e eventos. Dados grandes devem usar paginacao, agregacao, cache, indices, materializacao e jobs.
