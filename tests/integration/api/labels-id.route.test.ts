import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LabelRecord } from "@/types/api";
import type { UpdateLabelInput } from "@/lib/features/labels/schemas";
import type * as labelSchemas from "@/lib/features/labels/schemas";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type UpdateLabel = (
  labelId: string,
  userId: string,
  input: UpdateLabelInput,
) => Promise<
  | { ok: true; label: LabelRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; duplicate: true }
  | { ok: false; notFound: false; duplicate: false; error: string }
>;
type DeleteLabel = (
  labelId: string,
  userId: string,
) => Promise<{ ok: boolean }>;
type RateLimitCheck = (
  identifier: string,
) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;
type RateLimitIdentifier = (
  req: Request,
  fallbackIdentifier: string,
) => string;

const mocks = vi.hoisted(() => ({
  deleteLabel: vi.fn<DeleteLabel>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
  updateLabel: vi.fn<UpdateLabel>(),
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
    deleteLabel: mocks.deleteLabel,
    updateLabel: mocks.updateLabel,
    updateLabelSchema: actual.updateLabelSchema,
  };
});

import { DELETE, PATCH } from "@/app/api/labels/[id]/route";

const labelRecord: LabelRecord = {
  id: "label-1",
  name: "Board",
  color: "#2563eb",
  icon: null,
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

function params(id = "label-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/labels/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.updateLabel.mockResolvedValue({ ok: true, label: labelRecord });
    mocks.deleteLabel.mockResolvedValue({ ok: true });
  });

  it("patches a label through auth, rate-limit, validation, and update layers", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/labels/label-1", {
        body: JSON.stringify({
          color: "#2563eb",
          icon: null,
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
    await expect(response.json()).resolves.toEqual({ label: labelRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.updateLabel).toHaveBeenCalledWith("label-1", "user-1", {
      color: "#2563eb",
      icon: null,
    });
  });

  it("returns 400 for invalid patch input", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/labels/label-1", {
        body: JSON.stringify({ color: "blue" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateLabel).not.toHaveBeenCalled();
  });

  it("returns 404 when patching a missing or unowned label", async () => {
    mocks.updateLabel.mockResolvedValue({ ok: false, notFound: true });

    const response = await PATCH(
      new Request("http://localhost/api/labels/label-1", {
        body: JSON.stringify({ name: "Board" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Label not found",
    });
  });

  it("returns 409 when patching to a duplicate label name", async () => {
    mocks.updateLabel.mockResolvedValue({
      ok: false,
      notFound: false,
      duplicate: true,
    });

    const response = await PATCH(
      new Request("http://localhost/api/labels/label-1", {
        body: JSON.stringify({ name: "Board" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Duplicate label name",
    });
  });

  it("deletes a label through auth, rate-limit, and delete layers", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/labels/label-1", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(204);
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.deleteLabel).toHaveBeenCalledWith("label-1", "user-1");
  });

  it("returns 404 when deleting a missing or unowned label", async () => {
    mocks.deleteLabel.mockResolvedValue({ ok: false });

    const response = await DELETE(
      new Request("http://localhost/api/labels/label-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Label not found",
    });
  });
});
