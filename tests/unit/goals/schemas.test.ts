import { describe, expect, it } from "vitest";
import {
  createGoalSchema,
  createMilestoneSchema,
  updateGoalSchema,
  updateMilestoneSchema,
} from "@/lib/goals/schemas";

describe("goal schemas", () => {
  describe("createGoalSchema", () => {
    it("accepts valid goal input and normalizes bare target dates", () => {
      const parsed = createGoalSchema.safeParse({
        title: "Launch v2",
        description: "Ship the next major release.",
        status: "in_progress",
        targetDate: "2026-06-01",
        labelIds: ["label-1"],
        taskIds: ["task-1"],
        meetingId: "meeting-1",
        milestones: [
          { title: "Backend ready", completed: true, position: 2 },
          { title: "Frontend ready" },
        ],
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        title: "Launch v2",
        description: "Ship the next major release.",
        status: "in_progress",
        targetDate: "2026-06-01T00:00:00Z",
        labelIds: ["label-1"],
        taskIds: ["task-1"],
        meetingId: "meeting-1",
        milestones: [
          { title: "Backend ready", completed: true, position: 2 },
          { title: "Frontend ready" },
        ],
      });
    });

    it("rejects invalid titles, descriptions, statuses, dates, and milestones", () => {
      expect(createGoalSchema.safeParse({ title: "" }).success).toBe(false);
      expect(createGoalSchema.safeParse({ title: "a".repeat(256) }).success).toBe(
        false,
      );
      expect(
        createGoalSchema.safeParse({
          title: "Launch v2",
          description: "a".repeat(251),
        }).success,
      ).toBe(false);
      expect(
        createGoalSchema.safeParse({
          title: "Launch v2",
          status: "blocked",
        }).success,
      ).toBe(false);
      expect(
        createGoalSchema.safeParse({
          title: "Launch v2",
          targetDate: "2026-99-99",
        }).success,
      ).toBe(false);
      expect(
        createGoalSchema.safeParse({
          title: "Launch v2",
          milestones: [{ title: "", position: -1 }],
        }).success,
      ).toBe(false);
    });
  });

  describe("updateGoalSchema", () => {
    it("accepts partial updates and nullable fields", () => {
      const parsed = updateGoalSchema.safeParse({
        description: null,
        targetDate: null,
        meetingId: null,
        milestones: [{ title: "Backend ready", completed: false }],
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        description: null,
        targetDate: null,
        meetingId: null,
        milestones: [{ title: "Backend ready", completed: false }],
      });
    });

    it("rejects invalid status values", () => {
      expect(updateGoalSchema.safeParse({ status: "blocked" }).success).toBe(
        false,
      );
    });
  });

  describe("milestone schemas", () => {
    it("accepts valid create and update milestone input", () => {
      expect(
        createMilestoneSchema.safeParse({
          title: "Backend ready",
          position: 1,
        }).success,
      ).toBe(true);
      expect(
        updateMilestoneSchema.safeParse({
          title: "Backend ready",
          completed: true,
          position: 2,
        }).success,
      ).toBe(true);
    });

    it("rejects invalid milestone input", () => {
      expect(createMilestoneSchema.safeParse({ title: "" }).success).toBe(
        false,
      );
      expect(
        updateMilestoneSchema.safeParse({ position: -1 }).success,
      ).toBe(false);
    });
  });
});
