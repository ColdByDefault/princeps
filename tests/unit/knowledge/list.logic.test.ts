import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KnowledgeDocumentRecord } from "@/types/api";
import type { LabelLinkRow } from "@/tests/helpers/db-rows";

type DbKnowledgeDocumentRow = {
  id: string;
  name: string;
  charCount: number;
  sourceType: string | null;
  createdAt: Date;
  labelLinks: LabelLinkRow[];
};

type KnowledgeDocumentFindManyArgs = {
  where: { userId: string };
  orderBy: { createdAt: "desc" };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  knowledgeDocumentFindMany: vi.fn<
    (args: KnowledgeDocumentFindManyArgs) => Promise<DbKnowledgeDocumentRow[]>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    knowledgeDocument: {
      findMany: mocks.knowledgeDocumentFindMany,
    },
  },
}));

import { listKnowledgeDocuments } from "@/lib/features/knowledge/list.logic";

describe("listKnowledgeDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists user-scoped knowledge documents newest first", async () => {
    mocks.knowledgeDocumentFindMany.mockResolvedValue([
      {
        id: "doc-1",
        name: "Board notes.md",
        charCount: 123,
        sourceType: null,
        createdAt: new Date("2026-05-22T06:00:00.000Z"),
        labelLinks: [
          {
            label: {
              id: "label-1",
              name: "Board",
              color: "#2563eb",
              icon: null,
            },
          },
        ],
      },
    ]);

    const records = await listKnowledgeDocuments("user-1");

    expect(mocks.knowledgeDocumentFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      select: expect.objectContaining({ id: true, name: true }),
    });

    const expectedRecords: KnowledgeDocumentRecord[] = [
      {
        id: "doc-1",
        name: "Board notes.md",
        charCount: 123,
        sourceType: null,
        labels: [
          { id: "label-1", name: "Board", color: "#2563eb", icon: null },
        ],
        createdAt: "2026-05-22T06:00:00.000Z",
      },
    ];
    expect(records).toEqual(expectedRecords);
  });
});
