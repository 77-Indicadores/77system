import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

describe("contracts", () => {
  it("declares super77 with technical permissions", () => {
    const contract = YAML.parse(
      fs.readFileSync(path.join(process.cwd(), "contracts", "permissions", "permissions.yaml"), "utf8")
    ) as { roles: Record<string, { permissions: string[] }> };

    expect(contract.roles.super77.permissions).toContain("super77.access");
    expect(contract.roles.super77.permissions).toContain("integrations.catworld.manage");
  });
});
