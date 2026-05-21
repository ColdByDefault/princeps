import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeetingRecord } from "@/types/api";

type DbMeetingRow = {
  id: string;
  title: string;
  scheduledAt: Date;
  durationMin: number | null;
  location: string | null;
  status: string;
  kind: string;
  source: string;
  googleEventId: string | null;
  agenda: string | null;
  summary: string | null;
  prepPack: string | null;
  createdAt: Date;
  updatedAt: Date;
  labelLinks: {
    label: { id: string; name: string; color: string; icon: string | null };
  }[];
  participants: {
    id: string;
    contactId: string;
    contact: { name: string };
  }[];
  tasks: { id: string; title: string; status: string }[];
};

type MeetingUpdateArgs = {
  where: { id: string; userId?: string };
  data: {
    title?: string;
    scheduledAt?: Date;
    durationMin?: number | null;
    location?: string | null;
    status?: string;
    kind?: string;
    agenda?: string | null;
    summary?: string | null;
    googleEventId?: string;
    source?: "google_calendar";
    labelLinks?: {
      deleteMany: Record<string, never>;
      create: { labelId: string }[];
    };
    participants?: {
      deleteMany: Record<string, never>;
      create: { contactId: string }[];
    };
  };
  select?: unknown;
};

type MeetingFindUniqueOrThrowArgs = {
  where: { id: string };
  select: unknown;
};

type TaskUpdateManyArgs = {
  where: { meetingId?: string; userId: string; id?: { in: string[] } };
  data: { meetingId: string | null };
};

const mocks = vi.hoisted(() => ({
  createCalendarEvent: vi.fn<() => Promise<string>>(),
  meetingFindUniqueOrThrow: vi.fn<
    (args: MeetingFindUniqueOrThrowArgs) => Promise<DbMeetingRow>
  >(),
  meetingUpdate: vi.fn<(args: MeetingUpdateArgs) => Promise<unknown>>(),
  taskUpdateMany: vi.fn<(args: TaskUpdateManyArgs) => Promise<{ count: number }>>(),
  transaction: vi.fn<(batch: unknown[]) => Promise<unknown[]>>(),
  updateCalendarEvent: vi.fn<() => Promise<void>>(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: mocks.transaction,
    meeting: {
      findUniqueOrThrow: mocks.meetingFindUniqueOrThrow,
      update: mocks.meetingUpdate,
    },
    task: {
      updateMany: mocks.taskUpdateMany,
    },
  },
}));

vi.mock("@/lib/integrations/google-calendar/events", () => ({
  createCalendarEvent: mocks.createCalendarEvent,
  updateCalendarEvent: mocks.updateCalendarEvent,
}));

import { updateMeeting } from "@/lib/meetings/update.logic";

const createdAt = new Date("2026-05-08T06:00:00.000Z");
const updatedAt = new Date("2026-05-08T06:30:00.000Z");

function makeMeetingRow(overrides: Partial<DbMeetingRow> = {}): DbMeetingRow {
  return {
    id: "meeting-1",
    title: "Board prep",
    scheduledAt: new Date("2026-06-01T08:00:00.000Z"),
    durationMin: 45,
    location: "HQ",
    status: "upcoming",
    kind: "meeting",
    source: "manual",
    googleEventId: null,
    agenda: "Review packet",
    summary: null,
    prepPack: null,
    createdAt,
    updatedAt,
    labelLinks: [
      {
        label: {
          id: "label-1",
          name: "Board",
          color: "#2563eb",
          icon: null,
        },
      },
    ],
    participants: [
      {
        id: "participant-1",
        contactId: "contact-1",
        contact: { name: "Alice Johnson" },
      },
    ],
    tasks: [{ id: "task-1", title: "Prepare packet", status: "open" }],
    ...overrides,
  };
}

