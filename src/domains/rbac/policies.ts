import { prisma } from "@/lib/prisma";

/** O suficiente do PrismaClient para a limpeza; o seed passa o cliente dele. */
type ClientePrisma = Pick<
  typeof prisma,
  "dashboardGroup" | "dashboardScreen" | "registryDefinition" | "resourcePolicy"
>;
import { listarCadastrosConcediveis } from "@/domains/registries/acesso";
import {
  PERMISSAO_CADASTRO,
  PERMISSAO_GRUPO,
  PERMISSAO_TELA,
  TIPO_CADASTRO as TIPO_RECURSO,
  TIPO_GRUPO,
  TIPO_TELA,
} from "@/domains/rbac/recursos";

/**
 * Alçada de acesso por usuário: quais grupos, telas e cadastros ele enxerga.
 *
 * O `ResourcePolicy` sempre existiu no schema e o `rbac/service.ts` já o consulta ao
 * decidir acesso — mas nada nunca o escrevia. Sem isso o papel `operador` só teria as
 * permissões amplas do contrato, e conceder acesso a uma tela específica era impossível.
 * Este módulo é o lado que faltava.
 *
 * A concessão é por usuário (userId), não por papel: papel continua sendo permissão
 * global, declarada no contrato de permissões.
 *
 * O `resourceId` guarda o SLUG, e não o id do banco — é com o slug que
 * `listVisibleDashboardGroups` e `requireDashboardAccess` comparam. Gravar o id faria a
 * política aparecer marcada na tela e não conceder absolutamente nada.
 */
// Reexportados para quem já lia daqui; a definição vive em rbac/recursos.ts.
export { PERMISSAO_GRUPO, PERMISSAO_TELA, TIPO_GRUPO, TIPO_TELA };

export type PoliticaUsuario = {
  grupos: string[];     // slugs de DashboardGroup
  telas: string[];      // slugs de DashboardScreen
  cadastros: string[];  // chaves de RegistryDefinition
};

export type GrupoCatalogo = {
  slug: string;
  name: string;
  screens: { slug: string; name: string }[];
};

/** Catálogo do que pode ser concedido, para a interface montar a lista. */
export async function listarRecursosConcediveis(): Promise<{
  grupos: GrupoCatalogo[];
  cadastros: { chave: string; nome: string }[];
}> {
  const [grupos, cadastros] = await Promise.all([
    prisma.dashboardGroup.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: {
        slug: true,
        name: true,
        screens: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          select: { slug: true, name: true },
        },
      },
    }),
    listarCadastrosConcediveis(),
  ]);
  return {
    grupos,
    cadastros: cadastros.map((c) => ({ chave: c.chave, nome: c.nome })),
  };
}

/** O que o usuário tem hoje, em slugs. */
export async function getPoliticasDoUsuario(userId: string): Promise<PoliticaUsuario> {
  const policies = await prisma.resourcePolicy.findMany({
    where: { userId },
    select: { resourceType: true, resourceId: true },
  });
  const doTipo = (tipo: string) =>
    policies.filter((p) => p.resourceType === tipo).map((p) => p.resourceId);

  // Já são slugs/chaves; não há o que traduzir.
  return {
    grupos: doTipo(TIPO_GRUPO),
    telas: doTipo(TIPO_TELA),
    cadastros: doTipo(TIPO_RECURSO),
  };
}

/**
 * As políticas de vários usuários, em uma consulta só.
 *
 * A tela de Usuários chamava `getPoliticasDoUsuario` por usuário: trinta pessoas, trinta
 * consultas, todas na renderização da página. Aqui é uma só, agrupada em memória.
 */
export async function getPoliticasDeUsuarios(
  userIds: string[],
): Promise<Record<string, PoliticaUsuario>> {
  const vazia = (): PoliticaUsuario => ({ grupos: [], telas: [], cadastros: [] });
  const porUsuario: Record<string, PoliticaUsuario> = Object.fromEntries(
    userIds.map((id) => [id, vazia()]),
  );
  if (userIds.length === 0) return porUsuario;

  const policies = await prisma.resourcePolicy.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, resourceType: true, resourceId: true },
  });

  for (const p of policies) {
    // `userId` é opcional no schema (existe política por papel); o `in` acima já filtrou,
    // mas o tipo continua anulável.
    const alvo = p.userId ? porUsuario[p.userId] : undefined;
    if (!alvo) continue;
    if (p.resourceType === TIPO_GRUPO) alvo.grupos.push(p.resourceId);
    else if (p.resourceType === TIPO_TELA) alvo.telas.push(p.resourceId);
    else if (p.resourceType === TIPO_RECURSO) alvo.cadastros.push(p.resourceId);
  }
  return porUsuario;
}

