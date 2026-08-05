/**
 * Job lifecycle utilities: dead-job detection, retry logic, and
 * manual operations (retry / cancel). Called by the scheduler tick
 * and exposed through the service layer for the super77 UI.
 */

import { prisma } from "@/lib/prisma";

/**
 * A RUNNING job is considered dead when its heartbeat has not been
 * updated for more than DEAD_THRESHOLD_MS. The threshold is intentionally
 * 3× the worker heartbeat interval (10s) to tolerate transient slowness.
 */
const DEAD_THRESHOLD_MS = 30_000;

/**
 * Detects RUNNING jobs whose worker has gone silent and either
 * re-queues them (with exponential back-off) or marks them FAILED
 * once maxRetries is exhausted.
 *
 * Returns counts for observability.
 */
export async function detectAndRecoverDeadJobs(now = new Date()): Promise<{
  requeued: number;
  failed: number;
}> {
  const cutoff = new Date(now.getTime() - DEAD_THRESHOLD_MS);

  const dead = await prisma.dataSyncJob.findMany({
    where: {
      status: "RUNNING",
      OR: [
        { heartbeatAt: { lt: cutoff } },
        // Also catch jobs that were set to RUNNING but never got a heartbeat
        { heartbeatAt: null, startedAt: { lt: cutoff } },
      ],
    },
    select: {
      id: true,
      retryCount: true,
      maxRetries: true,
      dataSourceId: true,
      scheduleId: true,
    },
  });

  let requeued = 0;
  let failed = 0;

  await Promise.all(
    dead.map(async (job) => {
      if (job.retryCount < job.maxRetries) {
        // Exponential back-off: 1 min, 2 min, 4 min ...
        // We store nextRetryAt in metadataJson so the worker can skip
        // jobs that aren't ready yet without a separate table.
        const delayMs = Math.pow(2, job.retryCount) * 60_000;
        const nextRetryAt = new Date(now.getTime() + delayMs);

        await prisma.dataSyncJob.update({
          where: { id: job.id },
          data: {
            status: "QUEUED",
            progress: 0,
            startedAt: null,
            finishedAt: null,
            heartbeatAt: null,
            retryCount: { increment: 1 },
            errorMessage: `Tentativa ${job.retryCount + 1}/${job.maxRetries}: worker sem resposta`,
            metadataJson: { nextRetryAt: nextRetryAt.toISOString() },
          },
        });

        requeued++;
      } else {
        await prisma.dataSyncJob.update({
          where: { id: job.id },
          data: {
            status: "FAILED",
            finishedAt: now,
            heartbeatAt: null,
            errorMessage: `Job falhou após ${job.maxRetries} tentativas (worker sem resposta)`,
          },
        });

        failed++;
      }
    })
  );

  return { requeued, failed };
}

/**
 * Manually re-queues a FAILED job (resets retryCount so it gets fresh attempts).
 * Used by super77 operators.
 */
export async function retryDataSyncJob(jobId: string): Promise<void> {
  const job = await prisma.dataSyncJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { status: true },
  });

  if (job.status !== "FAILED") {
    throw new Error(`Só é possível retentar jobs FAILED. Status atual: ${job.status}`);
  }

  await prisma.dataSyncJob.update({
    where: { id: jobId },
    data: {
      status: "QUEUED",
      progress: 0,
      startedAt: null,
      finishedAt: null,
      heartbeatAt: null,
      retryCount: 0,
      errorMessage: null,
      metadataJson: { retriggeredAt: new Date().toISOString(), retriggeredBy: "manual" },
    },
  });
}

/**
 * Cancels a QUEUED or RUNNING job. Safe to call from the UI.
 */
export async function cancelDataSyncJob(jobId: string, actor?: string): Promise<void> {
  const job = await prisma.dataSyncJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { status: true },
  });

  if (!["QUEUED", "RUNNING"].includes(job.status)) {
    throw new Error(`Não é possível cancelar um job com status ${job.status}`);
  }

  await prisma.dataSyncJob.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      heartbeatAt: null,
      errorMessage: `Cancelado manualmente${actor ? ` por ${actor}` : ""}`,
    },
  });
}
