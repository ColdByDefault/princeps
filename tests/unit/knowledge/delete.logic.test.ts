import { beforeEach, describe, expect, it, vi } from "vitest";

type KnowledgeDocumentFindUniqueArgs = {
  where: { id: string };
  select: { userId: true };
};

type KnowledgeDocumentDeleteArgs = {
  where: { id: string };
};

const mocks = vi.hoisted(() => ({
  knowledgeDocumentDelete: vi.fn<
    (args: KnowledgeDocumentDeleteArgs) => Promise<unknown>
  >(),
  knowledgeDocumentFindUnique: vi.fn<
    (args: KnowledgeDocumentFindUniqueArgs) => Promise<{ userId: string } | null>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    knowledgeDocument: {
      delete: mocks.knowledgeDocumentDelete,
      findUnique: mocks.knowledgeDocumentFindUnique,
    },
  },
}));

import { deleteKnowledgeDocument } from "@/lib/features/knowledge/delete.logic";

describe("deleteKnowledgeDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a user-owned knowledge document", async () => {
    mocks.knowledgeDocumentFindUnique.mockResolvedValue({ userId: "user-1" });
    mocks.knowledgeDocumentDelete.mockResolvedValue({});

    const deleted = await deleteKnowledgeDocument("user-1", "doc-1");

    expect(mocks.knowledgeDocumentFindUnique).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      select: { userId: true },
    });
    expect(mocks.knowledgeDocumentDelete).toHaveBeenCalledWith({
      where: { id: "doc-1" },
    });
    expect(deleted).toBe(true);
  });

  it("returns false when the document is missing or owned by another user", async () => {
    mocks.knowledgeDocumentFindUnique.mockResolvedValueOnce(null);

    await expect(deleteKnowledgeDocument("user-1", "doc-1")).resolves.toBe(
      false,
    );
    expect(mocks.knowledgeDocumentDelete).not.toHaveBeenCalled();

    mocks.knowledgeDocumentFindUnique.mockResolvedValueOnce({
      userId: "other-user",
    });

    await expect(deleteKnowledgeDocument("user-1", "doc-1")).resolves.toBe(
      false,
    );
    expect(mocks.knowledgeDocumentDelete).not.toHaveBeenCalled();
  });
});
