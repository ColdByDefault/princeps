import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactRecord } from "@/types/api";
import type { UpdateContactInput } from "@/lib/features/contacts/schemas";
import type * as contactSchemas from "@/lib/features/contacts/schemas";
import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier } from "@/tests/helpers/types";
type UpdateContact = (
  contactId: string,
  userId: string,
  input: UpdateContactInput,
) => Promise<{ ok: true; contact: ContactRecord } | { ok: false; notFound: true }>;
type DeleteContact = (
  contactId: string,
  userId: string,
) => Promise<{ ok: boolean }>;

const mocks = vi.hoisted(() => ({
  deleteContact: vi.fn<DeleteContact>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
  updateContact: vi.fn<UpdateContact>(),
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

vi.mock("@/lib/features/contacts", async () => {
  const actual = await vi.importActual<typeof contactSchemas>(
    "@/lib/features/contacts/schemas",
  );

  return {
    deleteContact: mocks.deleteContact,
    updateContact: mocks.updateContact,
    updateContactSchema: actual.updateContactSchema,
  };
});

import { DELETE, PATCH } from "@/app/api/contacts/[id]/route";

const contactRecord: ContactRecord = {
  id: "contact-1",
  name: "Alice Johnson",
  role: "CTO",
  company: "Acme Corp",
  email: "alice@example.com",
  phone: "+1 555 0100",
  notes: null,
  labels: [],
  lastContact: "2026-05-20T09:30:00.000Z",
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

function params(id = "contact-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/contacts/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.updateContact.mockResolvedValue({ ok: true, contact: contactRecord });
    mocks.deleteContact.mockResolvedValue({ ok: true });
  });

  it("patches a contact through auth, rate-limit, validation, and update layers", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/contacts/contact-1", {
        body: JSON.stringify({
          email: "",
          lastContact: "2026-05-20T09:30:00.000Z",
        }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ contact: contactRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");

    const updateArgs = mocks.updateContact.mock.calls[0];
    expect(updateArgs?.[0]).toBe("contact-1");
    expect(updateArgs?.[1]).toBe("user-1");
    expect(updateArgs?.[2]).toMatchObject({ email: "" });
    expect(updateArgs?.[2].lastContact).toBeInstanceOf(Date);
    expect(updateArgs?.[2].lastContact?.toISOString()).toBe(
      "2026-05-20T09:30:00.000Z",
    );
  });

  it("returns 400 for invalid patch input", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/contacts/contact-1", {
        body: JSON.stringify({ email: "not-an-email" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateContact).not.toHaveBeenCalled();
  });

  it("returns 404 when patching a missing or unowned contact", async () => {
    mocks.updateContact.mockResolvedValue({ ok: false, notFound: true });

    const response = await PATCH(
      new Request("http://localhost/api/contacts/contact-1", {
        body: JSON.stringify({ name: "Alice Johnson" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Contact not found",
    });
  });

  it("deletes a contact through auth, rate-limit, and delete layers", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/contacts/contact-1", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(204);
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.deleteContact).toHaveBeenCalledWith("contact-1", "user-1");
  });

  it("returns 404 when deleting a missing or unowned contact", async () => {
    mocks.deleteContact.mockResolvedValue({ ok: false });

    const response = await DELETE(
      new Request("http://localhost/api/contacts/contact-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Contact not found",
    });
  });
});
