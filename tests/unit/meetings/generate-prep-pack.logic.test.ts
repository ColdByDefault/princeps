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
  decisions?: { id: string; title: string; status: string }[];
};

type MeetingFindFirstArgs = {
  where: { id: string; userId: string };
  select: unknown;
};

type MeetingUpdateArgs = {
  where: { id: string; userId: string };
  data: { prepPack: string | null };
  select: unknown;
};

type UsageCounterUpdateArgs = {
  where: { userId: string };
  data: { tokenMonthlyCount: { increment: number } };
};

const mocks = vi.hoisted(() => ({
  callChat: vi.fn<
    () => Promise<{
      content: string;
      promptTokens: number;
      completionTokens: number;
    }>
  >(),
  meetingFindFirst: vi.fn<
    (args: MeetingFindFirstArgs) => Promise<DbMeetingRow | null>
  >(),
  meetingUpdate: vi.fn<(args: MeetingUpdateArgs) => Promise<DbMeetingRow>>(),
  usageCounterUpdate: vi.fn<
    (args: UsageCounterUpdateArgs) => Promise<unknown>
  >(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    meeting: {
      findFirst: mocks.meetingFindFirst,
      update: mocks.meetingUpdate,
    },
    usageCounter: {
      update: mocks.usageCounterUpdate,
    },
  },
}));

vi.mock("@/lib/llm-providers/provider", () => ({
  callChat: mocks.callChat,
}));

import {
  clearMeetingPrepPack,
  generatePrepPack,
  getMeetingPrepPack,
  updateMeetingPrepPack,
} from "@/lib/meetings/generate-prep-pack.logic";

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
    decisions: [{ id: "decision-1", title: "Approve launch", status: "open" }],
    ...overrides,
  };
}

describe("meeting prep pack logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usageCounterUpdate.mockResolvedValue({});
  });

  it("generates, stores, maps, and accounts for a prep pack", async () => {
    mocks.meetingFindFirst.mockResolvedValue(makeMeetingRow());
    mocks.callChat.mockResolvedValue({
      content: "  # Goal\nPrepare the board discussion.  ",
      promptTokens: 40,
      completionTokens: 60,
    });
    mocks.meetingUpdate.mockResolvedValue(
      makeMeetingRow({ prepPack: "# Goal\nPrepare the board discussion." }),
    );

    const result = await generatePrepPack("meeting-1", "user-1");

    expect(mocks.meetingFindFirst).toHaveBeenCalledWith({
      where: { id: "meeting-1", userId: "user-1" },
      select: expect.objectContaining({ id: true, title: true }),
    });
    const callChatArgs = mocks.callChat.mock.calls[0];
    expect(callChatArgs?.[0][0]).toMatchObject({ role: "user" });
    expect(callChatArgs?.[0][0].content).toContain("Meeting: Board prep");
    expect(callChatArgs?.[0][0].content).toContain("Participants: Alice Johnson");
    expect(callChatArgs?.[0][0].content).toContain("- Prepare packet (open)");
    expect(callChatArgs?.[0][0].content).toContain("- Approve launch (open)");
    expect(callChatArgs?.[1]).toEqual({ temperature: 0.4 });
    expect(mocks.meetingUpdate).toHaveBeenCalledWith({
      where: { id: "meeting-1", userId: "user-1" },
      data: { prepPack: "# Goal\nPrepare the board discussion." },
      select: expect.objectContaining({ id: true, title: true }),
    });
    expect(mocks.usageCounterUpdate).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { tokenMonthlyCount: { increment: 100 } },
    });

    const expectedMeeting: Partial<MeetingRecord> = {
      id: "meeting-1",
      prepPack: "# Goal\nPrepare the board discussion.",
    };
    expect(result).toMatchObject({ ok: true, meeting: expectedMeeting });
  });

  it("returns notFound when the meeting is missing or unowned", async () => {
    mocks.meetingFindFirst.mockResolvedValue(null);

    const result = await generatePrepPack("meeting-1", "user-1");

    expect(result).toEqual({ ok: false, notFound: true });
    expect(mocks.callChat).not.toHaveBeenCalled();
  });

  it("returns an error when the LLM call fails or returns no content", async () => {
    mocks.meetingFindFirst.mockResolvedValue(makeMeetingRow());
    mocks.callChat.mockRejectedValueOnce(new Error("llm unavailable"));

    await expect(generatePrepPack("meeting-1", "user-1")).resolves.toEqual({
      ok: false,
      notFound: false,
      error: "LLM call failed.",
    });

    mocks.callChat.mockResolvedValueOnce({
      content: "",
      promptTokens: 1,
      completionTokens: 0,
    });

    await expect(generatePrepPack("meeting-1", "user-1")).resolves.toEqual({
      ok: false,
      notFound: false,
      error: "No content returned from LLM.",
    });
  });

  it("gets an existing prep pack summary", async () => {
    mocks.meetingFindFirst.mockResolvedValue(
      makeMeetingRow({ prepPack: "# Goal\nPrepare the board discussion." }),
    );

    const result = await getMeetingPrepPack("meeting-1", "user-1");

    expect(mocks.meetingFindFirst).toHaveBeenCalledWith({
      where: { id: "meeting-1", userId: "user-1" },
      select: { title: true, prepPack: true },
    });
    expect(result).toEqual({
      ok: true,
      prepPack: "# Goal\nPrepare the board discussion.",
      meetingTitle: "Board prep",
    });
  });

  it("clears a prep pack after verifying ownership", async () => {
    mocks.meetingFindFirst.mockResolvedValue(makeMeetingRow());
    mocks.meetingUpdate.mockResolvedValue(makeMeetingRow({ prepPack: null }));

    const result = await clearMeetingPrepPack("meeting-1", "user-1");

    expect(mocks.meetingFindFirst).toHaveBeenCalledWith({
      where: { id: "meeting-1", userId: "user-1" },
      select: { id: true },
    });
    expect(mocks.meetingUpdate).toHaveBeenCalledWith({
      where: { id: "meeting-1", userId: "user-1" },
      data: { prepPack: null },
      select: expect.objectContaining({ id: true, title: true }),
    });
    expect(result).toMatchObject({ ok: true, meeting: { prepPack: null } });
  });

  it("updates a prep pack manually after verifying ownership and trimming content", async () => {
    mocks.meetingFindFirst.mockResolvedValue(makeMeetingRow());
    mocks.meetingUpdate.mockResolvedValue(
      makeMeetingRow({ prepPack: "# Updated" }),
    );

    const result = await updateMeetingPrepPack(
      "meeting-1",
      "user-1",
      "  # Updated  ",
    );

    expect(mocks.meetingUpdate).toHaveBeenCalledWith({
      where: { id: "meeting-1", userId: "user-1" },
      data: { prepPack: "# Updated" },
      select: expect.objectContaining({ id: true, title: true }),
    });
    expect(result).toMatchObject({ ok: true, meeting: { prepPack: "# Updated" } });
  });

  it("returns notFound for prep pack get, clear, and update when meeting is missing", async () => {
    mocks.meetingFindFirst.mockResolvedValue(null);

    await expect(getMeetingPrepPack("meeting-1", "user-1")).resolves.toEqual({
      ok: false,
      notFound: true,
    });
    await expect(clearMeetingPrepPack("meeting-1", "user-1")).resolves.toEqual({
      ok: false,
      notFound: true,
    });
    await expect(
      updateMeetingPrepPack("meeting-1", "user-1", "# Updated"),
    ).resolves.toEqual({
      ok: false,
      notFound: true,
    });
  });
});
