import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { z } from "zod";

const permissionContractSchema = z.object({
  roles: z.record(z.object({ description: z.string().optional(), permissions: z.array(z.string()).min(1) })),
  permissions: z.array(z.object({ id: z.string().min(1), description: z.string().optional() })).min(1),
  resource_types: z.array(z.string()).min(1)
});

const dataContractSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  source: z.object({ type: z.string(), dataset: z.string().optional(), mode: z.string().optional() }),
  refresh: z.object({
    strategy: z.enum(["scheduled", "manual", "live"]),
    cron: z.string().optional(),
    timezone: z.string().optional()
  }).optional(),
  query: z.object({ ref: z.string() }),
  staging: z.object({
    table: z.string(),
    retention_days: z.number()
  }).optional(),
  materialization: z.object({
    table: z.string(),
    incremental: z.boolean(),
    freshness_seconds: z.number(),
    allow_live_fallback: z.boolean()
  }).optional(),
  inputs: z.array(z.object({ name: z.string(), type: z.string(), required: z.boolean() })),
  outputs: z.array(z.object({ name: z.string(), type: z.string(), required: z.boolean() })).min(1),
  permissions: z.array(z.string()).min(1),
  performance: z.object({
    default_limit: z.number(),
    timeout_seconds: z.number(),
    cache_ttl_seconds: z.number()
  }),
  exports: z.object({ excel: z.boolean(), pdf: z.boolean() })
});

function parseYaml(file: string) {
  return YAML.parse(fs.readFileSync(file, "utf8")) as unknown;
}

const permissionFile = path.join(process.cwd(), "contracts", "permissions", "permissions.yaml");
permissionContractSchema.parse(parseYaml(permissionFile));

const dataDir = path.join(process.cwd(), "contracts", "data");
for (const fileName of fs.readdirSync(dataDir).filter((file) => file.endsWith(".yaml"))) {
  const contract = dataContractSchema.parse(parseYaml(path.join(dataDir, fileName)));
  if (contract.source.mode !== "live" && (!contract.staging || !contract.materialization)) {
    throw new Error(`${fileName}: contratos materializados precisam declarar staging e materialization.`);
  }
  if (contract.refresh?.strategy === "scheduled" && !contract.refresh.cron) {
    throw new Error(`${fileName}: refresh agendado precisa declarar cron.`);
  }
}

console.log("contracts:validate ok");
