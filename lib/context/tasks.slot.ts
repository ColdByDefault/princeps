/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { type ContextSlot } from "@/lib/context";

const PRIORITY_ORDER = ["urgent", "high", "normal", "low"];

export const tasksSlot: ContextSlot = {
  key: "tasks",
  label: "Tasks",
  async fetch(userId: string): Promise<string | null> {
    const rows = await db.task.findMany({
      where: { userId, status: { in: ["open", "in_progress"] } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 20, // fetch extra, then re-sort + cap
    });

    const sorted = rows
      .slice()
      .sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf(a.priority) -
          PRIORITY_ORDER.indexOf(b.priority),
      )
      .slice(0, 10);

    if (sorted.length === 0) return null;

    const lines = sorted.map((t) => {
      const parts = [`- [${t.priority}] ${t.title}`];
      if (t.status === "in_progress") parts.push("(in progress)");
      if (t.dueDate) parts.push(`due ${t.dueDate.toISOString().slice(0, 10)}`);
      return parts.join(" ");
    });

    return `Open tasks:\n${lines.join("\n")}`;
  },
};
