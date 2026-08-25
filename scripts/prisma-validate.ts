import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public",
};

const result = spawnSync("pnpm", ["exec", "prisma", "validate"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
