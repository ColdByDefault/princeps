import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetSession, HeadersProvider } from "@/tests/helpers/types";

type DeleteKnowledgeDocument = (
  userId: string,
  documentId: string,
) => Promise<boolean>;

const mocks = vi.hoisted(() => ({
  deleteKnowledgeDocument: vi.fn<DeleteKnowledgeDocument>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
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
  deleteKnowledgeDocument: mocks.deleteKnowledgeDocument,
}));

import { DELETE } from "@/app/api/knowledge/[id]/route";

function params(id = "doc-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/knowledge/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.deleteKnowledgeDocument.mockResolvedValue(true);
  });

  it("deletes a user-owned knowledge document", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/knowledge/doc-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mocks.deleteKnowledgeDocument).toHaveBeenCalledWith(
      "user-1",
      "doc-1",
    );
  });

  it("returns 404 when deleting a missing or unowned document", async () => {
    mocks.deleteKnowledgeDocument.mockResolvedValue(false);

    const response = await DELETE(
      new Request("http://localhost/api/knowledge/doc-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Document not found.",
    });
  });
});
