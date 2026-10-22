import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registrarPassagem } from "@/domains/acessos/registro";
import { slugDaRota } from "@/domains/acessos/rotas";

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) return new Response(null, { status: 401 });

  let rota: string | undefined;
  let encerrando = false;
  try {
    const body = (await request.json()) as { rota?: unknown; fim?: unknown };
    if (typeof body?.rota === "string" && body.rota.length <= 300) rota = body.rota;
    encerrando = body?.fim === true;
  } catch {
    // Compatible with old heartbeats without a body.
  }

  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const prior = await tx.userActivity.findUnique({ where: { email } });
      if (!prior) {
        await tx.userActivity.create({ data: { email, lastSeenAt: now, isOnline: true } });
        await tx.userAccessEvent.create({ data: { email, kind: "LOGIN", occurredAt: now } });
        return;
      }

      const expired = prior.lastSeenAt.getTime() < now.getTime() - 120_000;
      const updated = await tx.userActivity.updateMany({
        where: { email, isOnline: prior.isOnline, lastSeenAt: prior.lastSeenAt },
        data: { lastSeenAt: now, isOnline: true },
      });
      if (!updated.count) return;
      if (prior.isOnline && expired) {
        await tx.userAccessEvent.create({ data: { email, kind: "TIMEOUT", occurredAt: now } });
      }
      if (!prior.isOnline || expired) {
        await tx.userAccessEvent.create({ data: { email, kind: "LOGIN", occurredAt: now } });
      }
    });
    if (rota) {
      const slug = slugDaRota(rota);
      if (slug) await registrarPassagem(email, slug, { encerrando, agora: now }).catch(() => {});
    }
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
