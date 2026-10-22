import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * A trilha de acesso, do lado de quem le'.
 *
 * Quatro recortes da mesma base, porque sao quatro perguntas diferentes:
 *
 *   porUsuario ... "quem andou no painel, quanto tempo, em quantas telas"
 *   porTela ...... "o que esta' sendo olhado e por quantas pessoas"
 *   porDia ....... "o uso esta' crescendo ou morrendo"
 *   passagens .... a linha a linha: quem, qual tela, que hora, por quanto tempo
 *
 * Tudo FILTRADO NO SERVIDOR: sao centenas de milhares de passagens depois de
 * alguns meses, e mandar tudo para o navegador filtrar resolveria a busca as
 * custas do carregamento -- o mesmo desenho da tela de Logs.
 */

export type Filtros = {
  de?: string;
  ate?: string;
  usuario?: string;
  tela?: string;
  busca?: string;
};

export type Passagem = {
  id: string;
  email: string;
  slug: string;
  nome: string | null;
  grupo: string | null;
  iniciadoEm: Date;
  ultimoPingEm: Date;
  segundos: number;
  pings: number;
  encerrada: boolean;
};

/**
 * O periodo pedido, em horario de Sao Paulo.
 *
 * O banco guarda UTC; quem filtra "de 08/10 a 08/10" quer o dia inteiro em
 * Sao Paulo, e nao das 21h do dia 7 as 21h do dia 8. Sem o deslocamento, o
 * acesso das 22h cai no dia seguinte na tela.
 */
const FUSO_MIN = 180; // Sao Paulo = UTC-3

function inicioDoDia(iso: string) {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() + FUSO_MIN * 60_000);
}
function fimDoDia(iso: string) {
  return new Date(inicioDoDia(iso).getTime() + 86_400_000);
}

/** Padrao: os ultimos 30 dias. */
export function periodo(f: Filtros) {
  const ate = f.ate ? fimDoDia(f.ate) : new Date();
  const de = f.de ? inicioDoDia(f.de) : new Date(ate.getTime() - 30 * 86_400_000);
  return { de, ate };
}

function where(f: Filtros) {
  const { de, ate } = periodo(f);
  const w: Prisma.UserScreenViewWhereInput = { iniciadoEm: { gte: de, lt: ate } };
  if (f.usuario) w.email = f.usuario;
  if (f.tela) w.slug = f.tela;
  if (f.busca?.trim()) {
    const b = f.busca.trim();
    w.OR = [
      { email: { contains: b, mode: "insensitive" } },
      { nome: { contains: b, mode: "insensitive" } },
      { slug: { contains: b, mode: "insensitive" } },
      { grupo: { contains: b, mode: "insensitive" } },
    ];
  }
  return w;
}

export async function passagens(f: Filtros, limite = 500): Promise<Passagem[]> {
  return prisma.userScreenView.findMany({
    where: where(f),
    orderBy: { iniciadoEm: "desc" },
    take: Math.min(limite, 5000),
  });
}

export type LinhaUsuario = {
  email: string;
  passagens: number;
  segundos: number;
  telas: number;
  primeiro: Date;
  ultimo: Date;
};

export async function porUsuario(f: Filtros): Promise<LinhaUsuario[]> {
  const { de, ate } = periodo(f);
  return prisma.$queryRaw<LinhaUsuario[]>`
    SELECT email,
           count(*)::int                  AS "passagens",
           coalesce(sum(segundos), 0)::int AS "segundos",
           count(DISTINCT slug)::int      AS "telas",
           min("iniciadoEm")              AS "primeiro",
           max("ultimoPingEm")            AS "ultimo"
    FROM "UserScreenView"
    WHERE "iniciadoEm" >= ${de} AND "iniciadoEm" < ${ate}
      AND (${f.usuario ?? null}::text IS NULL OR email = ${f.usuario ?? null})
      AND (${f.tela ?? null}::text IS NULL OR slug = ${f.tela ?? null})
      AND (${f.busca?.trim() || null}::text IS NULL OR email ILIKE '%' || ${f.busca?.trim() || null} || '%' OR coalesce(nome, '') ILIKE '%' || ${f.busca?.trim() || null} || '%' OR slug ILIKE '%' || ${f.busca?.trim() || null} || '%' OR coalesce(grupo, '') ILIKE '%' || ${f.busca?.trim() || null} || '%')
    GROUP BY email
    ORDER BY "segundos" DESC, "passagens" DESC`;
}

export type LinhaTela = {
  slug: string;
  nome: string | null;
  grupo: string | null;
  passagens: number;
  segundos: number;
  pessoas: number;
  ultimo: Date;
};

