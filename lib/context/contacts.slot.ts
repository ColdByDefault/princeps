/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { listContacts } from "@/lib/contact/list.logic";
import type { ContextSlot } from "@/lib/context";

export const contactsSlot: ContextSlot = {
  key: "contacts",
  label: "Contacts",
  async fetch(userId) {
    const contacts = await listContacts(userId);
    if (contacts.length === 0) return null;

    const lines = contacts.map((c) => {
      const parts: string[] = [];
      if (c.role) parts.push(c.role);
      if (c.company) parts.push(`@ ${c.company}`);
      const descriptor = parts.length ? ` — ${parts.join(" ")}` : "";
      const email = c.email ? ` | ${c.email}` : "";
      const phone = c.phone ? ` | ${c.phone}` : "";
      return `- [${c.id}] ${c.name}${descriptor}${email}${phone}`;
    });

    return lines.join("\n");
  },
};
