/**
 * Chaves da alçada de acesso, sem nenhuma dependência.
 *
 * Módulo próprio porque `policies.ts` puxa o Prisma e `registries/acesso.ts` puxa o
 * Auth.js: quem só precisa saber o nome de uma permissão — um teste, um script de
 * integridade — não deveria arrastar o banco e a sessão junto.
 *
 * Os `TIPO_*` precisam existir em `resource_types` no contrato de permissões, e os
 * `PERMISSAO_*` em `permissions`. `tests/rbac.test.ts` verifica os dois.
 */

export const PERMISSAO_GRUPO = "indicators.group.view";
export const PERMISSAO_TELA = "indicators.dashboard.view";
export const PERMISSAO_CADASTRO = "registries.module.view";

export const TIPO_GRUPO = "dashboard_group";
export const TIPO_TELA = "dashboard_screen";
export const TIPO_CADASTRO = "registry_module";