export async function porTela(f: Filtros): Promise<LinhaTela[]> {
  const { de, ate } = periodo(f);
  return prisma.$queryRaw<LinhaTela[]>`
    SELECT slug,
           max(nome)                       AS "nome",
           max(grupo)                      AS "grupo",
           count(*)::int                   AS "passagens",
           coalesce(sum(segundos), 0)::int AS "segundos",
           count(DISTINCT email)::int      AS "pessoas",
           max("ultimoPingEm")             AS "ultimo"
    FROM "UserScreenView"
    WHERE "iniciadoEm" >= ${de} AND "iniciadoEm" < ${ate}
      AND (${f.usuario ?? null}::text IS NULL OR email = ${f.usuario ?? null})
      AND (${f.tela ?? null}::text IS NULL OR slug = ${f.tela ?? null})
      AND (${f.busca?.trim() || null}::text IS NULL OR email ILIKE '%' || ${f.busca?.trim() || null} || '%' OR coalesce(nome, '') ILIKE '%' || ${f.busca?.trim() || null} || '%' OR slug ILIKE '%' || ${f.busca?.trim() || null} || '%' OR coalesce(grupo, '') ILIKE '%' || ${f.busca?.trim() || null} || '%')
    GROUP BY slug
    ORDER BY "segundos" DESC, "passagens" DESC`;
}

export type LinhaDia = { dia: string; passagens: number; segundos: number; pessoas: number };

export async function porDia(f: Filtros): Promise<LinhaDia[]> {
  const { de, ate } = periodo(f);
  return prisma.$queryRaw<LinhaDia[]>`
    SELECT to_char("iniciadoEm" AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS "dia",
           count(*)::int                   AS "passagens",
           coalesce(sum(segundos), 0)::int AS "segundos",
           count(DISTINCT email)::int      AS "pessoas"
    FROM "UserScreenView"
    WHERE "iniciadoEm" >= ${de} AND "iniciadoEm" < ${ate}
      AND (${f.usuario ?? null}::text IS NULL OR email = ${f.usuario ?? null})
      AND (${f.tela ?? null}::text IS NULL OR slug = ${f.tela ?? null})
      AND (${f.busca?.trim() || null}::text IS NULL OR email ILIKE '%' || ${f.busca?.trim() || null} || '%' OR coalesce(nome, '') ILIKE '%' || ${f.busca?.trim() || null} || '%' OR slug ILIKE '%' || ${f.busca?.trim() || null} || '%' OR coalesce(grupo, '') ILIKE '%' || ${f.busca?.trim() || null} || '%')
    GROUP BY 1 ORDER BY 1`;
}

export type Resumo = {
  pessoas: number;
  passagens: number;
  segundos: number;
  telas: number;
  desde: Date | null;
  logins: number;
  online: number;
};

export async function resumo(f: Filtros): Promise<Resumo> {
  const { de, ate } = periodo(f);
  const [agg, primeira, logins, online] = await Promise.all([
    prisma.$queryRaw<{ pessoas: number; passagens: number; segundos: number; telas: number }[]>`
      SELECT count(DISTINCT email)::int      AS "pessoas",
             count(*)::int                   AS "passagens",
             coalesce(sum(segundos), 0)::int AS "segundos",
             count(DISTINCT slug)::int       AS "telas"
      FROM "UserScreenView"
      WHERE "iniciadoEm" >= ${de} AND "iniciadoEm" < ${ate}
        AND (${f.usuario ?? null}::text IS NULL OR email = ${f.usuario ?? null})
        AND (${f.tela ?? null}::text IS NULL OR slug = ${f.tela ?? null})
      AND (${f.busca?.trim() || null}::text IS NULL OR email ILIKE '%' || ${f.busca?.trim() || null} || '%' OR coalesce(nome, '') ILIKE '%' || ${f.busca?.trim() || null} || '%' OR slug ILIKE '%' || ${f.busca?.trim() || null} || '%' OR coalesce(grupo, '') ILIKE '%' || ${f.busca?.trim() || null} || '%')`,
    prisma.userScreenView.findFirst({ orderBy: { iniciadoEm: "asc" }, select: { iniciadoEm: true } }),
    prisma.userAccessEvent.count({ where: { kind: "LOGIN", occurredAt: { gte: de, lt: ate }, ...(f.usuario ? { email: f.usuario } : {}) } }),
    prisma.userActivity.count({ where: { isOnline: true, lastSeenAt: { gte: new Date(Date.now() - 120_000) } } }),
  ]);
  const a = agg[0] ?? { pessoas: 0, passagens: 0, segundos: 0, telas: 0 };
  return { ...a, desde: primeira?.iniciadoEm ?? null, logins, online };
}

/** As opcoes dos filtros: so' quem aparece na base, para nao oferecer vazio. */
export async function opcoes() {
  const [usuarios, telas] = await Promise.all([
    prisma.$queryRaw<{ email: string }[]>`
      SELECT DISTINCT email FROM "UserScreenView" ORDER BY email`,
    prisma.$queryRaw<{ slug: string; nome: string | null }[]>`
      SELECT slug, max(nome) AS "nome" FROM "UserScreenView" GROUP BY slug ORDER BY max(nome), slug`,
  ]);
  return { usuarios: usuarios.map((u) => u.email), telas };
}

/** `2h 14min`, `6min`, `48s`. Numero cru de segundos nao se le' numa tabela. */
export function duracao(segundos: number): string {
  if (segundos < 60) return `${segundos}s`;
  const min = Math.round(segundos / 60);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const resto = min % 60;
  return resto ? `${h}h ${resto}min` : `${h}h`;
}

/** A hora como a pessoa viu: Sao Paulo, nao UTC. */
export function hora(d: Date): string {
  return new Date(d).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}


