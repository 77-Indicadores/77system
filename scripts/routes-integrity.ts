import fs from "node:fs";
import path from "node:path";
import { ROUTE_PERMISSIONS } from "../src/domains/rbac/permissions";

const protectedPrefixes = ["/super77", "/users", "/api/jobs", "/api/exports"];
const routeKeys = Object.keys(ROUTE_PERMISSIONS);

const missing = protectedPrefixes.filter((prefix) => !routeKeys.some((route) => prefix.startsWith(route) || route.startsWith(prefix)));
if (missing.length > 0) {
  console.error(`Rotas protegidas sem permissao declarada: ${missing.join(", ")}`);
  process.exit(1);
}

const appDir = path.join(process.cwd(), "src", "app");
const routeFiles = fs.readdirSync(appDir, { recursive: true }).filter((file) => String(file).endsWith("route.ts"));
if (routeFiles.length === 0) {
  console.error("Nenhuma API route encontrada.");
  process.exit(1);
}

console.log("routes:integrity ok");
