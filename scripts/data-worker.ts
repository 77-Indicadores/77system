import { PrismaClient } from "@prisma/client";
import { tickScheduler } from "../src/domains/data/scheduler";

const prisma = new PrismaClient();

/** How often the worker sends a heartbeat to signal liveness (ms). */
const HEARTBEAT_INTERVAL_MS = 10_000;

async function runScheduler() {
  const result = await tickScheduler();
  if (result.queued > 0) {
    console.log(`data-worker: scheduler enfileirou ${result.queued} job(s):`, result.jobIds);
  }
}

async function runNextJob() {
  const now = new Date();

  // Fetch the oldest QUEUED job, then filter back-off in application code.
  // Prisma JSON path filters in OR clauses lose the include type — keeping
  // the query simple and doing the nextRetryAt check after the fetch.
  const candidates = await prisma.dataSyncJob.findMany({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    include: { dataSource: true },
    take: 10,
  });

  const job = candidates.find((c) => {
    const meta = c.metadataJson as Record<string, string> | null;
    if (!meta?.nextRetryAt) return true;
    return new Date(meta.nextRetryAt) <= now;
  });

  if (!job) {
    console.log("data-worker: nenhum job pendente");
    return;
  }

  // Mark as RUNNING and record start time.
  await prisma.dataSyncJob.update({
    where: { id: job.id },
    data: {
      status: "RUNNING",
      progress: 10,
      startedAt: now,
      heartbeatAt: now,
    },
  });

  // Start heartbeat — updated every HEARTBEAT_INTERVAL_MS while the job runs.
  // The scheduler uses this to detect dead workers (no heartbeat for >30s = dead).
  const heartbeatInterval = setInterval(async () => {
    try {
      await prisma.dataSyncJob.update({
        where: { id: job.id },
        data: { heartbeatAt: new Date() },
      });
    } catch {
      // Non-fatal: if the DB is temporarily unreachable, keep running.
    }
  }, HEARTBEAT_INTERVAL_MS);

  try {
    // ── Substituir este bloco pela integração real do cliente ────────────────
    // Padrão: use sempre project_id (nunca dataset_id). O project_id dá acesso
    // a todos os datasets do projeto sem amarrar o worker a um dataset específico.
    //
    // Exemplo de chamada ao sidecar catworld-service:
    //
    //   if (job.dataSource.key === "catworld-<cliente>") {
    //     const PROJECT_ID = process.env.CATWORLD_PROJECT_ID ?? "";
    //     const res = await fetch(`${SERVICE_BASE}/query`, {
    //       method: "POST",
    //       headers: { "content-type": "application/json" },
    //       body: JSON.stringify({
    //         base_url: process.env.CATWORLD_BASE_URL,
    //         token:    process.env.CATWORLD_TOKEN,
    //         project_id: PROJECT_ID,   // <-- sempre project_id
    //         sql: "SELECT TOP 100 * FROM minha_tabela",
    //         timeout: 120,
    //         limit: null,
    //       }),
    //     });
    //     const { rows } = await res.json();
    //     // ... salvar rows no banco
    //   }
    //
    // Ver: src/domains/integrations/catworld.ts para getCatworldConfig()
    // ─────────────────────────────────────────────────────────────────────────

    if (job.dataSource.key === "catworld-financeiro") {
      // Demo: gera dados fictícios sem chamar a API real.
      await prisma.dataSyncJob.update({
        where: { id: job.id },
        data: { progress: 30, heartbeatAt: new Date() },
      });

      const current = await prisma.financialRevenueMetric.findFirst({ orderBy: { date: "desc" } });
      const baseRevenue = Number(current?.revenue ?? 200000);
      const nextDate = current ? new Date(current.date) : new Date("2026-07-01T00:00:00.000Z");
      nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);

      await prisma.dataSyncJob.update({
        where: { id: job.id },
        data: { progress: 70, heartbeatAt: new Date() },
      });

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
        heartbeatAt: new Date(),
        metadataJson: { dataSource: job.dataSource.key },
      },
    });

    console.log(`data-worker: job ${job.id} concluido`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Increment retryCount. Re-queue with back-off if under maxRetries,
    // otherwise mark as FAILED permanently.
    const willRetry = job.retryCount + 1 < job.maxRetries;
    const nextRetryAt = willRetry
      ? new Date(Date.now() + Math.pow(2, job.retryCount) * 60_000).toISOString()
      : null;

    await prisma.dataSyncJob.update({
      where: { id: job.id },
      data: {
        status: willRetry ? "QUEUED" : "FAILED",
        progress: 0,
        finishedAt: willRetry ? undefined : new Date(),
        startedAt: null,
        heartbeatAt: null,
        retryCount: { increment: 1 },
        errorMessage: message,
        metadataJson: nextRetryAt
          ? { nextRetryAt }
          : { dataSource: job.dataSource.key },
      },
    });

    if (willRetry) {
      console.warn(
        `data-worker: job ${job.id} falhou (tentativa ${job.retryCount + 1}/${job.maxRetries}), reagendado — ${message}`
      );
    } else {
      console.error(
        `data-worker: job ${job.id} falhou definitivamente após ${job.maxRetries} tentativas — ${message}`
      );
    }
  } finally {
    // Always stop the heartbeat, even on error.
    clearInterval(heartbeatInterval);
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
