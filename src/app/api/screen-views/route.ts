import { auth } from "@/auth";
import { requireDashboardAccess } from "@/domains/indicators/service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return new Response(null, { status: 401 });

  let slug: unknown;
  try {
    slug = (await request.json()).slug;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof slug !== "string" || slug.length > 120) return new Response(null, { status: 400 });

  const screen = await requireDashboardAccess(slug);
  if (!screen) return new Response(null, { status: 404 });

  await prisma.dashboardScreenUsage.upsert({
    where: { screenId: screen.id },
    create: { screenId: screen.id, views: 1 },
    update: { views: { increment: 1 } },
  });
  return new Response(null, { status: 204 });
}
