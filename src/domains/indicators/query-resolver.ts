import { prisma } from "@/lib/prisma";
import { getFinancialRevenueSummary } from "@/domains/indicators/financial";

// Mapeia queryRef (declarado em Widget.queryRef) para um handler tipado.
// Adicionar um novo queryRef = registrar aqui + criar o service correspondente.

type QueryResult = Record<string, unknown> | Record<string, unknown>[];

type QueryHandler = () => Promise<QueryResult>;

const handlers: Record<string, QueryHandler> = {
  "financial.revenue_summary": async () => getFinancialRevenueSummary(),
};

export async function resolveQuery(queryRef: string): Promise<QueryResult> {
  const handler = handlers[queryRef];
  if (!handler) {
    throw new Error(`queryRef não registrado: ${queryRef}`);
  }
  return handler();
}

export function listRegisteredQueryRefs(): string[] {
  return Object.keys(handlers);
}

// Resolve todos os widgets de uma tela que possuem queryRef.
export async function resolveScreenWidgetData(screenSlug: string): Promise<Record<string, QueryResult>> {
  const screen = await prisma.dashboardScreen.findUnique({
    where: { slug: screenSlug },
    include: { widgets: true },
  });
  if (!screen) throw new Error(`Tela não encontrada: ${screenSlug}`);

  const results: Record<string, QueryResult> = {};
  await Promise.all(
    screen.widgets
      .filter((w) => w.queryRef)
      .map(async (w) => {
        results[w.id] = await resolveQuery(w.queryRef!);
      })
  );
  return results;
}
