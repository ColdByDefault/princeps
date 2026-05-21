import { describe, expect, it } from "vitest";
import { createLabelSchema, updateLabelSchema } from "@/lib/labels/schemas";

describe("label schemas", () => {
  describe("createLabelSchema", () => {
    it("accepts valid label input and defaults missing colors", () => {
      const parsed = createLabelSchema.safeParse({
        name: "Board",
        icon: "Tag",
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        name: "Board",
        color: "#6366f1",
        icon: "Tag",
      });
    });

    it("accepts explicit hex colors and nullable icons", () => {
      const parsed = createLabelSchema.safeParse({
        name: "Board",
        color: "#0f766e",
        icon: null,
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        name: "Board",
        color: "#0f766e",
        icon: null,
      });
    });

    it("rejects invalid names, colors, and icons", () => {
      expect(createLabelSchema.safeParse({ name: "" }).success).toBe(false);
      expect(createLabelSchema.safeParse({ name: "a".repeat(51) }).success).toBe(
        false,
      );
      expect(
        createLabelSchema.safeParse({
          name: "Board",
          color: "blue",
        }).success,
      ).toBe(false);
      expect(
        createLabelSchema.safeParse({
          name: "Board",
          icon: "NotALucideIcon",
        }).success,
      ).toBe(false);
    });
  });

  describe("updateLabelSchema", () => {
    it("accepts partial updates and nullable icons", () => {
      const parsed = updateLabelSchema.safeParse({
        color: "#2563eb",
        icon: null,
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        color: "#2563eb",
        icon: null,
      });
    });

    it("rejects invalid update values", () => {
      expect(updateLabelSchema.safeParse({ name: "" }).success).toBe(false);
      expect(updateLabelSchema.safeParse({ color: "#12345" }).success).toBe(
        false,
      );
      expect(updateLabelSchema.safeParse({ icon: "Nope" }).success).toBe(false);
    });
  });
});
