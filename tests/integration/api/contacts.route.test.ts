import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactRecord } from "@/types/api";
import type { CreateContactInput } from "@/lib/features/contacts/schemas";
import type * as contactSchemas from "@/lib/features/contacts/schemas";

type ListContacts = (userId: string) => Promise<ContactRecord[]>;
type CreateContact = (
  userId: string,
  input: CreateContactInput,
) => Promise<ContactRecord>;
type EnforceContactsMax = (
  userId: string,
) => Promise<{ allowed: boolean; reason?: string }>;

import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";
const mocks = vi.hoisted(() => ({
  createContact: vi.fn<CreateContact>(),
  enforceContactsMax: vi.fn<EnforceContactsMax>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listContacts: vi.fn<ListContacts>(),
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

vi.mock("@/lib/platform/tiers", () => ({
  createTierLimitResponse: (reason = "Plan limit reached.") =>
    Response.json({ error: reason }, { status: 403 }),
  enforceContactsMax: mocks.enforceContactsMax,
}));

vi.mock("@/lib/features/contacts", async () => {
  const actual = await vi.importActual<typeof contactSchemas>(
    "@/lib/features/contacts/schemas",
  );

  return {
    createContact: mocks.createContact,
    createContactSchema: actual.createContactSchema,
    listContacts: mocks.listContacts,
  };
});

import { GET, POST } from "@/app/api/contacts/route";

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

describe("/api/contacts route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listContacts.mockResolvedValue([contactRecord]);
    mocks.createContact.mockResolvedValue(contactRecord);
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.enforceContactsMax.mockResolvedValue({ allowed: true });
  });

  it("lists authenticated user contacts", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      contacts: [contactRecord],
    });
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    const sessionArgs = mocks.getSession.mock.calls[0]?.[0];
    expect(sessionArgs?.headers).toBeInstanceOf(Headers);
    expect(mocks.listContacts).toHaveBeenCalledWith("user-1");
  });

  it("creates a contact through auth, rate-limit, tier, validation, and logic layers", async () => {
    const response = await POST(
      new Request("http://localhost/api/contacts", {
        body: JSON.stringify({
          name: "Alice Johnson",
          role: "CTO",
          company: "Acme Corp",
          email: "",
          lastContact: "2026-05-20T09:30:00.000Z",
          labelIds: ["label-1"],
        }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ contact: contactRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    const rateLimitIdentifierArgs =
      mocks.getRateLimitIdentifier.mock.calls[0];
    expect(rateLimitIdentifierArgs?.[0]).toBeInstanceOf(Request);
    expect(rateLimitIdentifierArgs?.[1]).toBe("user-1");
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.enforceContactsMax).toHaveBeenCalledWith("user-1");

    const createArgs = mocks.createContact.mock.calls[0];
    expect(createArgs?.[0]).toBe("user-1");
    expect(createArgs?.[1]).toMatchObject({
      name: "Alice Johnson",
      role: "CTO",
      company: "Acme Corp",
      email: "",
      labelIds: ["label-1"],
    });
    expect(createArgs?.[1].lastContact).toBeInstanceOf(Date);
    expect(createArgs?.[1].lastContact?.toISOString()).toBe(
      "2026-05-20T09:30:00.000Z",
    );
  });

  it("returns 400 for invalid create input", async () => {
    const response = await POST(
      new Request("http://localhost/api/contacts", {
        body: JSON.stringify({ name: "", email: "not-an-email" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createContact).not.toHaveBeenCalled();
  });
});
