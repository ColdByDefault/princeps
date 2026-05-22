import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KnowledgeDocumentRecord } from "@/types/api";

type DbKnowledgeDocumentRow = {
  id: string;
  name: string;
  charCount: number;
  sourceType: string | null;
  createdAt: Date;
  labelLinks: {
    label: { id: string; name: string; color: string; icon: string | null };
  }[];
};

type TransactionClient = {
  $executeRawUnsafe: ReturnType<typeof vi.fn>;
  knowledgeDocument: {
    create: ReturnType<typeof vi.fn>;
  };
  user: {
    update: ReturnType<typeof vi.fn>;
  };
};

type KnowledgeDocumentFindUniqueOrThrowArgs = {
  where: { id: string };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  accumulateTokens: vi.fn<() => Promise<void>>(),
  embedBatch: vi.fn<() => Promise<number[][]>>(),
  knowledgeDocumentFindUniqueOrThrow: vi.fn<
    (
      args: KnowledgeDocumentFindUniqueOrThrowArgs,
    ) => Promise<DbKnowledgeDocumentRow>
  >(),
  transaction: vi.fn<
    (
      callback: (tx: TransactionClient) => Promise<{ id: string }>,
      options: { timeout: number },
    ) => Promise<{ id: string }>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    $transaction: mocks.transaction,
    knowledgeDocument: {
      findUniqueOrThrow: mocks.knowledgeDocumentFindUniqueOrThrow,
    },
  },
}));

vi.mock("@/lib/ai/llm-providers", () => ({
  embedBatch: mocks.embedBatch,
}));

vi.mock("@/lib/platform/tiers/enforce", () => ({
  accumulateTokens: mocks.accumulateTokens,
}));

import { createKnowledgeDocument } from "@/lib/features/knowledge/create.logic";

describe("createKnowledgeDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.accumulateTokens.mockResolvedValue();
  });

  it("chunks, embeds, persists chunks, and returns a document record", async () => {
    const content = "Launch context and Q2 follow-up notes.";
    const tx: TransactionClient = {
      $executeRawUnsafe: vi.fn(),
      knowledgeDocument: {
        create: vi.fn().mockResolvedValue({ id: "doc-1" }),
      },
      user: {
        update: vi.fn().mockResolvedValue({}),
      },
    };
    mocks.embedBatch.mockResolvedValue([[0.1, 0.2]]);
    mocks.transaction.mockImplementation(async (callback) => callback(tx));
    mocks.knowledgeDocumentFindUniqueOrThrow.mockResolvedValue({
      id: "doc-1",
      name: "Board notes.md",
      charCount: content.length,
      sourceType: null,
      createdAt: new Date("2026-05-22T06:00:00.000Z"),
      labelLinks: [],
    });

    const record = await createKnowledgeDocument("user-1", {
      name: "Board notes.md",
      content,
    });

    expect(mocks.embedBatch).toHaveBeenCalledWith([content]);
    expect(mocks.accumulateTokens).toHaveBeenCalledWith(
      "user-1",
      content.length,
      0,
    );
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 30_000,
    });
    expect(tx.knowledgeDocument.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        name: "Board notes.md",
        charCount: content.length,
      },
      select: { id: true },
    });
    expect(tx.$executeRawUnsafe).toHaveBeenCalledTimes(1);
    const rawArgs = tx.$executeRawUnsafe.mock.calls[0];
    expect(rawArgs?.[1]).toBe("doc-1");
    expect(rawArgs?.[2]).toBe("user-1");
    expect(rawArgs?.[3]).toBe(content);
    expect(rawArgs?.[4]).toMatch(/^\[0\.1,0\.2,0,/);
    expect(rawArgs?.[5]).toBe(0);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        knowledgeCharsUsed: { increment: content.length },
        knowledgeUploadsUsed: { increment: 1 },
      },
    });
    expect(mocks.knowledgeDocumentFindUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "doc-1" },
      select: expect.objectContaining({ id: true, name: true }),
    });

    const expectedRecord: KnowledgeDocumentRecord = {
      id: "doc-1",
      name: "Board notes.md",
      charCount: content.length,
      sourceType: null,
      labels: [],
      createdAt: "2026-05-22T06:00:00.000Z",
    };
    expect(record).toEqual(expectedRecord);
  });
});
