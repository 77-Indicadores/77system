import { describe, expect, it } from "vitest";
import { assertMaterializedContract, getFreshnessStatus } from "@/domains/data/freshness";

describe("data freshness", () => {
  it("classifies materialized data freshness", () => {
    const now = new Date("2026-07-30T12:00:00.000Z");

    expect(getFreshnessStatus(new Date("2026-07-30T11:55:00.000Z"), 900, now)).toBe("fresh");
    expect(getFreshnessStatus(new Date("2026-07-30T11:35:00.000Z"), 900, now)).toBe("stale");
    expect(getFreshnessStatus(new Date("2026-07-30T11:00:00.000Z"), 900, now)).toBe("expired");
    expect(getFreshnessStatus(null, 900, now)).toBe("missing");
  });

  it("requires staging and materialization for non-live contracts", () => {
    expect(() => assertMaterializedContract({ source: { mode: "materialized" } })).toThrow();
    expect(() =>
      assertMaterializedContract({
        source: { mode: "materialized" },
        staging: {},
        materialization: {}
      })
    ).not.toThrow();
    expect(() => assertMaterializedContract({ source: { mode: "live" } })).not.toThrow();
  });
});
