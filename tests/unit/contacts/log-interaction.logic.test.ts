import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactNoteRecord } from "@/types/api";

type ContactFindUniqueArgs = {
  where: { id: string };
  select: { userId: true };
};

type ContactNoteCreateArgs = {
  data: {
    userId: string;
    contactId: string;
    type: string;
    note: string;
    date: Date;
  };
  select: unknown;
};

type ContactUpdateArgs = {
  where: { id: string };
  data: { lastContact: Date };
};

type ContactNoteFindManyArgs = {
  where: { userId: string; contactId: string };
  orderBy: { date: "desc" };
  select: unknown;
};

type ContactNoteRow = {
  id: string;
  userId: string;
  contactId: string;
  type: string;
  note: string;
  date: Date;
  createdAt: Date;
};

const mocks = vi.hoisted(() => ({
  contactFindUnique: vi.fn<
    (args: ContactFindUniqueArgs) => Promise<{ userId: string } | null>
  >(),
  contactNoteCreate: vi.fn<
    (args: ContactNoteCreateArgs) => Promise<ContactNoteRow>
  >(),
  contactNoteFindMany: vi.fn<
    (args: ContactNoteFindManyArgs) => Promise<ContactNoteRow[]>
  >(),
  contactUpdate: vi.fn<(args: ContactUpdateArgs) => Promise<unknown>>(),
  transaction: vi.fn<(ops: Promise<unknown>[]) => Promise<unknown[]>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    $transaction: mocks.transaction,
    contact: {
      findUnique: mocks.contactFindUnique,
      update: mocks.contactUpdate,
    },
    contactNote: {
      create: mocks.contactNoteCreate,
      findMany: mocks.contactNoteFindMany,
    },
  },
}));

import {
  listContactInteractions,
  logContactInteraction,
} from "@/lib/features/contacts/log-interaction.logic";

const createdAt = new Date("2026-05-22T08:30:00.000Z");

function makeNoteRow(overrides: Partial<ContactNoteRow> = {}): ContactNoteRow {
  return {
    id: "note-1",
    userId: "user-1",
    contactId: "contact-1",
    type: "meeting",
    note: "Discussed the board packet.",
    date: new Date("2026-05-22T08:00:00.000Z"),
    createdAt,
    ...overrides,
  };
}

describe("contact interaction logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.contactFindUnique.mockResolvedValue({ userId: "user-1" });
    mocks.contactNoteCreate.mockResolvedValue(makeNoteRow());
    mocks.contactUpdate.mockResolvedValue({});
    mocks.contactNoteFindMany.mockResolvedValue([makeNoteRow()]);
    mocks.transaction.mockImplementation(async (ops) => Promise.all(ops));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("logs an interaction for a user-owned contact and updates lastContact", async () => {
    const result = await logContactInteraction("user-1", "contact-1", {
      type: "meeting",
      note: "Discussed the board packet.",
      date: new Date("2026-05-22T08:00:00.000Z"),
    });

    expect(mocks.contactFindUnique).toHaveBeenCalledWith({
      where: { id: "contact-1" },
      select: { userId: true },
    });
    expect(mocks.contactNoteCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        contactId: "contact-1",
        type: "meeting",
        note: "Discussed the board packet.",
        date: new Date("2026-05-22T08:00:00.000Z"),
      },
      select: expect.objectContaining({ id: true, note: true }),
    });
    expect(mocks.contactUpdate).toHaveBeenCalledWith({
      where: { id: "contact-1" },
      data: { lastContact: new Date("2026-05-22T08:00:00.000Z") },
    });
    const expected: ContactNoteRecord = {
      id: "note-1",
      userId: "user-1",
      contactId: "contact-1",
      type: "meeting",
      note: "Discussed the board packet.",
      date: "2026-05-22T08:00:00.000Z",
      createdAt: "2026-05-22T08:30:00.000Z",
    };
    expect(result).toEqual({ ok: true, data: expected });
  });

  it("uses the current time when an interaction date is absent", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-22T10:00:00.000Z"));

    await logContactInteraction("user-1", "contact-1", {
      type: "note",
      note: "Sent a quick follow-up.",
    });

    expect(mocks.contactNoteCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "note",
        date: new Date("2026-05-22T10:00:00.000Z"),
      }),
      select: expect.anything(),
    });
  });

  it("returns not found when the contact is missing or owned by another user", async () => {
    mocks.contactFindUnique.mockResolvedValueOnce(null);

    await expect(
      logContactInteraction("user-1", "contact-1", {
        type: "note",
        note: "Follow-up.",
      }),
    ).resolves.toEqual({ ok: false, error: "Contact not found." });

    mocks.contactFindUnique.mockResolvedValueOnce({ userId: "other-user" });

    await expect(
      logContactInteraction("user-1", "contact-1", {
        type: "note",
        note: "Follow-up.",
      }),
    ).resolves.toEqual({ ok: false, error: "Contact not found." });
    expect(mocks.contactNoteCreate).not.toHaveBeenCalled();
  });

  it("lists contact interactions scoped to the user and contact", async () => {
    const result = await listContactInteractions("user-1", "contact-1");

    expect(mocks.contactNoteFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1", contactId: "contact-1" },
      orderBy: { date: "desc" },
      select: expect.objectContaining({ id: true, note: true }),
    });
    expect(result).toEqual([
      {
        id: "note-1",
        userId: "user-1",
        contactId: "contact-1",
        type: "meeting",
        note: "Discussed the board packet.",
        date: "2026-05-22T08:00:00.000Z",
        createdAt: "2026-05-22T08:30:00.000Z",
      },
    ]);
  });
});
