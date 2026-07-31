import { PrismaClient } from "@prisma/client";
import { tickScheduler } from "../src/domains/data/scheduler";

const prisma = new PrismaClient();

async function runScheduler() {
  const result = await tickScheduler();
  if (result.queued > 0) {
    console.log(`data-worker: scheduler enfileirou ${result.queued} job(s):`, result.jobIds);
  }
}

async function runNextJob() {
  const job = await prisma.dataSyncJob.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    include: { dataSource: true },
  });

  if (!job) {
    console.log("data-worker: nenhum job pendente");
    return;
  }

  await prisma.dataSyncJob.update({
    where: { id: job.id },
    data: { status: "RUNNING", progress: 10, startedAt: new Date() },
  });

  try {
    if (job.dataSource.key === "catworld-financeiro") {
      const current = await prisma.financialRevenueMetric.findFirst({ orderBy: { date: "desc" } });
      const baseRevenue = Number(current?.revenue ?? 200000);
      const nextDate = current ? new Date(current.date) : new Date("2026-07-01T00:00:00.000Z");
      nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);

      await prisma.financialRevenueMetric.upsert({
        where: { date: nextDate },
        update: {
          revenue: (baseRevenue * 1.04).toFixed(2),
          customerCount: (current?.customerCount ?? 1200) + 37,
        },
        create: {
          date: nextDate,
          revenue: (baseRevenue * 1.04).toFixed(2),
          customerCount: (current?.customerCount ?? 1200) + 37,
        },
      });
    }

    await prisma.dataSyncJob.update({
      where: { id: job.id },
      data: {
        status: "SUCCESS",
        progress: 100,
        rowsRead: 1,
        rowsWritten: 1,
        finishedAt: new Date(),
        metadataJson: { dataSource: job.dataSource.key },
      },
    });

    console.log(`data-worker: job ${job.id} concluido`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.dataSyncJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        progress: 0,
        finishedAt: new Date(),
        errorMessage: message,
      },
    });
    console.error(`data-worker: job ${job.id} falhou —`, message);
  }
}

async function main() {
  await runScheduler();
  await runNextJob();
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
