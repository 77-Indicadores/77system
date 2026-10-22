import { prisma } from "@/lib/prisma";
import { nomeDaRota } from "@/domains/acessos/rotas";

/**
 * A gravacao de uma passagem por uma tela.
 *
 * Chamada pelo sinal de presenca, que chega a cada minuto enquanto a aba esta'
 * VISIVEL. O mesmo sinal que mantem o usuario "online" diz em que tela ele
 * esta' -- um segundo canal de rede por minuto so' para isso seria o dobro de
 * requisicao para a mesma informacao.
 *
 * Uma visita corresponde a uma linha; sinais seguintes atualizam sua duração.
 */

/**
 * Quanto silencio encerra uma visita.
 *
 * Tres minutos para um sinal de um minuto: tolera UM sinal perdido (aba
 * minimizada no meio, rede oscilando) sem partir a visita em duas. Mais que
 * isso e a pessoa de fato saiu, e emendar as duas pontas contaria como tempo
 * de tela o almoco inteiro.
 */
const JANELA_MS = 180_000;

/**
 * Teto de uma visita.
 *
 * Doze horas. O sinal so' sai com a aba visivel, mas monitor que nao dorme com
 * o painel aberto existe -- e uma visita de 40 horas estragaria a media de
 * todo mundo. Cortar no teto preserva o registro do acesso e descarta a
 * duracao impossivel.
 */
const TETO_SEGUNDOS = 12 * 60 * 60;

async function identificar(slug: string) {
  const fixa = nomeDaRota(slug);
  if (fixa) return fixa;
  // Tela de indicador: o nome e o grupo moram no banco, e podem ter mudado
  // desde a ultima visita.
  const tela = await prisma.dashboardScreen.findUnique({
    where: { slug },
    select: { name: true, group: { select: { name: true } } },
  });
  return tela ? { nome: tela.name, grupo: tela.group.name } : null;
}

export async function registrarPassagem(
  email: string,
  slug: string,
  { encerrando = false, agora = new Date() }: { encerrando?: boolean; agora?: Date } = {},
) {
  const aberta = await prisma.userScreenView.findFirst({
    where: {
      email,
      slug,
      encerrada: false,
      ultimoPingEm: { gte: new Date(agora.getTime() - JANELA_MS) },
    },
    orderBy: { iniciadoEm: "desc" },
    select: { id: true, iniciadoEm: true },
  });

  if (aberta) {
    const segundos = Math.min(
      TETO_SEGUNDOS,
      Math.max(0, Math.round((agora.getTime() - aberta.iniciadoEm.getTime()) / 1000)),
    );
    await prisma.userScreenView.update({
      where: { id: aberta.id },
      data: { ultimoPingEm: agora, segundos, pings: { increment: 1 }, encerrada: encerrando },
    });
    return;
  }

  // O sinal de despedida de uma visita que nao esta' mais aberta nao abre uma
  // nova: seria um registro de zero segundo para quem acabou de sair.
  if (encerrando) return;

  const id = await identificar(slug);
  await prisma.userScreenView.create({
    data: {
      email,
      slug,
      nome: id?.nome ?? null,
      grupo: id?.grupo ?? null,
      iniciadoEm: agora,
      ultimoPingEm: agora,
      segundos: 0,
      pings: 1,
    },
  });
}

