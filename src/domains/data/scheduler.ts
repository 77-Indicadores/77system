import { prisma } from "@/lib/prisma";

// Verifica schedules ativos cujo nextRunAt já passou e enfileira DataSyncJobs.
// Deve ser chamado periodicamente pelo worker (ex: a cada minuto).
export async function tickScheduler(now = new Date()) {
  const due = await prisma.dataRefreshSchedule.findMany({
    where: { isActive: true, nextRunAt: { lte: now } },
    include: { dataSource: true },
  });

  if (due.length === 0) return { queued: 0 };

  const jobs = await Promise.all(
    due.map(async (schedule) => {
      const job = await prisma.dataSyncJob.create({
        data: {
          dataSourceId: schedule.dataSourceId,
          scheduleId: schedule.id,
          status: "QUEUED",
          progress: 0,
          metadataJson: { triggeredBy: "scheduler", cronExpression: schedule.cronExpression } satisfies Record<string, string>,
        },
      });

      await prisma.dataRefreshSchedule.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: now,
          nextRunAt: computeNextRun(schedule.cronExpression, now),
        },
      });

      return job;
    })
  );

  return { queued: jobs.length, jobIds: jobs.map((j) => j.id) };
}

// Calcula próxima execução a partir de uma expressão cron de 5 campos.
// Suporte básico: intervalos simples como "*/15 * * * *".
// Para crons complexos, substituir por uma lib como `cron-parser`.
function computeNextRun(expression: string, from: Date): Date {
  const parts = expression.trim().split(/\s+/);
  const minutePart = parts[0];

  const match = minutePart.match(/^\*\/(\d+)$/);
  if (match) {
    const interval = parseInt(match[1], 10) * 60 * 1000;
    return new Date(from.getTime() + interval);
  }

  // Fallback: próxima hora cheia
  const next = new Date(from);
  next.setMinutes(next.getMinutes() + 60, 0, 0);
  return next;
}
