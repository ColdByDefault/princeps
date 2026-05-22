import { describe, expect, it } from "vitest";
import { createKnowledgeDocumentSchema } from "@/lib/features/knowledge/schemas";

describe("knowledge schemas", () => {
  it("accepts valid document creation input", () => {
    const parsed = createKnowledgeDocumentSchema.safeParse({
      name: "Board notes.md",
      content: "Launch context and Q2 follow-up notes.",
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toEqual({
      name: "Board notes.md",
      content: "Launch context and Q2 follow-up notes.",
    });
  });

  it("rejects empty or overlong document names and empty content", () => {
    expect(
      createKnowledgeDocumentSchema.safeParse({
        name: "",
        content: "Launch context.",
      }).success,
    ).toBe(false);
    expect(
      createKnowledgeDocumentSchema.safeParse({
        name: "a".repeat(256),
        content: "Launch context.",
      }).success,
    ).toBe(false);
    expect(
      createKnowledgeDocumentSchema.safeParse({
        name: "Board notes.md",
        content: "",
      }).success,
    ).toBe(false);
  });
});
