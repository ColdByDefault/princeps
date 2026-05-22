import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MeetingRecord } from "@/types/api";
import type { LabelLinkRow } from "@/tests/helpers/db-rows";

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
  labelLinks: LabelLinkRow[];
  participants: {
    id: string;
    contactId: string;
    contact: { name: string };
  }[];
  tasks: { id: string; title: string; status: string }[];
};

type MeetingFindManyArgs = {
  where: unknown;
  orderBy?: unknown;
  take?: number;
  select: unknown;
};

type MeetingUpdateManyArgs = {
  where: { id: { in: string[] } };
  data: { status: "done" };
};

const mocks = vi.hoisted(() => ({
  meetingFindMany: vi.fn<(args: MeetingFindManyArgs) => Promise<unknown[]>>(),
  meetingUpdateMany: vi.fn<
    (args: MeetingUpdateManyArgs) => Promise<{ count: number }>
  >(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    meeting: {
      findMany: mocks.meetingFindMany,
      updateMany: mocks.meetingUpdateMany,
    },
  },
}));

import { listMeetings } from "@/lib/features/meetings/list.logic";

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

describe("listMeetings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto-expires stale upcoming meetings before listing filtered meetings", async () => {
    const staleMeeting = {
      id: "meeting-stale",
      scheduledAt: new Date("2026-05-21T10:00:00.000Z"),
      durationMin: 30,
    };
    mocks.meetingFindMany
      .mockResolvedValueOnce([staleMeeting])
      .mockResolvedValueOnce([makeMeetingRow({ id: "meeting-1" })]);
    mocks.meetingUpdateMany.mockResolvedValue({ count: 1 });

    const records = await listMeetings("user-1", { status: "upcoming" });

    expect(mocks.meetingFindMany).toHaveBeenNthCalledWith(1, {
      where: { userId: "user-1", status: "upcoming" },
      select: { id: true, scheduledAt: true, durationMin: true },
    });
    expect(mocks.meetingUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ["meeting-stale"] } },
      data: { status: "done" },
    });
    expect(mocks.meetingFindMany).toHaveBeenNthCalledWith(2, {
      where: { userId: "user-1", status: "upcoming" },
      orderBy: { scheduledAt: "asc" },
      take: 500,
      select: expect.objectContaining({ id: true, title: true }),
    });

    const expectedRecords: MeetingRecord[] = [
      {
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
        labels: [
          { id: "label-1", name: "Board", color: "#2563eb", icon: null },
        ],
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
      },
    ];
    expect(records).toEqual(expectedRecords);
  });

  it("returns upcoming meetings followed by recent past meetings in the all view", async () => {
    const upcoming = makeMeetingRow({ id: "meeting-upcoming" });
    const past = makeMeetingRow({
      id: "meeting-past",
      status: "done",
      scheduledAt: new Date("2026-05-01T08:00:00.000Z"),
    });
    mocks.meetingFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([upcoming])
      .mockResolvedValueOnce([past]);

    const records = await listMeetings("user-1");

    expect(mocks.meetingUpdateMany).not.toHaveBeenCalled();
    expect(mocks.meetingFindMany).toHaveBeenNthCalledWith(2, {
      where: { userId: "user-1", status: "upcoming" },
      orderBy: { scheduledAt: "asc" },
      take: 500,
      select: expect.objectContaining({ id: true, title: true }),
    });
    expect(mocks.meetingFindMany).toHaveBeenNthCalledWith(3, {
      where: { userId: "user-1", status: { in: ["done", "cancelled"] } },
      orderBy: { scheduledAt: "desc" },
      take: 200,
      select: expect.objectContaining({ id: true, title: true }),
    });
    expect(records.map((record) => record.id)).toEqual([
      "meeting-upcoming",
      "meeting-past",
    ]);
  });

  it("uses descending date order and a smaller cap for done meetings", async () => {
    mocks.meetingFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        makeMeetingRow({
          id: "meeting-done",
          status: "done",
          scheduledAt: new Date("2026-05-01T08:00:00.000Z"),
        }),
      ]);

    await listMeetings("user-1", { status: "done" });

    expect(mocks.meetingFindMany).toHaveBeenNthCalledWith(2, {
      where: { userId: "user-1", status: "done" },
      orderBy: { scheduledAt: "desc" },
      take: 200,
      select: expect.objectContaining({ id: true, title: true }),
    });
  });
});
