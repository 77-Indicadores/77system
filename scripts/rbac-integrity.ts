import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { ROUTE_PERMISSIONS } from "../src/domains/rbac/permissions";

type Contract = {
  roles: Record<string, { permissions: string[] }>;
  permissions: Array<{ id: string }>;
};

const contract = YAML.parse(
  fs.readFileSync(path.join(process.cwd(), "contracts", "permissions", "permissions.yaml"), "utf8")
) as Contract;

const knownPermissions = new Set(contract.permissions.map((permission) => permission.id));
const usedPermissions = new Set<string>(Object.values(ROUTE_PERMISSIONS));

for (const role of Object.values(contract.roles)) {
  for (const permission of role.permissions) usedPermissions.add(permission);
}

const dataDir = path.join(process.cwd(), "contracts", "data");
for (const fileName of fs.readdirSync(dataDir).filter((file) => file.endsWith(".yaml"))) {
  const dataContract = YAML.parse(fs.readFileSync(path.join(dataDir, fileName), "utf8")) as { permissions?: string[] };
  for (const permission of dataContract.permissions ?? []) usedPermissions.add(permission);
}

const missing = [...usedPermissions].filter((permission) => !knownPermissions.has(permission));
if (missing.length > 0) {
  console.error(`Permissoes usadas mas nao declaradas: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("rbac:integrity ok");
