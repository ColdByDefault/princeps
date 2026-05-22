/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */

import "server-only";

import { listDecisions } from "@/lib/features/decisions";
import type { ContextSlot } from "@/lib/ai/context";

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
      const meeting = d.meetingId ? ` — from meeting: ${d.meetingId}` : "";
      return `- [${d.id}] ${d.title} ${status}${decided}${outcome}${rationale}${meeting}`;
    });

    return lines.join("\n");
  },
};
