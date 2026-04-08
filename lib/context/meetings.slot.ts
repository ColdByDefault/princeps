/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { listMeetings } from "@/lib/meetings";
import type { ContextSlot } from "@/lib/context";

export const meetingsSlot: ContextSlot = {
  key: "meetings",
  label: "Upcoming Meetings",
  async fetch(userId) {
    const meetings = await listMeetings(userId, { status: "upcoming" });

    if (meetings.length === 0) return null;

    const lines = meetings.map((m) => {
      const scheduled = new Date(m.scheduledAt)
        .toISOString()
        .slice(0, 16)
        .replace("T", " ");
      const dur = m.durationMin != null ? ` (${m.durationMin} min)` : "";
      const loc = m.location ? ` @ ${m.location}` : "";
      const labels =
        m.labels.length > 0
          ? ` — labels: ${m.labels.map((l) => l.name).join(", ")}`
          : "";
      const participants =
        m.participants.length > 0
          ? ` — participants: ${m.participants.map((p) => p.contactName).join(", ")}`
          : "";
      const tasks =
        m.tasks.length > 0
          ? ` — linked tasks: ${m.tasks.map((t) => `${t.title} (${t.status})`).join(", ")}`
          : "";
      return `- [${m.id}] ${m.title} — ${scheduled}${dur}${loc}${labels}${participants}${tasks}`;
    });

    return lines.join("\n");
  },
};
