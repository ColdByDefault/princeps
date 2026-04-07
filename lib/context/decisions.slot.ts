/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { listDecisions } from "@/lib/decisions/list.logic";
import type { ContextSlot } from "@/lib/context";

export const decisionsSlot: ContextSlot = {
  key: "decisions",
  label: "Decisions",
  async fetch(userId) {
    const decisions = await listDecisions(userId);
    if (decisions.length === 0) return null;

    const lines = decisions.map((d) => {
      const status = `[${d.status}]`;
      const decided = d.decidedAt
        ? ` decided on ${new Date(d.decidedAt).toISOString().slice(0, 10)}`
        : "";
      const outcome = d.outcome ? ` — outcome: ${d.outcome}` : "";
      const rationale = d.rationale ? ` — rationale: ${d.rationale}` : "";
      return `- [${d.id}] ${d.title} ${status}${decided}${outcome}${rationale}`;
    });

    return lines.join("\n");
  },
};
