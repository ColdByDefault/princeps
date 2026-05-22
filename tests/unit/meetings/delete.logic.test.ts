import { beforeEach, describe, expect, it, vi } from "vitest";

type MeetingFindFirstArgs = {
  where: {
    id: string;
    userId: string;
  };
  select: { googleEventId: true };
};

type MeetingDeleteManyArgs = {
  where: {
    id: string;
    userId: string;
  };
};

const mocks = vi.hoisted(() => ({
  deleteCalendarEvent: vi.fn<() => Promise<void>>(),
  meetingDeleteMany: vi.fn<
    (args: MeetingDeleteManyArgs) => Promise<{ count: number }>
  >(),
  meetingFindFirst: vi.fn<
    (args: MeetingFindFirstArgs) => Promise<{ googleEventId: string | null } | null>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    meeting: {
      deleteMany: mocks.meetingDeleteMany,
      findFirst: mocks.meetingFindFirst,
    },
  },
}));

vi.mock("@/lib/platform/integrations/google-calendar/events", () => ({
  deleteCalendarEvent: mocks.deleteCalendarEvent,
}));

import { deleteMeeting } from "@/lib/features/meetings/delete.logic";

describe("deleteMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deleteCalendarEvent.mockResolvedValue();
  });

  it("deletes a user-owned meeting and best-effort deletes the linked Google event", async () => {
    mocks.meetingFindFirst.mockResolvedValue({ googleEventId: "google-event-1" });
    mocks.meetingDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteMeeting("meeting-1", "user-1");

    expect(mocks.meetingFindFirst).toHaveBeenCalledWith({
      where: { id: "meeting-1", userId: "user-1" },
      select: { googleEventId: true },
    });
    expect(mocks.meetingDeleteMany).toHaveBeenCalledWith({
      where: { id: "meeting-1", userId: "user-1" },
    });
    expect(mocks.deleteCalendarEvent).toHaveBeenCalledWith(
      "user-1",
      "google-event-1",
    );
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false and skips Google deletion when no user-owned meeting is deleted", async () => {
    mocks.meetingFindFirst.mockResolvedValue({ googleEventId: "google-event-1" });
    mocks.meetingDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteMeeting("meeting-1", "user-1");

    expect(mocks.deleteCalendarEvent).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false });
  });

  it("keeps the local delete successful when Google deletion fails", async () => {
    mocks.meetingFindFirst.mockResolvedValue({ googleEventId: "google-event-1" });
    mocks.meetingDeleteMany.mockResolvedValue({ count: 1 });
    mocks.deleteCalendarEvent.mockRejectedValue(new Error("google failed"));

    const result = await deleteMeeting("meeting-1", "user-1");

    expect(result).toEqual({ ok: true });
  });
});
