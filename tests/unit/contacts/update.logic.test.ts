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

type ContactUpdateArgs = {
  where: { id: string; userId: string };
  data: {
    name?: string;
    role?: string | null;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    lastContact?: Date | null;
    labelLinks?: {
      deleteMany: Record<string, never>;
      create: { labelId: string }[];
    };
  };
  select: unknown;
};

const mocks = vi.hoisted(() => ({
  contactUpdate: vi.fn<(args: ContactUpdateArgs) => Promise<DbContactRow>>(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    contact: {
      update: mocks.contactUpdate,
    },
  },
}));

import { updateContact } from "@/lib/contacts/update.logic";

const createdAt = new Date("2026-05-08T06:00:00.000Z");
const updatedAt = new Date("2026-05-08T06:30:00.000Z");

function makeContactRow(overrides: Partial<DbContactRow> = {}): DbContactRow {
  return {
    id: "contact-1",
    name: "Alice Johnson",
    role: null,
    company: "Acme Corp",
    email: null,
    phone: "+1 555 0100",
    notes: "Prefers concise follow-ups.",
    lastContact: new Date("2026-05-20T09:30:00.000Z"),
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

describe("updateContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a user-scoped contact and maps the result", async () => {
    const lastContact = new Date("2026-05-20T09:30:00.000Z");
    mocks.contactUpdate.mockResolvedValue(makeContactRow({ lastContact }));

    const result = await updateContact("contact-1", "user-1", {
      name: "Alice Johnson",
      role: null,
      company: "Acme Corp",
      email: "",
      phone: "+1 555 0100",
      notes: "Prefers concise follow-ups.",
      lastContact,
      labelIds: ["label-1"],
    });

    expect(mocks.contactUpdate).toHaveBeenCalledWith({
      where: { id: "contact-1", userId: "user-1" },
      data: {
        name: "Alice Johnson",
        role: null,
        company: "Acme Corp",
        email: null,
        phone: "+1 555 0100",
        notes: "Prefers concise follow-ups.",
        lastContact,
        labelLinks: {
          deleteMany: {},
          create: [{ labelId: "label-1" }],
        },
      },
      select: expect.objectContaining({ id: true, name: true }),
    });

    const expectedContact: ContactRecord = {
      id: "contact-1",
      name: "Alice Johnson",
      role: null,
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
    expect(result).toEqual({ ok: true, contact: expectedContact });
  });

  it("clears lastContact and labels when explicit null and empty arrays are provided", async () => {
    mocks.contactUpdate.mockResolvedValue(
      makeContactRow({
        lastContact: null,
        labelLinks: [],
      }),
    );

    const result = await updateContact("contact-1", "user-1", {
      lastContact: null,
      labelIds: [],
    });

    const updateArgs = mocks.contactUpdate.mock.calls[0]?.[0];
    expect(updateArgs?.data).toMatchObject({
      lastContact: null,
      labelLinks: { deleteMany: {}, create: [] },
    });
    expect(result).toMatchObject({
      ok: true,
      contact: {
        lastContact: null,
        labels: [],
      },
    });
  });

  it("returns notFound when no user-owned contact is updated", async () => {
    mocks.contactUpdate.mockRejectedValue(new Error("Record not found"));

    const result = await updateContact("contact-1", "user-1", {
      name: "Alice Johnson",
    });

    expect(result).toEqual({ ok: false, notFound: true });
  });
});
