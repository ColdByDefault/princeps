import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LabelRecord } from "@/types/api";
import type { CreateLabelInput } from "@/lib/features/labels/schemas";
import type * as labelSchemas from "@/lib/features/labels/schemas";
import type { GetSession, HeadersProvider, RateLimitCheck, RateLimitIdentifier, Session } from "@/tests/helpers/types";

type ListLabels = (userId: string) => Promise<LabelRecord[]>;
type CreateLabel = (
  userId: string,
  input: CreateLabelInput,
) => Promise<
  | { ok: true; label: LabelRecord }
  | { ok: false; duplicate: true }
  | { ok: false; duplicate: false; error: string }
>;

const mocks = vi.hoisted(() => ({
  createLabel: vi.fn<CreateLabel>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listLabels: vi.fn<ListLabels>(),
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

vi.mock("@/lib/features/labels", async () => {
  const actual = await vi.importActual<typeof labelSchemas>(
    "@/lib/features/labels/schemas",
  );

  return {
    createLabel: mocks.createLabel,
    createLabelSchema: actual.createLabelSchema,
    listLabels: mocks.listLabels,
  };
});

import { GET, POST } from "@/app/api/labels/route";

const labelRecord: LabelRecord = {
  id: "label-1",
  name: "Board",
  color: "#6366f1",
  icon: "Tag",
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

describe("/api/labels route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listLabels.mockResolvedValue([labelRecord]);
    mocks.createLabel.mockResolvedValue({ ok: true, label: labelRecord });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
  });

  it("lists authenticated user labels", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ labels: [labelRecord] });
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    const sessionArgs = mocks.getSession.mock.calls[0]?.[0];
    expect(sessionArgs?.headers).toBeInstanceOf(Headers);
    expect(mocks.listLabels).toHaveBeenCalledWith("user-1");
  });

  it("creates a label through auth, rate-limit, validation, and logic layers", async () => {
    const response = await POST(
      new Request("http://localhost/api/labels", {
        body: JSON.stringify({
          name: "Board",
          icon: "Tag",
        }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ label: labelRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    const rateLimitIdentifierArgs =
      mocks.getRateLimitIdentifier.mock.calls[0];
    expect(rateLimitIdentifierArgs?.[0]).toBeInstanceOf(Request);
    expect(rateLimitIdentifierArgs?.[1]).toBe("user-1");
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.createLabel).toHaveBeenCalledWith("user-1", {
      name: "Board",
      color: "#6366f1",
      icon: "Tag",
    });
  });

  it("returns 400 for invalid create input", async () => {
    const response = await POST(
      new Request("http://localhost/api/labels", {
        body: JSON.stringify({ name: "", color: "blue" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createLabel).not.toHaveBeenCalled();
  });

  it("returns 409 when creating a duplicate label", async () => {
    mocks.createLabel.mockResolvedValue({ ok: false, duplicate: true });

    const response = await POST(
      new Request("http://localhost/api/labels", {
        body: JSON.stringify({ name: "Board" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Duplicate label name",
    });
  });
});
