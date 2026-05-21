import { describe, expect, it } from "vitest";
import { createTaskSchema, updateTaskSchema } from "@/lib/tasks/schemas";

describe("task schemas", () => {
  describe("createTaskSchema", () => {
    it("accepts valid task input and normalizes bare due dates", () => {
      const parsed = createTaskSchema.safeParse({
        title: "Prepare board packet",
        notes: "Keep it concise.",
        priority: "high",
        dueDate: "2026-06-01",
        labelIds: ["label-1"],
        goalIds: ["goal-1"],
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        title: "Prepare board packet",
        notes: "Keep it concise.",
        priority: "high",
        dueDate: "2026-06-01T00:00:00Z",
        labelIds: ["label-1"],
        goalIds: ["goal-1"],
      });
    });

    it("rejects invalid titles, notes, priorities, and dates", () => {
      expect(createTaskSchema.safeParse({ title: "" }).success).toBe(false);
      expect(
        createTaskSchema.safeParse({
          title: "a".repeat(256),
        }).success,
      ).toBe(false);
      expect(
        createTaskSchema.safeParse({
          title: "Prepare board packet",
          notes: "a".repeat(251),
        }).success,
      ).toBe(false);
      expect(
        createTaskSchema.safeParse({
          title: "Prepare board packet",
          priority: "critical",
        }).success,
      ).toBe(false);
      expect(
        createTaskSchema.safeParse({
          title: "Prepare board packet",
          dueDate: "2026-99-99",
        }).success,
      ).toBe(false);
    });
  });

  describe("updateTaskSchema", () => {
    it("accepts partial updates and normalizes bare due dates", () => {
      const parsed = updateTaskSchema.safeParse({
        status: "in_progress",
        dueDate: "2026-06-01",
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        status: "in_progress",
        dueDate: "2026-06-01T00:00:00Z",
      });
    });

    it("allows null fields used to clear optional task links and dates", () => {
      const parsed = updateTaskSchema.safeParse({
        notes: null,
        dueDate: null,
        meetingId: null,
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        notes: null,
        dueDate: null,
        meetingId: null,
      });
    });

    it("rejects invalid status and priority values", () => {
      expect(updateTaskSchema.safeParse({ status: "blocked" }).success).toBe(
        false,
      );
      expect(updateTaskSchema.safeParse({ priority: "critical" }).success).toBe(
        false,
      );
    });
  });
});
