import { describe, expect, it } from "vitest";
import {
  createMemoryEntrySchema,
  updateMemoryEntrySchema,
} from "@/lib/memory/schemas";

describe("memory entry schemas", () => {
  describe("createMemoryEntrySchema", () => {
    it("accepts valid memory entry input", () => {
      const parsed = createMemoryEntrySchema.safeParse({
        key: "communication.preference",
        value: "User prefers concise follow-ups.",
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        key: "communication.preference",
        value: "User prefers concise follow-ups.",
      });
    });

    it("rejects invalid keys and values", () => {
      expect(
        createMemoryEntrySchema.safeParse({
          key: "",
          value: "User prefers concise follow-ups.",
        }).success,
      ).toBe(false);
      expect(
        createMemoryEntrySchema.safeParse({
          key: "a".repeat(101),
          value: "User prefers concise follow-ups.",
        }).success,
      ).toBe(false);
      expect(
        createMemoryEntrySchema.safeParse({
          key: "communication.preference",
          value: "",
        }).success,
      ).toBe(false);
      expect(
        createMemoryEntrySchema.safeParse({
          key: "communication.preference",
          value: "a".repeat(2001),
        }).success,
      ).toBe(false);
    });
  });

  describe("updateMemoryEntrySchema", () => {
    it("accepts partial updates", () => {
      expect(
        updateMemoryEntrySchema.safeParse({
          value: "User prefers a short summary first.",
        }).success,
      ).toBe(true);
    });

    it("rejects invalid update values", () => {
      expect(updateMemoryEntrySchema.safeParse({ key: "" }).success).toBe(
        false,
      );
      expect(updateMemoryEntrySchema.safeParse({ value: "" }).success).toBe(
        false,
      );
    });
  });
});
