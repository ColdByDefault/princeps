import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KnowledgeDocumentRecord } from "@/types/api";
import type { CreateKnowledgeDocumentInput } from "@/lib/features/knowledge/schemas";
import type * as knowledgeSchemas from "@/lib/features/knowledge/schemas";

type CreateKnowledgeDocument = (
  userId: string,
  input: CreateKnowledgeDocumentInput,
) => Promise<KnowledgeDocumentRecord>;
type EnforceKnowledgeUpload = (
  userId: string,
  fileSizeBytes: number,
  newCharCount: number,
) => Promise<{ allowed: boolean; reason?: string }>;

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  createKnowledgeDocument: vi.fn<CreateKnowledgeDocument>(),
  enforceKnowledgeUpload: vi.fn<EnforceKnowledgeUpload>(),
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

vi.mock("@/lib/platform/tiers", () => ({
  createTierLimitResponse: (reason = "Plan limit reached.") =>
    Response.json({ error: reason }, { status: 403 }),
  enforceKnowledgeUpload: mocks.enforceKnowledgeUpload,
}));

vi.mock("@/lib/features/knowledge", async () => {
  const actual = await vi.importActual<typeof knowledgeSchemas>(
    "@/lib/features/knowledge/schemas",
  );

  return {
    createKnowledgeDocument: mocks.createKnowledgeDocument,
    createKnowledgeDocumentSchema: actual.createKnowledgeDocumentSchema,
  };
});

import { POST } from "@/app/api/knowledge/upload/route";

const documentRecord: KnowledgeDocumentRecord = {
  id: "doc-1",
  name: "Board notes.md",
  charCount: 36,
  sourceType: null,
  labels: [],
  createdAt: "2026-05-22T06:00:00.000Z",
};

describe("/api/knowledge/upload route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.enforceKnowledgeUpload.mockResolvedValue({ allowed: true });
    mocks.createKnowledgeDocument.mockResolvedValue(documentRecord);
  });

  it("uploads a text file through auth, validation, tier gate, and creation logic", async () => {
    const content = "Launch context and Q2 follow-up notes.";
    const formData = new FormData();
    formData.set(
      "file",
      new File([content], "source.txt", { type: "text/plain" }),
    );
    formData.set("name", "Board notes.md");

    const response = await POST(
      new Request("http://localhost/api/knowledge/upload", {
        body: formData,
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ document: documentRecord });
    expect(mocks.enforceKnowledgeUpload).toHaveBeenCalledWith(
      "user-1",
      content.length,
      content.length,
    );
    expect(mocks.createKnowledgeDocument).toHaveBeenCalledWith("user-1", {
      name: "Board notes.md",
      content,
    });
  });

  it("falls back to the uploaded filename when no display name is supplied", async () => {
    const content = "Launch context.";
    const formData = new FormData();
    formData.set(
      "file",
      new File([content], "source.txt", { type: "text/plain" }),
    );

    const response = await POST(
      new Request("http://localhost/api/knowledge/upload", {
        body: formData,
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(mocks.createKnowledgeDocument).toHaveBeenCalledWith("user-1", {
      name: "source.txt",
      content,
    });
  });

  it("returns 400 when no file is provided or content is invalid", async () => {
    const emptyFormData = new FormData();

    const noFileResponse = await POST(
      new Request("http://localhost/api/knowledge/upload", {
        body: emptyFormData,
        method: "POST",
      }),
    );

    expect(noFileResponse.status).toBe(400);
    await expect(noFileResponse.json()).resolves.toEqual({
      error: "No file provided.",
    });

    const invalidFormData = new FormData();
    invalidFormData.set(
      "file",
      new File([""], "empty.txt", { type: "text/plain" }),
    );

    const invalidResponse = await POST(
      new Request("http://localhost/api/knowledge/upload", {
        body: invalidFormData,
        method: "POST",
      }),
    );

    expect(invalidResponse.status).toBe(400);
    expect(mocks.createKnowledgeDocument).not.toHaveBeenCalled();
  });

  it("returns 403 when the knowledge upload tier gate blocks the upload", async () => {
    const content = "Launch context.";
    mocks.enforceKnowledgeUpload.mockResolvedValue({
      allowed: false,
      reason: "Knowledge document limit reached.",
    });
    const formData = new FormData();
    formData.set(
      "file",
      new File([content], "source.txt", { type: "text/plain" }),
    );

    const response = await POST(
      new Request("http://localhost/api/knowledge/upload", {
        body: formData,
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Knowledge document limit reached.",
    });
    expect(mocks.createKnowledgeDocument).not.toHaveBeenCalled();
  });

  it("maps embedding provider failures to a 502 response", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const content = "Launch context.";
    mocks.createKnowledgeDocument.mockRejectedValue(
      new Error("Embedding provider missing API key"),
    );
    const formData = new FormData();
    formData.set(
      "file",
      new File([content], "source.txt", { type: "text/plain" }),
    );

    const response = await POST(
      new Request("http://localhost/api/knowledge/upload", {
        body: formData,
        method: "POST",
      }),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Embedding provider error: Embedding provider missing API key",
    });
    consoleError.mockRestore();
  });
});
