import { prisma } from "@/lib/prisma";
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
