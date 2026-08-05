-- Migration: job heartbeat, retry, and timeout fields
-- Adds lifecycle tracking to DataSyncJob so the scheduler can detect
-- dead workers and the worker can signal liveness.

ALTER TABLE "DataSyncJob"
  ADD COLUMN "heartbeatAt" TIMESTAMP(3),
  ADD COLUMN "retryCount"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxRetries"  INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "timeoutSecs" INTEGER NOT NULL DEFAULT 300;

-- Index for dead-job detection queries (status = RUNNING + old heartbeat)
CREATE INDEX "DataSyncJob_status_heartbeatAt_idx"
  ON "DataSyncJob"("status", "heartbeatAt");
