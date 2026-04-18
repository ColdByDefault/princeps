/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

import { db } from "@/lib/db";
import { listContacts } from "@/lib/contacts";
import type { ContextSlot } from "@/lib/context";

export const contactsSlot: ContextSlot = {
  key: "contacts",
  label: "Contacts",
  async fetch(userId) {
    const [contacts, participants] = await Promise.all([
      listContacts(userId),
      db.meetingParticipant.findMany({
        where: { contact: { userId } },
        select: {
          contactId: true,
          meeting: {
            select: { id: true, title: true, scheduledAt: true, status: true },
          },
        },
      }),
    ]);

    if (contacts.length === 0) return null;

    // Build contactId → meetings map
    const meetingsByContact = new Map<
      string,
      { id: string; title: string; scheduledAt: Date; status: string }[]
    >();
    for (const p of participants) {
      const list = meetingsByContact.get(p.contactId) ?? [];
      list.push(p.meeting);
      meetingsByContact.set(p.contactId, list);
    }

    const lines = contacts.map((c) => {
      const parts: string[] = [];
      if (c.role) parts.push(c.role);
      if (c.company) parts.push(`@ ${c.company}`);
      const descriptor = parts.length ? ` — ${parts.join(" ")}` : "";
      const email = c.email ? ` | ${c.email}` : "";
      const phone = c.phone ? ` | ${c.phone}` : "";
      const meetings = meetingsByContact.get(c.id);
      const meetingStr =
        meetings && meetings.length > 0
          ? ` — meetings: ${meetings
              .map(
                (m) =>
                  `${m.title} [${m.status}] (${m.scheduledAt.toISOString().slice(0, 10)})`,
              )
              .join(", ")}`
          : "";
      return `- [${c.id}] ${c.name}${descriptor}${email}${phone}${meetingStr}`;
    });

    return lines.join("\n");
  },
};
