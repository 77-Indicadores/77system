# Módulo de acessos

O boilerplate registra uma visita por pessoa e tela em `UserScreenView`. O navegador envia um sinal a cada minuto enquanto a aba está visível e encerra a visita ao trocar de tela ou esconder a aba. O tempo máximo de uma visita é 12 horas. O histórico começa quando a migração é aplicada; dados anteriores não podem ser reconstruídos.

A página `/super77/acessos` é restrita à permissão `super77.access` e mostra os recortes por pessoa, tela, dia e linha a linha. A lista detalhada tem limite padrão de 500 visitas e teto de 5.000. Dashboards usam o nome e o grupo cadastrados no banco; rotas administrativas padrão são nomeadas em `src/domains/acessos/rotas.ts`. Cada sistema derivado pode acrescentar suas próprias rotas ali.

Para integração externa, defina `ACCESS_EXPORT_SECRET` com um valor aleatório exclusivo de cada instalação. O botão **Copiar link JSON** na página de acessos gera uma URL absoluta para `/api/acessos/json?secret=...` com os filtros atuais. Sem a variável, o endpoint responde 401 e o botão fica desabilitado. O endpoint retorna os quatro recortes e o resumo, aceita `de`, `ate`, `usuario`, `tela`, `busca` e `n`, e não usa sessão do navegador. Trate a URL como credencial: distribua apenas para a integração autorizada e evite registrá-la em logs.

A implantação exige aplicar as migrações Prisma antes de ativar a aplicação. `ACCESS_EXPORT_SECRET` deve ser configurada no ambiente de cada cliente, sem valor padrão no repositório.
