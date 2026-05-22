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

type MeetingCreateArgs = {
  data: {
    userId: string;
    title: string;
    scheduledAt: Date;
    durationMin: number | null;
    location: string | null;
    status?: string;
    kind?: string;
    agenda: string | null;
    summary: string | null;
    source?: string;
    labelLinks?: { create: { labelId: string }[] };
    participants?: { create: { contactId: string }[] };
  };
  select: unknown;
};

type MeetingUpdateArgs = {
  where: { id: string };
  data: {
    googleEventId: string;
    source: "google_calendar";
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  createCalendarEvent: vi.fn<() => Promise<string>>(),
  meetingCreate: vi.fn<(args: MeetingCreateArgs) => Promise<DbMeetingRow>>(),
  meetingUpdate: vi.fn<(args: MeetingUpdateArgs) => Promise<DbMeetingRow>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    meeting: {
      create: mocks.meetingCreate,
      update: mocks.meetingUpdate,
    },
  },
}));

vi.mock("@/lib/platform/integrations/google-calendar/events", () => ({
  createCalendarEvent: mocks.createCalendarEvent,
}));

import { createMeeting } from "@/lib/features/meetings/create.logic";

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

describe("createMeeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists user-scoped meeting data with deduped labels and participants", async () => {
    mocks.meetingCreate.mockResolvedValue(makeMeetingRow());

    const record = await createMeeting("user-1", {
      title: "Board prep",
      scheduledAt: "2026-06-01T08:00:00Z",
      durationMin: 45,
      location: "HQ",
      status: "upcoming",
      kind: "meeting",
      agenda: "Review packet",
      summary: null,
      source: "manual",
      labelIds: ["label-1", "label-1"],
      participantContactIds: ["contact-1", "contact-1"],
    });

    const createArgs = mocks.meetingCreate.mock.calls[0]?.[0];
    expect(createArgs?.data).toMatchObject({
      userId: "user-1",
      title: "Board prep",
      durationMin: 45,
      location: "HQ",
      status: "upcoming",
      kind: "meeting",
      agenda: "Review packet",
      summary: null,
      source: "manual",
      labelLinks: { create: [{ labelId: "label-1" }] },
      participants: { create: [{ contactId: "contact-1" }] },
    });
    expect(createArgs?.data.scheduledAt).toBeInstanceOf(Date);
    expect(createArgs?.data.scheduledAt.toISOString()).toBe(
      "2026-06-01T08:00:00.000Z",
    );

    const expectedRecord: MeetingRecord = {
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
    expect(record).toEqual(expectedRecord);
    expect(mocks.createCalendarEvent).not.toHaveBeenCalled();
  });

  it("pushes to Google Calendar when requested and returns the stamped meeting", async () => {
    mocks.meetingCreate.mockResolvedValue(makeMeetingRow());
    mocks.createCalendarEvent.mockResolvedValue("google-event-1");
    mocks.meetingUpdate.mockResolvedValue(
      makeMeetingRow({
        source: "google_calendar",
        googleEventId: "google-event-1",
      }),
    );

    const record = await createMeeting("user-1", {
      title: "Board prep",
      scheduledAt: "2026-06-01T08:00:00Z",
      durationMin: 45,
      location: "HQ",
      agenda: "Review packet",
      pushToGoogle: true,
    });

    expect(mocks.createCalendarEvent).toHaveBeenCalledWith("user-1", {
      title: "Board prep",
      scheduledAt: new Date("2026-06-01T08:00:00Z"),
      durationMin: 45,
      location: "HQ",
      agenda: "Review packet",
    });
    expect(mocks.meetingUpdate).toHaveBeenCalledWith({
      where: { id: "meeting-1" },
      data: {
        googleEventId: "google-event-1",
        source: "google_calendar",
      },
      select: expect.objectContaining({ id: true, title: true }),
    });
    expect(record.googleEventId).toBe("google-event-1");
    expect(record.source).toBe("google_calendar");
  });

  it("returns the Princeps meeting when Google Calendar push fails", async () => {
    mocks.meetingCreate.mockResolvedValue(makeMeetingRow());
    mocks.createCalendarEvent.mockRejectedValue(new Error("google failed"));

    const record = await createMeeting("user-1", {
      title: "Board prep",
      scheduledAt: "2026-06-01T08:00:00Z",
      pushToGoogle: true,
    });

    expect(record).toMatchObject({
      id: "meeting-1",
      googleEventId: null,
      source: "manual",
    });
    expect(mocks.meetingUpdate).not.toHaveBeenCalled();
  });
});
