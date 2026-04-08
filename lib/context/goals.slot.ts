/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { listGoals } from "@/lib/goals";
import type { ContextSlot } from "@/lib/context";

export const goalsSlot: ContextSlot = {
  key: "goals",
  label: "Goals",
  async fetch(userId) {
    const goals = await listGoals(userId);
    if (goals.length === 0) return null;

    const lines = goals.map((g) => {
      const status = `[${g.status}]`;
      const target = g.targetDate
        ? ` target: ${new Date(g.targetDate).toISOString().slice(0, 10)}`
        : "";
      const desc = g.description ? ` — ${g.description}` : "";
      const total = g.milestones.length;
      const done = g.milestones.filter((m) => m.completed).length;
      const progress = total > 0 ? ` milestones: ${done}/${total}` : "";
      const tasks =
        g.tasks && g.tasks.length > 0
          ? ` — linked tasks: ${g.tasks.map((t) => `${t.title} (${t.status})`).join(", ")}`
          : "";
      return `- [${g.id}] ${g.title} ${status}${target}${desc}${progress}${tasks}`;
    });

    return lines.join("\n");
  },
};
