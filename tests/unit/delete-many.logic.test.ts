/**
 * Consolidated delete-many logic tests for entities whose delete implementation
 * follows the identical pattern: deleteMany({ where: { id, userId } }) → { ok: boolean }.
 *
 * Covered: contacts · decisions · goals · labels · tasks
 *
 * Entities with non-trivial delete logic (calendar sync, findUnique-guard,
 * soft-delete via updateMany, bulk-delete variant) keep their own test files.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

type DeleteManyArgs = {
  where: { id: string; userId: string };
};

const mocks = vi.hoisted(() => ({
  contactDeleteMany: vi.fn<(a: DeleteManyArgs) => Promise<{ count: number }>>(),
  decisionDeleteMany:
    vi.fn<(a: DeleteManyArgs) => Promise<{ count: number }>>(),
  goalDeleteMany: vi.fn<(a: DeleteManyArgs) => Promise<{ count: number }>>(),
  labelDeleteMany: vi.fn<(a: DeleteManyArgs) => Promise<{ count: number }>>(),
  taskDeleteMany: vi.fn<(a: DeleteManyArgs) => Promise<{ count: number }>>(),
}));

vi.mock("@/lib/core/db", () => ({
  db: {
    contact: { deleteMany: mocks.contactDeleteMany },
    decision: { deleteMany: mocks.decisionDeleteMany },
    goal: { deleteMany: mocks.goalDeleteMany },
    label: { deleteMany: mocks.labelDeleteMany },
    task: { deleteMany: mocks.taskDeleteMany },
  },
}));

import { deleteContact } from "@/lib/features/contacts/delete.logic";
import { deleteDecision } from "@/lib/features/decisions/delete.logic";
import { deleteGoal } from "@/lib/features/goals/delete.logic";
import { deleteLabel } from "@/lib/features/labels/delete.logic";
import { deleteTask } from "@/lib/features/tasks/delete.logic";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// contacts
// ---------------------------------------------------------------------------

describe("deleteContact", () => {
  it("deletes only a user-owned contact", async () => {
    mocks.contactDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteContact("contact-1", "user-1");

    expect(mocks.contactDeleteMany).toHaveBeenCalledWith({
      where: { id: "contact-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned contact is deleted", async () => {
    mocks.contactDeleteMany.mockResolvedValue({ count: 0 });

    expect(await deleteContact("contact-1", "user-1")).toEqual({ ok: false });
  });
});

// ---------------------------------------------------------------------------
// decisions
// ---------------------------------------------------------------------------

describe("deleteDecision", () => {
  it("deletes only a user-owned decision", async () => {
    mocks.decisionDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteDecision("decision-1", "user-1");

    expect(mocks.decisionDeleteMany).toHaveBeenCalledWith({
      where: { id: "decision-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned decision is deleted", async () => {
    mocks.decisionDeleteMany.mockResolvedValue({ count: 0 });

    expect(await deleteDecision("decision-1", "user-1")).toEqual({ ok: false });
  });
});

// ---------------------------------------------------------------------------
// goals
// ---------------------------------------------------------------------------

describe("deleteGoal", () => {
  it("deletes only a user-owned goal", async () => {
    mocks.goalDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteGoal("goal-1", "user-1");

    expect(mocks.goalDeleteMany).toHaveBeenCalledWith({
      where: { id: "goal-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned goal is deleted", async () => {
    mocks.goalDeleteMany.mockResolvedValue({ count: 0 });

    expect(await deleteGoal("goal-1", "user-1")).toEqual({ ok: false });
  });
});

// ---------------------------------------------------------------------------
// labels
// ---------------------------------------------------------------------------

describe("deleteLabel", () => {
  it("deletes only a user-owned label", async () => {
    mocks.labelDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteLabel("label-1", "user-1");

    expect(mocks.labelDeleteMany).toHaveBeenCalledWith({
      where: { id: "label-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned label is deleted", async () => {
    mocks.labelDeleteMany.mockResolvedValue({ count: 0 });

    expect(await deleteLabel("label-1", "user-1")).toEqual({ ok: false });
  });
});

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------

describe("deleteTask", () => {
  it("deletes only a user-owned task", async () => {
    mocks.taskDeleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteTask("task-1", "user-1");

    expect(mocks.taskDeleteMany).toHaveBeenCalledWith({
      where: { id: "task-1", userId: "user-1" },
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false when no user-owned task is deleted", async () => {
    mocks.taskDeleteMany.mockResolvedValue({ count: 0 });

    expect(await deleteTask("task-1", "user-1")).toEqual({ ok: false });
  });
});
