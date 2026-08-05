import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readRootFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Docker app startup", () => {
  it("generates the Prisma client before booting the app runtime", () => {
    const dockerfile = readRootFile("Dockerfile");

    expect(dockerfile).toContain("pnpm db:generate");
  });

  it("starts the production runtime with next start", () => {
    const dockerfile = readRootFile("Dockerfile");

    expect(dockerfile).toContain("RUN pnpm build && pnpm prune --prod");
    expect(dockerfile).toContain("COPY --from=builder /app/node_modules ./node_modules");
    expect(dockerfile).toContain("exec pnpm start");
  });

  it("uses the production image target by default in docker-compose", () => {
    const composeFile = readRootFile("docker-compose.yml");

    expect(composeFile).toContain("target: prod");
  });

  it("does not mount the source tree over the production image", () => {
    const composeFile = readRootFile("docker-compose.yml");

    expect(composeFile).not.toContain("- .:/app");
    expect(composeFile).not.toContain("- /app/node_modules");
  });

  it("uses a JavaScript Next config so production runtime does not need TypeScript", () => {
    const nextConfig = readRootFile("next.config.mjs");

    expect(nextConfig).toContain("distDir: \".next-build\"");
    expect(nextConfig).not.toContain("import type");
  });

  it("repairs the postgres role login capability on persisted clusters", () => {
    const composeFile = readRootFile("docker-compose.yml");
    const entrypoint = readRootFile("services/postgres/docker-entrypoint-repair.sh");

    expect(composeFile).toContain("context: ./services/postgres");
    expect(entrypoint).toContain("ALTER ROLE postgres WITH LOGIN PASSWORD");
    expect(entrypoint).toContain("postgres --single -D \"${PGDATA:-/var/lib/postgresql/data}\" postgres");
  });
});
