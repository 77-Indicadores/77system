import { prisma } from "@/lib/prisma";

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
