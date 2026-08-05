import { prisma } from "@/lib/prisma";
import { computeNextRun } from "./schedule";

// Verifica schedules ativos cujo nextRunAt ja passou e enfileira DataSyncJobs.
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
