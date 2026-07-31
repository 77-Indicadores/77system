import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

type Contract = {
  roles: Record<string, { permissions: string[] }>;
};

const contract = YAML.parse(
  fs.readFileSync(path.join(process.cwd(), "contracts", "permissions", "permissions.yaml"), "utf8")
) as Contract;

const super77 = contract.roles.super77;
if (!super77) {
  console.error("Role super77 ausente.");
  process.exit(1);
}

const required = ["super77.access", "integrations.catworld.manage", "system.jobs.view", "system.logs.view"];
const missing = required.filter((permission) => !super77.permissions.includes(permission));
if (missing.length > 0) {
  console.error(`Role super77 sem permissoes obrigatorias: ${missing.join(", ")}`);
  process.exit(1);
}

const seed = fs.readFileSync(path.join(process.cwd(), "prisma", "seed.ts"), "utf8");
for (const token of ["super77@77.local", "super77-dev-password", "financial-revenue-summary", "catworld-financeiro", "*/15 * * * *"]) {
  if (!seed.includes(token)) {
    console.error(`Seed nao contem token esperado: ${token}`);
    process.exit(1);
  }
}

console.log("seed:integrity ok");