/**
 * Remove politicas que apontam para recurso que nao existe mais.
 *
 * `resourceId` guarda um slug, e slug nao tem chave estrangeira: apagar um grupo ou um
 * cadastro deixa a politica para tras. A leitura ja ignora essas linhas, entao nada
 * quebra -- elas so' se acumulam, e reaparecem se o slug for reaproveitado um dia.
 *
 * Recurso apenas DESATIVADO nao conta como inexistente: desativar uma tela por uma semana
 * nao pode revogar em silencio a concessao de todo mundo.
 *
 * Aceita um cliente para o seed poder passar o dele: o seed roda fora do Next com o
 * proprio PrismaClient, e usar o singleton daqui abriria um segundo pool que ninguem
 * desconecta -- o processo do seed ficaria pendurado no fim.
 */
export async function limparPoliticasOrfas(client: ClientePrisma = prisma): Promise<number> {
  const [grupos, telas, cadastros] = await Promise.all([
    client.dashboardGroup.findMany({ select: { slug: true } }),
    client.dashboardScreen.findMany({ select: { slug: true } }),
    client.registryDefinition.findMany({ select: { key: true } }),
  ]);

  const existentes: Record<string, string[]> = {
    [TIPO_GRUPO]: grupos.map((g) => g.slug),
    [TIPO_TELA]: telas.map((t) => t.slug),
    [TIPO_RECURSO]: cadastros.map((c) => c.key),
  };

  let removidas = 0;
  for (const [tipo, ids] of Object.entries(existentes)) {
    const { count } = await client.resourcePolicy.deleteMany({
      where: { resourceType: tipo, resourceId: { notIn: ids } },
    });
    removidas += count;
  }
  return removidas;
}

/**
 * Substitui as políticas do usuário pelo conjunto informado.
 *
 * Troca completa, não incremental: a interface manda o estado final, e o que não vier na
 * lista é revogado. Roda em transação para não deixar o usuário sem acesso nenhum se algo
 * falhar no meio.
 */
export async function setPoliticasDoUsuario(userId: string, alvo: PoliticaUsuario) {
  const [permGrupo, permTela, permCadastro, grupos, telas, cadastros] = await Promise.all([
    prisma.permission.findUnique({ where: { key: PERMISSAO_GRUPO } }),
    prisma.permission.findUnique({ where: { key: PERMISSAO_TELA } }),
    prisma.permission.findUnique({ where: { key: PERMISSAO_CADASTRO } }),
    // Busca só para não gravar política de recurso que não existe.
    prisma.dashboardGroup.findMany({
      where: { slug: { in: alvo.grupos } }, select: { slug: true },
    }),
    prisma.dashboardScreen.findMany({
      where: { slug: { in: alvo.telas } }, select: { slug: true },
    }),
    prisma.registryDefinition.findMany({
      where: { key: { in: alvo.cadastros }, isActive: true }, select: { key: true },
    }),
  ]);
  if (!permGrupo || !permTela || !permCadastro) {
    throw new Error("Permissões de indicadores ou cadastros ausentes; rode o seed.");
  }

  const novas = [
    ...grupos.map((g) => ({
      userId, permissionId: permGrupo.id,
      resourceType: TIPO_GRUPO, resourceId: g.slug,
    })),
    ...telas.map((t) => ({
      userId, permissionId: permTela.id,
      resourceType: TIPO_TELA, resourceId: t.slug,
    })),
    ...cadastros.map((c) => ({
      userId, permissionId: permCadastro.id,
      resourceType: TIPO_RECURSO, resourceId: c.key,
    })),
  ];

  await prisma.$transaction([
    prisma.resourcePolicy.deleteMany({
      where: { userId, resourceType: { in: [TIPO_GRUPO, TIPO_TELA, TIPO_RECURSO] } },
    }),
    ...(novas.length ? [prisma.resourcePolicy.createMany({ data: novas })] : []),
  ]);
}
