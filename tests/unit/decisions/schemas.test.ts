import { describe, expect, it } from "vitest";
import {
  createDecisionSchema,
  updateDecisionSchema,
} from "@/lib/decisions/schemas";

describe("decision schemas", () => {
  describe("createDecisionSchema", () => {
    it("accepts valid decision input and normalizes bare decidedAt dates", () => {
      const parsed = createDecisionSchema.safeParse({
        title: "Adopt new reporting cadence",
        rationale: "The team needs a tighter executive loop.",
        outcome: "Move to weekly reporting.",
        status: "decided",
        decidedAt: "2026-06-01",
        meetingId: "meeting-1",
        labelIds: ["label-1"],
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        title: "Adopt new reporting cadence",
        rationale: "The team needs a tighter executive loop.",
        outcome: "Move to weekly reporting.",
        status: "decided",
        decidedAt: "2026-06-01T00:00:00Z",
        meetingId: "meeting-1",
        labelIds: ["label-1"],
      });
    });

    it("rejects invalid titles, bounded text fields, statuses, and dates", () => {
      expect(createDecisionSchema.safeParse({ title: "" }).success).toBe(false);
      expect(
        createDecisionSchema.safeParse({ title: "a".repeat(256) }).success,
      ).toBe(false);
      expect(
        createDecisionSchema.safeParse({
          title: "Adopt new reporting cadence",
          rationale: "a".repeat(251),
        }).success,
      ).toBe(false);
      expect(
        createDecisionSchema.safeParse({
          title: "Adopt new reporting cadence",
          status: "blocked",
        }).success,
      ).toBe(false);
      expect(
        createDecisionSchema.safeParse({
          title: "Adopt new reporting cadence",
          decidedAt: "2026-99-99",
        }).success,
      ).toBe(false);
    });
  });

  describe("updateDecisionSchema", () => {
    it("accepts partial updates and normalizes bare decidedAt dates", () => {
      const parsed = updateDecisionSchema.safeParse({
        status: "reversed",
        decidedAt: "2026-06-01",
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        status: "reversed",
        decidedAt: "2026-06-01T00:00:00Z",
      });
    });

    it("allows null fields used to clear optional decision data", () => {
      const parsed = updateDecisionSchema.safeParse({
        rationale: null,
        outcome: null,
        decidedAt: null,
        meetingId: null,
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        rationale: null,
        outcome: null,
        decidedAt: null,
        meetingId: null,
      });
    });

    it("rejects invalid status values", () => {
      expect(updateDecisionSchema.safeParse({ status: "blocked" }).success).toBe(
        false,
      );
    });
  });
});
