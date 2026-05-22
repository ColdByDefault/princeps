import { describe, expect, it } from "vitest";
import { createContactSchema, updateContactSchema } from "@/lib/features/contacts/schemas";

describe("contact schemas", () => {
  describe("createContactSchema", () => {
    it("accepts valid contact input and coerces lastContact to a Date", () => {
      const parsed = createContactSchema.safeParse({
        name: "Alice Johnson",
        role: "CTO",
        company: "Acme Corp",
        email: "alice@example.com",
        phone: "+1 555 0100",
        notes: "Prefers concise follow-ups.",
        lastContact: "2026-05-20T09:30:00.000Z",
        labelIds: ["label-1"],
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data.lastContact).toBeInstanceOf(Date);
      expect(parsed.data.lastContact?.toISOString()).toBe(
        "2026-05-20T09:30:00.000Z",
      );
    });

    it("allows empty email strings so create logic can normalize them", () => {
      const parsed = createContactSchema.safeParse({
        name: "Alice Johnson",
        email: "",
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data.email).toBe("");
    });

    it("rejects invalid required fields and bounded strings", () => {
      expect(createContactSchema.safeParse({ name: "" }).success).toBe(false);
      expect(
        createContactSchema.safeParse({ name: "a".repeat(101) }).success,
      ).toBe(false);
      expect(
        createContactSchema.safeParse({
          name: "Alice Johnson",
          email: "not-an-email",
        }).success,
      ).toBe(false);
      expect(
        createContactSchema.safeParse({
          name: "Alice Johnson",
          notes: "a".repeat(251),
        }).success,
      ).toBe(false);
    });
  });

  describe("updateContactSchema", () => {
    it("accepts partial updates and nullable fields", () => {
      const parsed = updateContactSchema.safeParse({
        role: null,
        company: null,
        email: "",
        lastContact: null,
      });

      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data).toEqual({
        role: null,
        company: null,
        email: "",
        lastContact: null,
      });
    });

    it("rejects invalid email values on update", () => {
      expect(updateContactSchema.safeParse({ email: "nope" }).success).toBe(
        false,
      );
    });
  });
});
