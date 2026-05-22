import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactRecord } from "@/types/api";
import type { LabelLinkRow } from "@/tests/helpers/db-rows";

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
  labelLinks: LabelLinkRow[];
};

type ContactCreateArgs = {
  data: {
    userId: string;
    name: string;
    role: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
    lastContact: Date | null;
    labelLinks?: { create: { labelId: string }[] };
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  contactCreate: vi.fn<(args: ContactCreateArgs) => Promise<DbContactRow>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    contact: {
      create: mocks.contactCreate,
    },
  },
}));

import { createContact } from "@/lib/features/contacts/create.logic";

describe("createContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists user-scoped contact data and returns a client-safe record", async () => {
    const lastContact = new Date("2026-05-20T09:30:00.000Z");
    const createdAt = new Date("2026-05-08T06:00:00.000Z");
    const updatedAt = new Date("2026-05-08T06:30:00.000Z");
    const row: DbContactRow = {
      id: "contact-1",
      name: "Alice Johnson",
      role: "CTO",
      company: "Acme Corp",
      email: null,
      phone: "+1 555 0100",
      notes: "Prefers concise follow-ups.",
      lastContact,
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
    };
    mocks.contactCreate.mockResolvedValue(row);

    const record = await createContact("user-1", {
      name: "Alice Johnson",
      role: "CTO",
      company: "Acme Corp",
      email: "",
      phone: "+1 555 0100",
      notes: "Prefers concise follow-ups.",
      lastContact,
      labelIds: ["label-1"],
    });

    expect(mocks.contactCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        name: "Alice Johnson",
        role: "CTO",
        company: "Acme Corp",
        email: null,
        phone: "+1 555 0100",
        notes: "Prefers concise follow-ups.",
        lastContact,
        labelLinks: { create: [{ labelId: "label-1" }] },
      },
      select: expect.objectContaining({ id: true, name: true }),
    });

    const expectedRecord: ContactRecord = {
      id: "contact-1",
      name: "Alice Johnson",
      role: "CTO",
      company: "Acme Corp",
      email: null,
      phone: "+1 555 0100",
      notes: "Prefers concise follow-ups.",
      labels: [
        { id: "label-1", name: "Important", color: "#0f766e", icon: null },
      ],
      lastContact: "2026-05-20T09:30:00.000Z",
      createdAt: "2026-05-08T06:00:00.000Z",
      updatedAt: "2026-05-08T06:30:00.000Z",
    };
    expect(record).toEqual(expectedRecord);
  });
});
