import { describe, expect, it } from "vitest";
import { ROUTE_PERMISSIONS } from "@/domains/rbac/permissions";

describe("route permissions", () => {
  it("protects super77 routes", () => {
    expect(ROUTE_PERMISSIONS["/super77"]).toBe("super77.access");
    expect(ROUTE_PERMISSIONS["/super77/catworld"]).toBe("integrations.catworld.view");
  });

  it("protects job and export APIs", () => {
    expect(ROUTE_PERMISSIONS["/api/jobs"]).toBe("system.jobs.view");
    expect(ROUTE_PERMISSIONS["/api/exports"]).toBe("exports.excel.create");
  });
});
