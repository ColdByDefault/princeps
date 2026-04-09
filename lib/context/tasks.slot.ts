/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { listTasks } from "@/lib/tasks";
import type { ContextSlot } from "@/lib/context";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export const tasksSlot: ContextSlot = {
  key: "tasks",
  label: "Open Tasks",
  async fetch(userId) {
    const tasks = await listTasks(userId, { status: "open" });
    const inProgress = await listTasks(userId, { status: "in_progress" });
    const all = [...inProgress, ...tasks].sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2),
    );

    if (all.length === 0) return null;

    const lines = all.map((t) => {
      const due = t.dueDate
        ? ` (due ${new Date(t.dueDate).toISOString().slice(0, 10)})`
        : "";
      const inProg = t.status === "in_progress" ? " [in progress]" : "";
      const meeting = t.meetingId ? ` — linked meeting: ${t.meetingId}` : "";
      const goals =
        t.goals && t.goals.length > 0
          ? ` — goals: ${t.goals.map((g) => g.title).join(", ")}`
          : "";
      return `- [${t.id}] ${t.title}${inProg}${due} — priority: ${t.priority}${meeting}${goals}`;
    });

    return lines.join("\n");
  },
};
