import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactRecord } from "@/types/api";

type DbContactRow = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  lastContact: Date | null;
  createdAt: Date;
  updatedAt: Date;
  labelLinks: {
    label: { id: string; name: string; color: string; icon: string | null };
  }[];
};

type ContactFindManyArgs = {
  where: { userId: string };
  orderBy: { createdAt: "desc" };
  select: unknown;
};

type ContactFindFirstArgs = {
  where: { id: string; userId: string };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  contactFindFirst: vi.fn<
    (args: ContactFindFirstArgs) => Promise<DbContactRow | null>
  >(),
  contactFindMany: vi.fn<(args: ContactFindManyArgs) => Promise<DbContactRow[]>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    contact: {
      findFirst: mocks.contactFindFirst,
      findMany: mocks.contactFindMany,
    },
  },
}));

import { getContactById, listContacts } from "@/lib/features/contacts/list.logic";

const createdAt = new Date("2026-05-08T06:00:00.000Z");
const updatedAt = new Date("2026-05-08T06:30:00.000Z");

function makeContactRow(overrides: Partial<DbContactRow> = {}): DbContactRow {
  return {
    id: "contact-1",
    name: "Alice Johnson",
    role: "CTO",
    company: "Acme Corp",
    email: "alice@example.com",
    phone: "+1 555 0100",
    notes: null,
    lastContact: null,
    createdAt,
    updatedAt,
    labelLinks: [
      {
        label: {
          id: "label-1",
          name: "Important",
          color: "#0f766e",
          icon: null,
        },
      },
    ],
    ...overrides,
  };
}

describe("contact list logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists contacts scoped to the user and maps rows to client-safe records", async () => {
    mocks.contactFindMany.mockResolvedValue([makeContactRow()]);

    const records = await listContacts("user-1");

    expect(mocks.contactFindMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      select: expect.objectContaining({ id: true, name: true }),
    });

    const expectedRecords: ContactRecord[] = [
      {
        id: "contact-1",
        name: "Alice Johnson",
        role: "CTO",
        company: "Acme Corp",
        email: "alice@example.com",
        phone: "+1 555 0100",
        notes: null,
        labels: [
          { id: "label-1", name: "Important", color: "#0f766e", icon: null },
        ],
        lastContact: null,
        createdAt: "2026-05-08T06:00:00.000Z",
        updatedAt: "2026-05-08T06:30:00.000Z",
      },
    ];
    expect(records).toEqual(expectedRecords);
  });

  it("gets one user-owned contact by id", async () => {
    const lastContact = new Date("2026-05-20T09:30:00.000Z");
    mocks.contactFindFirst.mockResolvedValue(makeContactRow({ lastContact }));

    const record = await getContactById("user-1", "contact-1");

    expect(mocks.contactFindFirst).toHaveBeenCalledWith({
      where: { id: "contact-1", userId: "user-1" },
      select: expect.objectContaining({ id: true, name: true }),
    });
    expect(record).toMatchObject({
      id: "contact-1",
      lastContact: "2026-05-20T09:30:00.000Z",
    });
  });

  it("returns null when the contact is missing or not user-owned", async () => {
    mocks.contactFindFirst.mockResolvedValue(null);

    await expect(getContactById("user-1", "contact-1")).resolves.toBeNull();
  });
});
