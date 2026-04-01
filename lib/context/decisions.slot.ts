/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { type ContextSlot } from "@/lib/context";

export const decisionsSlot: ContextSlot = {
  key: "decisions",
  label: "Decisions",
  async fetch(userId: string): Promise<string | null> {
    // All open decisions + last 5 decided/reversed (most recent first)
    const [open, closed] = await Promise.all([
      db.decision.findMany({
        where: { userId, status: "open" },
        select: {
          title: true,
          rationale: true,
          status: true,
          createdAt: true,
          labelLinks: { select: { label: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.decision.findMany({
        where: { userId, status: { in: ["decided", "reversed"] } },
        select: {
          title: true,
          outcome: true,
          status: true,
          decidedAt: true,
          labelLinks: { select: { label: { select: { name: true } } } },
        },
        orderBy: { decidedAt: "desc" },
        take: 5,
      }),
    ]);

    if (open.length === 0 && closed.length === 0) return null;

    const lines: string[] = [];

    if (open.length > 0) {
      lines.push("Open decisions:");
      for (const d of open) {
        const parts = [`- [open] ${d.title}`];
        const labels = d.labelLinks.map((link) => link.label.name).join(", ");
        if (labels) parts.push(`[labels: ${labels}]`);
        if (d.rationale) parts.push(`(${d.rationale})`);
        lines.push(parts.join(" "));
      }
    }

    if (closed.length > 0) {
      lines.push("Recent decisions:");
      for (const d of closed) {
        const date = d.decidedAt
          ? d.decidedAt.toISOString().slice(0, 10)
          : "unknown date";
        const parts = [`- [${d.status}] ${d.title}`];
        const labels = d.labelLinks.map((link) => link.label.name).join(", ");
        if (labels) parts.push(`[labels: ${labels}]`);
        if (d.outcome) parts.push(`→ ${d.outcome}`);
        parts.push(`(${date})`);
        lines.push(parts.join(" "));
      }
    }

    return lines.join("\n");
  },
};
