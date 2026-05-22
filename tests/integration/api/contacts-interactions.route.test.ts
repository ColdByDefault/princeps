import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactNoteRecord } from "@/types/api";
import type { LogInteractionInput } from "@/lib/features/contacts/schemas";
import type * as contactSchemas from "@/lib/features/contacts/schemas";
import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier } from "@/tests/helpers/types";

type LogContactInteraction = (
  userId: string,
  contactId: string,
  input: LogInteractionInput,
) => Promise<{ ok: true; data: ContactNoteRecord } | { ok: false; error: string }>;
type ListContactInteractions = (
  userId: string,
  contactId: string,
) => Promise<ContactNoteRecord[]>;

const mocks = vi.hoisted(() => ({
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listContactInteractions: vi.fn<ListContactInteractions>(),
  logContactInteraction: vi.fn<LogContactInteraction>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
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

vi.mock("@/lib/core/security", () => ({
  createRateLimitResponse: (retryAfterSeconds: number) =>
    Response.json(
      { error: "Too many requests" },
      {
        headers: { "Retry-After": String(retryAfterSeconds) },
        status: 429,
      },
    ),
  getRateLimitIdentifier: mocks.getRateLimitIdentifier,
  writeRateLimiter: {
    check: mocks.rateLimitCheck,
  },
}));

vi.mock("@/lib/features/contacts", () => ({
  listContactInteractions: mocks.listContactInteractions,
  logContactInteraction: mocks.logContactInteraction,
}));

vi.mock("@/lib/features/contacts/schemas", async () => {
  const actual = await vi.importActual<typeof contactSchemas>(
    "@/lib/features/contacts/schemas",
  );

  return {
    logInteractionSchema: actual.logInteractionSchema,
  };
});

import { GET, POST } from "@/app/api/contacts/[id]/interactions/route";

const noteRecord: ContactNoteRecord = {
  id: "note-1",
  userId: "user-1",
  contactId: "contact-1",
  type: "meeting",
  note: "Discussed the board packet.",
  date: "2026-05-22T08:00:00.000Z",
  createdAt: "2026-05-22T08:30:00.000Z",
};

function params(id = "contact-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/contacts/[id]/interactions route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.listContactInteractions.mockResolvedValue([noteRecord]);
    mocks.logContactInteraction.mockResolvedValue({
      ok: true,
      data: noteRecord,
    });
  });

  it("lists contact interactions for an authenticated user", async () => {
    const response = await GET(
      new Request("http://localhost/api/contacts/contact-1/interactions"),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ notes: [noteRecord] });
    expect(mocks.listContactInteractions).toHaveBeenCalledWith(
      "user-1",
      "contact-1",
    );
  });

  it("returns 401 when listing without a session", async () => {
    mocks.getSession.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/contacts/contact-1/interactions"),
      params(),
    );

    expect(response.status).toBe(401);
    expect(mocks.listContactInteractions).not.toHaveBeenCalled();
  });

  it("logs an interaction through auth, rate-limit, validation, and logic layers", async () => {
    const response = await POST(
      new Request("http://localhost/api/contacts/contact-1/interactions", {
        body: JSON.stringify({
          type: "meeting",
          note: "Discussed the board packet.",
          date: "2026-05-22T08:00:00.000Z",
        }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ note: noteRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    const logArgs = mocks.logContactInteraction.mock.calls[0];
    expect(logArgs?.[0]).toBe("user-1");
    expect(logArgs?.[1]).toBe("contact-1");
    expect(logArgs?.[2]).toMatchObject({
      type: "meeting",
      note: "Discussed the board packet.",
    });
    expect(logArgs?.[2].date).toBeInstanceOf(Date);
  });

  it("returns 400 for invalid interaction input", async () => {
    const response = await POST(
      new Request("http://localhost/api/contacts/contact-1/interactions", {
        body: JSON.stringify({ note: "" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.logContactInteraction).not.toHaveBeenCalled();
  });

  it("returns 404 when logging against a missing or unowned contact", async () => {
    mocks.logContactInteraction.mockResolvedValueOnce({
      ok: false,
      error: "Contact not found.",
    });

    const response = await POST(
      new Request("http://localhost/api/contacts/contact-1/interactions", {
        body: JSON.stringify({ note: "Follow-up." }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Contact not found.",
    });
  });
});
