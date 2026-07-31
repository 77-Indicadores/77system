export function getFreshnessStatus(updatedAt: Date | null, freshnessSeconds: number, now = new Date()) {
  if (!updatedAt) return "missing";

  const ageSeconds = Math.floor((now.getTime() - updatedAt.getTime()) / 1000);
  if (ageSeconds <= freshnessSeconds) return "fresh";
  if (ageSeconds <= freshnessSeconds * 2) return "stale";
  return "expired";
}

export function assertMaterializedContract(contract: {
  source?: { mode?: string };
  staging?: unknown;
  materialization?: unknown;
}) {
  if (contract.source?.mode === "live") return;
  if (!contract.staging || !contract.materialization) {
    throw new Error("Contratos materializados precisam declarar staging e materialization.");
  }
}
