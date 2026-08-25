-- Migration: financial revenue dimensions for scoped analytic dashboards
-- Adds dimensions used by row-level data segregation and replaces the
-- single-date uniqueness with a dimensional compound uniqueness.

ALTER TABLE "FinancialRevenueMetric"
  ADD COLUMN "empresa" TEXT,
  ADD COLUMN "departamento" TEXT;

DROP INDEX IF EXISTS "FinancialRevenueMetric_date_key";

CREATE INDEX "FinancialRevenueMetric_empresa_idx"
  ON "FinancialRevenueMetric"("empresa");

CREATE INDEX "FinancialRevenueMetric_departamento_idx"
  ON "FinancialRevenueMetric"("departamento");

CREATE UNIQUE INDEX "FinancialRevenueMetric_date_empresa_departamento_key"
  ON "FinancialRevenueMetric"("date", "empresa", "departamento");
