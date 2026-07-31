# 77System Boilerplate

## Objetivo

O 77System Boilerplate e um template interno da equipe 77 para substituir solucoes baseadas em Power BI por sistemas web isolados por cliente.

Cada cliente deve ter seu proprio repositorio, banco, deploy e configuracao. O boilerplate nao e multi-tenant e nao deve tentar virar um SaaS generico.

## Principios

- Um repositorio por cliente.
- Desenvolvimento feito pela equipe 77, com apoio de IA.
- Dashboards e cadastros como codigo, nao editados pelo cliente via interface.
- Catworld pronto como integracao principal, mas opcional.
- CRUDs internos para complementar dados vindos de Catworld.
- Permissoes por usuario.
- Erros tecnicos operados somente pela equipe 77.
- Visual web superior ao Power BI, com mais controle de UX, marca e performance.

## Modulos

### Indicadores

Modulo principal do sistema. Organiza dashboards em grupos e telas.

Exemplo:

- Financeiro
  - DRE
  - Fluxo de Caixa
  - Receitas
- Comercial
  - Funil
  - Vendas por Vendedor
  - Metas

Cada grupo e cada tela entram no RBAC.

### Usuarios e RBAC

Controla usuarios, papeis e permissoes por recurso.

Deve existir o papel tecnico `super77`, usado pela equipe 77 para acessar integracoes, logs, configuracoes e diagnosticos.

### Cadastros

Modulo opcional por cliente. Serve para transformar planilhas, tabelas auxiliares e configuracoes operacionais em CRUDs internos.

Exemplos:

- Centros de custo
- Vendedores
- Produtos
- Filiais
- Metas
- Parametros financeiros

### Integracoes

Modulo tecnico, visivel apenas para `super77`.

A primeira integracao oficial do boilerplate e Catworld.

### Exportacoes

Dashboards e tabelas devem poder exportar dados em Excel e relatorios em PDF quando fizer sentido para o cliente.

## Fora do Escopo Inicial

- Multi-tenancy.
- Editor visual de dashboard no frontend.
- Marketplace de conectores.
- Cliente final criando indicadores sozinho.
- Tratamento tecnico de erros pelo cliente.
