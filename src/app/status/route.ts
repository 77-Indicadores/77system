import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function dateInSaoPaulo(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function currentMonthInSaoPaulo(date: Date) {
  const [year, month] = dateInSaoPaulo(date).split("-").map(Number);
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`);
  const next = new Date(`${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01T00:00:00-03:00`);
  return { start, next, label: `${year}-${String(month).padStart(2, "0")}` };
}

export async function GET() {
  const checkedAt = new Date();

  try {
    await prisma.$queryRaw`SELECT 1`;

    const [lastSuccessfulSync, latestJob, screens] = await Promise.all([
      prisma.dataSyncJob.findFirst({
        where: { status: "SUCCESS", finishedAt: { not: null } },
        orderBy: { finishedAt: "desc" },
        select: { finishedAt: true, rowsWritten: true },
      }),
      prisma.dataSyncJob.findFirst({
        orderBy: { createdAt: "desc" },
        select: { status: true },
      }),
      prisma.dashboardScreen.findMany({
        where: { isActive: true, group: { isActive: true } },
        select: { name: true, slug: true, group: { select: { name: true } }, usage: { select: { views: true } } },
      }),
    ]);

    const screenUsage = screens.map((screen) => ({
      name: screen.name,
      slug: screen.slug,
      group: screen.group.name,
      views: screen.usage?.views ?? 0,
    }));
    const byMostUsed = [...screenUsage].sort((a, b) => b.views - a.views || a.name.localeCompare(b.name));
    const byLeastUsed = [...screenUsage].sort((a, b) => a.views - b.views || a.name.localeCompare(b.name));

    const lastSyncDate = lastSuccessfulSync?.finishedAt
      ? dateInSaoPaulo(lastSuccessfulSync.finishedAt)
      : null;
    const updatedToday = lastSyncDate === dateInSaoPaulo(checkedAt);
    const status = latestJob?.status === "FAILED" ? "degraded" : "ok";

    let activeUsersCount: number | null = null;
    let lastUserAccessAt: string | null = null;
    let monthlyLoginsCount: number | null = null;
    let monthlyExitsCount: number | null = null;
    const accessMonth = currentMonthInSaoPaulo(checkedAt);
    try {
      const inactiveBefore = new Date(checkedAt.getTime() - 120_000);
      const expired = await prisma.userActivity.findMany({
        where: { isOnline: true, lastSeenAt: { lt: inactiveBefore } },
        select: { email: true, lastSeenAt: true },
      });
      for (const user of expired) {
        await prisma.$transaction(async (tx) => {
          const updated = await tx.userActivity.updateMany({
            where: { email: user.email, isOnline: true, lastSeenAt: user.lastSeenAt },
            data: { isOnline: false },
          });
          if (updated.count) {
            await tx.userAccessEvent.create({
              data: { email: user.email, kind: "TIMEOUT", occurredAt: checkedAt },
            });
          }
        });
      }
      const [count, lastActivity, logins, logouts] = await Promise.all([
        prisma.userActivity.count({
          where: { isOnline: true, lastSeenAt: { gte: inactiveBefore } },
        }),
        prisma.userActivity.findFirst({
          where: { lastSeenAt: { gte: accessMonth.start, lt: accessMonth.next } },
          orderBy: { lastSeenAt: "desc" },
          select: { lastSeenAt: true },
        }),
        prisma.userAccessEvent.count({ where: { kind: "LOGIN", occurredAt: { gte: accessMonth.start, lt: accessMonth.next } } }),
        prisma.userAccessEvent.count({ where: { kind: { in: ["LOGOUT", "TIMEOUT"] }, occurredAt: { gte: accessMonth.start, lt: accessMonth.next } } }),
      ]);
      activeUsersCount = count;
      lastUserAccessAt = lastActivity?.lastSeenAt.toISOString() ?? null;
      monthlyLoginsCount = logins;
      monthlyExitsCount = logouts;
    } catch {
      // Ainda não há contagem disponível antes da atualização do schema.
    }

    return NextResponse.json({
      status,
      online: true,
      updated_today: updatedToday,
      database_access: true,
      active_users_count: activeUsersCount,
      user_access_observed: activeUsersCount === null ? null : activeUsersCount > 0,
      last_user_access_at: lastUserAccessAt,
      access_month: accessMonth.label,
      monthly_logins_count: monthlyLoginsCount,
      monthly_exits_count: monthlyExitsCount,
      last_sync_date: lastSyncDate,
      records_count: lastSuccessfulSync?.rowsWritten ?? null,
      most_used_screens: byMostUsed.slice(0, 5),
      least_used_screens: byLeastUsed.slice(0, 5),
      data: {
        checked_at: checkedAt.toISOString(),
        last_sync_at: lastSuccessfulSync?.finishedAt?.toISOString() ?? null,
        latest_job_status: latestJob?.status ?? null,
        active_window_seconds: 120,
        records_count_meaning: "Linhas gravadas na última sincronização bem-sucedida",
      },
    });
  } catch {
    return NextResponse.json({
      status: "degraded",
      online: true,
      updated_today: null,
      database_access: false,
      active_users_count: null,
      user_access_observed: null,
      last_user_access_at: null,
      access_month: currentMonthInSaoPaulo(checkedAt).label,
      monthly_logins_count: null,
      monthly_exits_count: null,
      last_sync_date: null,
      records_count: null,
      most_used_screens: null,
      least_used_screens: null,
      data: {
        checked_at: checkedAt.toISOString(),
        last_sync_at: null,
        latest_job_status: null,
        active_window_seconds: 120,
        records_count_meaning: "Linhas gravadas na última sincronização bem-sucedida",
      },
    });
  }
}
