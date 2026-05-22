import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KnowledgeDocumentRecord } from "@/types/api";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type ListKnowledgeDocuments = (
  userId: string,
) => Promise<KnowledgeDocumentRecord[]>;

const mocks = vi.hoisted(() => ({
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listKnowledgeDocuments: vi.fn<ListKnowledgeDocuments>(),
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("@/lib/core/auth/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("@/lib/features/knowledge", () => ({
  listKnowledgeDocuments: mocks.listKnowledgeDocuments,
}));

import { GET } from "@/app/api/knowledge/route";

const documentRecord: KnowledgeDocumentRecord = {
  id: "doc-1",
  name: "Board notes.md",
  charCount: 123,
  sourceType: null,
  labels: [],
  createdAt: "2026-05-22T06:00:00.000Z",
};

describe("/api/knowledge route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listKnowledgeDocuments.mockResolvedValue([documentRecord]);
  });

  it("lists authenticated user knowledge documents", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      documents: [documentRecord],
    });
    expect(mocks.listKnowledgeDocuments).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.listKnowledgeDocuments).not.toHaveBeenCalled();
  });
});
