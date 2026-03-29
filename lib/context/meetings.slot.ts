/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { type ContextSlot } from "@/lib/context";

export const meetingsSlot: ContextSlot = {
  key: "meetings",
  label: "Meetings",
  async fetch(userId: string): Promise<string | null> {
    const now = new Date();

    const [upcoming, recent] = await Promise.all([
      db.meeting.findMany({
        where: { userId, status: "upcoming", scheduledAt: { gte: now } },
        orderBy: { scheduledAt: "asc" },
        take: 3,
        include: {
          participants: { include: { contact: { select: { name: true } } } },
        },
      }),
      db.meeting.findMany({
        where: { userId, status: "done" },
        orderBy: { scheduledAt: "desc" },
        take: 2,
        include: {
          participants: { include: { contact: { select: { name: true } } } },
        },
      }),
    ]);

    if (upcoming.length === 0 && recent.length === 0) return null;

    const lines: string[] = [];

    if (upcoming.length > 0) {
      lines.push("Upcoming:");
      for (const m of upcoming) {
        const date = m.scheduledAt.toISOString().slice(0, 16).replace("T", " ");
        const names = m.participants.map((p) => p.contact.name).join(", ");
        const parts = [`- ${m.title} (${date})`];
        if (names) parts.push(`with ${names}`);
        if (m.agenda) parts.push(`agenda: ${m.agenda.slice(0, 100)}`);
        lines.push(parts.join(" · "));
      }
    }

    if (recent.length > 0) {
      lines.push("Recent:");
      for (const m of recent) {
        const date = m.scheduledAt.toISOString().slice(0, 10);
        const parts = [`- ${m.title} (${date})`];
        if (m.summary) parts.push(m.summary.slice(0, 150));
        lines.push(parts.join(": "));
      }
    }

    return lines.join("\n");
  },
};
