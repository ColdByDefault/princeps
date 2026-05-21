import { describe, expect, it } from "vitest";
import {
  createMeetingSchema,
  updateMeetingSchema,
} from "@/lib/features/meetings/schemas";

describe("meeting schemas", () => {
  describe("createMeetingSchema", () => {
    it("accepts valid meeting input and normalizes bare scheduledAt dates", () => {
      const parsed = createMeetingSchema.safeParse({
        title: "Board prep",
        scheduledAt: "2026-06-01",
        durationMin: 45,
        location: "HQ",
        status: "upcoming",
        kind: "meeting",
        agenda: "Review packet",
        summary: "Prep for board session",
        labelIds: ["label-1"],
        participantContactIds: ["contact-1"],
        source: "manual",
        pushToGoogle: true,
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        title: "Board prep",
        scheduledAt: "2026-06-01T00:00:00Z",
        durationMin: 45,
        location: "HQ",
        status: "upcoming",
        kind: "meeting",
        agenda: "Review packet",
        summary: "Prep for board session",
        labelIds: ["label-1"],
        participantContactIds: ["contact-1"],
        source: "manual",
        pushToGoogle: true,
      });
    });

    it("rejects invalid required fields, bounds, enums, and dates", () => {
      expect(
        createMeetingSchema.safeParse({
          title: "",
          scheduledAt: "2026-06-01T08:00:00Z",
        }).success,
      ).toBe(false);
      expect(
        createMeetingSchema.safeParse({
          title: "Board prep",
          scheduledAt: "2026-06-01T08:00:00Z",
          durationMin: 0,
        }).success,
      ).toBe(false);
      expect(
        createMeetingSchema.safeParse({
          title: "Board prep",
          scheduledAt: "2026-06-01T08:00:00Z",
          status: "late",
        }).success,
      ).toBe(false);
      expect(
        createMeetingSchema.safeParse({
          title: "Board prep",
          scheduledAt: "2026-99-99",
        }).success,
      ).toBe(false);
      expect(
        createMeetingSchema.safeParse({
          title: "Board prep",
          scheduledAt: "2026-06-01T08:00:00Z",
          agenda: "a".repeat(301),
        }).success,
      ).toBe(false);
    });
  });

  describe("updateMeetingSchema", () => {
    it("accepts partial updates and nullable fields", () => {
      const parsed = updateMeetingSchema.safeParse({
        scheduledAt: "2026-06-01",
        durationMin: null,
        location: null,
        agenda: null,
        summary: null,
        linkedTaskIds: ["task-1"],
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        scheduledAt: "2026-06-01T00:00:00Z",
        durationMin: null,
        location: null,
        agenda: null,
        summary: null,
        linkedTaskIds: ["task-1"],
      });
    });

    it("rejects invalid update values", () => {
      expect(updateMeetingSchema.safeParse({ status: "late" }).success).toBe(
        false,
      );
      expect(updateMeetingSchema.safeParse({ kind: "call" }).success).toBe(
        false,
      );
      expect(updateMeetingSchema.safeParse({ durationMin: 1441 }).success).toBe(
        false,
      );
    });
  });
});
