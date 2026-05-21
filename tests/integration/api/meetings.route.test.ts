import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeetingRecord } from "@/types/api";
import type { CreateMeetingInput } from "@/lib/features/meetings/schemas";
import type * as meetingSchemas from "@/lib/features/meetings/schemas";

type Session = {
  user: {
    id: string;
  };
};

type HeadersProvider = () => Promise<Headers>;
type GetSession = (args: { headers: Headers }) => Promise<Session | null>;
type MeetingStatus = "upcoming" | "done" | "cancelled";
type ListMeetings = (
  userId: string,
  filter?: { status?: MeetingStatus },
) => Promise<MeetingRecord[]>;
type CreateMeeting = (
  userId: string,
  input: CreateMeetingInput,
) => Promise<MeetingRecord>;
type RateLimitCheck = (
  identifier: string,
) => Promise<{ allowed: boolean; retryAfterSeconds: number }>;
type RateLimitIdentifier = (
  req: Request,
  fallbackIdentifier: string,
) => string;
type EnforceMeetingsMax = (
  userId: string,
) => Promise<{ allowed: boolean; reason?: string }>;

const mocks = vi.hoisted(() => ({
  createMeeting: vi.fn<CreateMeeting>(),
  enforceMeetingsMax: vi.fn<EnforceMeetingsMax>(),
  getRateLimitIdentifier: vi.fn<RateLimitIdentifier>(),
  getSession: vi.fn<GetSession>(),
  headers: vi.fn<HeadersProvider>(),
  listMeetings: vi.fn<ListMeetings>(),
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
  enforceMeetingsMax: mocks.enforceMeetingsMax,
}));

vi.mock("@/lib/features/meetings", async () => {
  const actual = await vi.importActual<typeof meetingSchemas>(
    "@/lib/features/meetings/schemas",
  );

  return {
    createMeeting: mocks.createMeeting,
    createMeetingSchema: actual.createMeetingSchema,
    listMeetings: mocks.listMeetings,
  };
});

import { GET, POST } from "@/app/api/meetings/route";

const meetingRecord: MeetingRecord = {
  id: "meeting-1",
  title: "Board prep",
  scheduledAt: "2026-06-01T00:00:00.000Z",
  durationMin: 45,
  location: "HQ",
  agenda: "Review packet",
  summary: null,
  prepPack: null,
  status: "upcoming",
  kind: "meeting",
  source: "manual",
  googleEventId: null,
  labels: [],
  participants: [],
  tasks: [],
  createdAt: "2026-05-08T06:00:00.000Z",
  updatedAt: "2026-05-08T06:30:00.000Z",
};

describe("/api/meetings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue(new Headers());
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } });
    mocks.listMeetings.mockResolvedValue([meetingRecord]);
    mocks.createMeeting.mockResolvedValue(meetingRecord);
    mocks.rateLimitCheck.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
    mocks.getRateLimitIdentifier.mockReturnValue("user-1:127.0.0.1");
    mocks.enforceMeetingsMax.mockResolvedValue({ allowed: true });
  });

  it("lists authenticated user meetings with a validated status filter", async () => {
    const response = await GET(
      new Request("http://localhost/api/meetings?status=upcoming"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      meetings: [meetingRecord],
    });
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    const sessionArgs = mocks.getSession.mock.calls[0]?.[0];
    expect(sessionArgs?.headers).toBeInstanceOf(Headers);
    expect(mocks.listMeetings).toHaveBeenCalledWith("user-1", {
      status: "upcoming",
    });
  });

  it("creates a meeting through auth, rate-limit, tier, validation, and logic layers", async () => {
    const response = await POST(
      new Request("http://localhost/api/meetings", {
        body: JSON.stringify({
          title: "Board prep",
          scheduledAt: "2026-06-01",
          durationMin: 45,
          location: "HQ",
          agenda: "Review packet",
          labelIds: ["label-1"],
          participantContactIds: ["contact-1"],
        }),
        headers: {
          "content-type": "application/json",
          "x-real-ip": "127.0.0.1",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ meeting: meetingRecord });
    expect(mocks.getRateLimitIdentifier).toHaveBeenCalledTimes(1);
    const rateLimitIdentifierArgs =
      mocks.getRateLimitIdentifier.mock.calls[0];
    expect(rateLimitIdentifierArgs?.[0]).toBeInstanceOf(Request);
    expect(rateLimitIdentifierArgs?.[1]).toBe("user-1");
    expect(mocks.rateLimitCheck).toHaveBeenCalledWith("user-1:127.0.0.1");
    expect(mocks.enforceMeetingsMax).toHaveBeenCalledWith("user-1");
    expect(mocks.createMeeting).toHaveBeenCalledWith("user-1", {
      title: "Board prep",
      scheduledAt: "2026-06-01T00:00:00Z",
      durationMin: 45,
      location: "HQ",
      agenda: "Review packet",
      labelIds: ["label-1"],
      participantContactIds: ["contact-1"],
    });
  });

  it("returns 400 for invalid create input", async () => {
    const response = await POST(
      new Request("http://localhost/api/meetings", {
        body: JSON.stringify({ title: "", scheduledAt: "2026-99-99" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.createMeeting).not.toHaveBeenCalled();
  });
});
