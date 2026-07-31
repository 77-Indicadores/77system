import fs from "fs";
import path from "path";
import { parse } from "yaml";

export type DataContract = {
  id: string;
  refresh?: {
    cron?: string;
  };
  materialization?: {
    freshness_seconds?: number;
  };
};

export function loadDataContract(id: string): DataContract {
  const filePath = path.join(process.cwd(), "contracts", "data", `${id}.yaml`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return parse(raw) as DataContract;
}

export function getFreshnessSeconds(contractId: string, fallback = 900): number {
  try {
    const contract = loadDataContract(contractId);
    return contract.materialization?.freshness_seconds ?? fallback;
  } catch {
    return fallback;
  }
}
