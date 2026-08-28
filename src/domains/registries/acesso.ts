import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserPermissionSet, getUserResourcePolicies } from "@/domains/rbac/service";
import { PERMISSAO_CADASTRO, TIPO_CADASTRO } from "@/domains/rbac/recursos";

/**
 * Quem enxerga cada cadastro.
 *
 * Antes era tudo ou nada: `registries.module.view` liberava o menu e, dentro dele, todos
 * os cadastros. Não dava para entregar ao cliente só um módulo — ou ele via tudo, ou não
 * via nada.
 *
 * A segregação segue o mesmo desenho dos indicadores: a permissão global libera geral, e
 * a política de recurso libera um cadastro específico. Quem tem `registries.module.view`
 * no papel continua vendo tudo, então a equipe 77 não muda de comportamento.
 *
 * A lista de cadastros concedíveis sai do banco (`RegistryDefinition` ativos), e não de
 * uma constante: este repositório é boilerplate, e cada cliente cadastra os módulos dele
 * pelo seed. Uma lista fixa no código obrigaria a editar o código a cada cadastro novo.
 */

// Reexportados para quem já lia daqui; a definição vive em rbac/recursos.ts.
export { PERMISSAO_CADASTRO };
export const TIPO_RECURSO = TIPO_CADASTRO;

export type CadastroConcedivel = {
  chave: string;
  nome: string;
  href: string;
};

/** Os cadastros que podem ser concedidos, para a tela de Usuários montar a lista. */
export async function listarCadastrosConcediveis(): Promise<CadastroConcedivel[]> {
  const definicoes = await prisma.registryDefinition.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { key: true, name: true },
  });
  return definicoes.map((d) => ({
    chave: d.key,
    nome: d.name,
    href: `/registries/${d.key}`,
  }));
}

/** As chaves dos cadastros que este usuário enxerga. */
export async function cadastrosVisiveis(): Promise<string[]> {
  const sessao = await auth();
  if (!sessao?.user?.email) return [];

  const [globais, politicas, catalogo] = await Promise.all([
    getUserPermissionSet(sessao.user.email),
    getUserResourcePolicies(sessao.user.email),
    listarCadastrosConcediveis(),
  ]);

  // A permissão global continua valendo para tudo: é o acesso da equipe.
  if (globais.has(PERMISSAO_CADASTRO)) {
    return catalogo.map((c) => c.chave);
  }

  const concedidos = new Set(
    politicas
      .filter((p) => p.permissionKey === PERMISSAO_CADASTRO && p.resourceType === TIPO_RECURSO)
      .map((p) => p.resourceId),
  );
  return catalogo.filter((c) => concedidos.has(c.chave)).map((c) => c.chave);
}

/**
 * Barra a entrada num cadastro que o usuário não pode ver.
 *
 * Devolve true/false em vez de lançar: a página decide entre `notFound()` e uma mensagem.
 */
export async function podeVerCadastro(chave: string): Promise<boolean> {
  return (await cadastrosVisiveis()).includes(chave);
}
