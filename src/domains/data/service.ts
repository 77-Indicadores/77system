import { prisma } from "@/lib/prisma";
import { computeNextRun, validateCronExpression } from "./schedule";

export async function listDataOperations() {
  return prisma.dataSource.findMany({
    orderBy: { name: "asc" },
    include: {
      schedules: { orderBy: { createdAt: "desc" } },
      syncJobs: { orderBy: { createdAt: "desc" }, take: 5 }
    }
  });
}

export async function queueDataSync(dataSourceKey: string, opts?: { scheduleId?: string; triggeredBy?: string }) {
  const dataSource = await prisma.dataSource.findUniqueOrThrow({ where: { key: dataSourceKey } });
  return prisma.dataSyncJob.create({
    data: {
      dataSourceId: dataSource.id,
      scheduleId: opts?.scheduleId,
      status: "QUEUED",
      progress: 0,
      metadataJson: { triggeredBy: opts?.triggeredBy ?? "scheduler" },
    },
  });
}

export async function saveDataRefreshSchedule(
  dataSourceKey: string,
  input: { scheduleId?: string; cronExpression: string; isActive: boolean; timezone?: string }
) {
  const validation = validateCronExpression(input.cronExpression);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const dataSource = await prisma.dataSource.findUniqueOrThrow({ where: { key: dataSourceKey } });
  const data = {
    cronExpression: validation.cronExpression,
    timezone: input.timezone ?? "America/Sao_Paulo",
    isActive: input.isActive,
    nextRunAt: input.isActive ? computeNextRun(validation.cronExpression) : null,
  };

  if (input.scheduleId) {
    await prisma.dataRefreshSchedule.findFirstOrThrow({
      where: { id: input.scheduleId, dataSourceId: dataSource.id },
      select: { id: true },
    });

    return prisma.dataRefreshSchedule.update({
      where: { id: input.scheduleId },
      data,
    });
  }

  return prisma.dataRefreshSchedule.create({
    data: {
      dataSourceId: dataSource.id,
      ...data,
    },
  });
}
