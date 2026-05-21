import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeetingRecord } from "@/types/api";
import type { UpdateMeetingInput } from "@/lib/features/meetings/schemas";
import type * as meetingSchemas from "@/lib/features/meetings/schemas";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type UpdateMeeting = (
  meetingId: string,
  userId: string,
  input: UpdateMeetingInput,
) => Promise<
  | { ok: true; meeting: MeetingRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string }
>;
type DeleteMeeting = (
  meetingId: string,
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
  deleteMeeting: vi.fn<DeleteMeeting>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  rateLimitCheck: vi.fn<RateLimitCheck>(),
  updateMeeting: vi.fn<UpdateMeeting>(),
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

vi.mock("@/lib/features/meetings", async () => {
  const actual = await vi.importActual<typeof meetingSchemas>(
    "@/lib/features/meetings/schemas",
  );

  return {
    deleteMeeting: mocks.deleteMeeting,
    updateMeeting: mocks.updateMeeting,
    updateMeetingSchema: actual.updateMeetingSchema,
  };
});

import { DELETE, PATCH } from "@/app/api/meetings/[id]/route";

const meetingRecord: MeetingRecord = {
  id: "meeting-1",
  title: "Board prep",
  scheduledAt: "2026-06-01T00:00:00.000Z",
  durationMin: 45,
  location: "HQ",
  agenda: "Review packet",
  summary: null,
  prepPack: null,
  status: "done",
  kind: "meeting",
  source: "manual",
  googleEventId: null,
  labels: [],
  participants: [],
  tasks: [],
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

function params(id = "meeting-1") {
  return { params: Promise.resolve({ id }) };
}

describe("/api/meetings/[id] route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.updateMeeting.mockResolvedValue({ ok: true, meeting: meetingRecord });
    mocks.deleteMeeting.mockResolvedValue({ ok: true });
  });

  it("patches a meeting through auth, rate-limit, validation, and update layers", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/meetings/meeting-1", {
        body: JSON.stringify({
          status: "done",
          scheduledAt: "2026-06-01",
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
    await expect(response.json()).resolves.toEqual({ meeting: meetingRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.updateMeeting).toHaveBeenCalledWith("meeting-1", "user-1", {
      status: "done",
      scheduledAt: "2026-06-01T00:00:00Z",
    });
  });

  it("returns 400 for invalid patch input", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/meetings/meeting-1", {
        body: JSON.stringify({ status: "late" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateMeeting).not.toHaveBeenCalled();
  });

  it("returns 404 when patching a missing or unowned meeting", async () => {
    mocks.updateMeeting.mockResolvedValue({ ok: false, notFound: true });

    const response = await PATCH(
      new Request("http://localhost/api/meetings/meeting-1", {
        body: JSON.stringify({ title: "Board prep" }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Meeting not found",
    });
  });

  it("deletes a meeting through auth, rate-limit, and delete layers", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/meetings/meeting-1", {
        headers: { "x-real-ip": "127.0.0.1" },
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(204);
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.deleteMeeting).toHaveBeenCalledWith("meeting-1", "user-1");
  });

  it("returns 404 when deleting a missing or unowned meeting", async () => {
    mocks.deleteMeeting.mockResolvedValue({ ok: false });

    const response = await DELETE(
      new Request("http://localhost/api/meetings/meeting-1", {
        method: "DELETE",
      }),
      params(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Meeting not found",
    });
  });
});
