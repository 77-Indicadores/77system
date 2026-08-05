import { describe, expect, it } from "vitest";
import { computeNextRun, normalizeCronExpression, validateCronExpression } from "@/domains/data/schedule";

describe("data refresh schedule", () => {
  it("normalizes whitespace in cron expressions", () => {
    expect(normalizeCronExpression("  */15   * *   * * ")).toBe("*/15 * * * *");
  });

  it("validates five-field cron expressions", () => {
    expect(validateCronExpression("*/15 * * * *")).toEqual({ ok: true, cronExpression: "*/15 * * * *" });
    expect(validateCronExpression("*/0 * * * *").ok).toBe(false);
    expect(validateCronExpression("* * *").ok).toBe(false);
  });

  it("computes the next run for minute intervals", () => {
    const now = new Date("2026-08-05T12:00:00.000Z");

    expect(computeNextRun("*/15 * * * *", now).toISOString()).toBe("2026-08-05T12:15:00.000Z");
  });
});