describe("updateMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.meetingUpdate.mockResolvedValue({});
    mocks.taskUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transaction.mockResolvedValue([]);
    mocks.updateCalendarEvent.mockResolvedValue();
  });

  it("updates a user-scoped meeting, replaces links, relinks tasks, and maps the result", async () => {
    mocks.meetingFindUniqueOrThrow.mockResolvedValue(makeMeetingRow());

    const result = await updateMeeting("meeting-1", "user-1", {
      title: "Board prep",
      scheduledAt: "2026-06-01T08:00:00Z",
      durationMin: 45,
      location: "HQ",
      status: "upcoming",
      kind: "meeting",
      agenda: "Review packet",
      summary: null,
      labelIds: ["label-1", "label-1"],
      participantContactIds: ["contact-1", "contact-1"],
      linkedTaskIds: ["task-1", "task-1"],
    });

    const updateArgs = mocks.meetingUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.where).toEqual({ id: "meeting-1", userId: "user-1" });
    expect(updateArgs?.data).toMatchObject({
      title: "Board prep",
      durationMin: 45,
      location: "HQ",
      status: "upcoming",
      kind: "meeting",
      agenda: "Review packet",
      summary: null,
      labelLinks: {
        deleteMany: {},
        create: [{ labelId: "label-1" }],
      },
      participants: {
        deleteMany: {},
        create: [{ contactId: "contact-1" }],
      },
    });
    expect(updateArgs?.data.scheduledAt).toBeInstanceOf(Date);
    expect(updateArgs?.data.scheduledAt?.toISOString()).toBe(
      "2026-06-01T08:00:00.000Z",
    );
    expect(mocks.taskUpdateMany).toHaveBeenNthCalledWith(1, {
      where: { meetingId: "meeting-1", userId: "user-1" },
      data: { meetingId: null },
    });
    expect(mocks.taskUpdateMany).toHaveBeenNthCalledWith(2, {
      where: { id: { in: ["task-1"] }, userId: "user-1" },
      data: { meetingId: "meeting-1" },
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.meetingFindUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "meeting-1" },
      select: expect.objectContaining({ id: true, title: true }),
    });

    const expectedMeeting: MeetingRecord = {
      id: "meeting-1",
      title: "Board prep",
      scheduledAt: "2026-06-01T08:00:00.000Z",
      durationMin: 45,
      location: "HQ",
      agenda: "Review packet",
      summary: null,
      prepPack: null,
      status: "upcoming",
      kind: "meeting",
      source: "manual",
      googleEventId: null,
      labels: [{ id: "label-1", name: "Board", color: "#2563eb", icon: null }],
      participants: [
        {
          id: "participant-1",
          contactId: "contact-1",
          contactName: "Alice Johnson",
        },
      ],
      tasks: [{ id: "task-1", title: "Prepare packet", status: "open" }],
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(result).toEqual({ ok: true, meeting: expectedMeeting });
  });

  it("syncs updates to Google Calendar when the meeting already has a googleEventId", async () => {
    mocks.meetingFindUniqueOrThrow.mockResolvedValue(
      makeMeetingRow({ googleEventId: "google-event-1" }),
    );

    await updateMeeting("meeting-1", "user-1", {
      title: "Board prep",
    });

    expect(mocks.updateCalendarEvent).toHaveBeenCalledWith(
      "user-1",
      "google-event-1",
      {
        title: "Board prep",
        scheduledAt: "2026-06-01T08:00:00.000Z",
        durationMin: 45,
        location: "HQ",
        agenda: "Review packet",
      },
    );
  });

  it("pushes an unlinked meeting to Google Calendar when requested", async () => {
    mocks.meetingFindUniqueOrThrow.mockResolvedValue(makeMeetingRow());
    mocks.createCalendarEvent.mockResolvedValue("google-event-1");
    mocks.meetingUpdate
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(
        makeMeetingRow({
          googleEventId: "google-event-1",
          source: "google_calendar",
        }),
      );

    const result = await updateMeeting("meeting-1", "user-1", {
      pushToGoogle: true,
    });

    expect(mocks.createCalendarEvent).toHaveBeenCalledWith("user-1", {
      title: "Board prep",
      scheduledAt: new Date("2026-06-01T08:00:00.000Z"),
      durationMin: 45,
      location: "HQ",
      agenda: "Review packet",
    });
    expect(mocks.meetingUpdate).toHaveBeenLastCalledWith({
      where: { id: "meeting-1" },
      data: {
        googleEventId: "google-event-1",
        source: "google_calendar",
      },
      select: expect.objectContaining({ id: true, title: true }),
    });
    expect(result).toMatchObject({
      ok: true,
      meeting: {
        googleEventId: "google-event-1",
        source: "google_calendar",
      },
    });
  });

  it("returns notFound when the transactional update fails", async () => {
    mocks.transaction.mockRejectedValue(new Error("Record not found"));

    const result = await updateMeeting("meeting-1", "user-1", {
      title: "Board prep",
    });

    expect(result).toEqual({ ok: false, notFound: true });
  });
});
