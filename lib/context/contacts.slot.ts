/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { type ContextSlot } from "@/lib/context";

export const contactsSlot: ContextSlot = {
  key: "contacts",
  label: "Contacts",
  async fetch(userId: string): Promise<string | null> {
    const contacts = await db.contact.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        role: true,
        company: true,
        tags: true,
        lastContact: true,
      },
      orderBy: [{ lastContact: "desc" }, { name: "asc" }],
      take: 20,
    });

    if (contacts.length === 0) return null;

    const enriched = await Promise.all(
      contacts.map(async (c) => {
        const lastInteraction = await db.contactInteraction.findFirst({
          where: { contactId: c.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });
        return { ...c, lastInteraction: lastInteraction?.createdAt ?? null };
      }),
    );

    return enriched
      .map((c) => {
        const parts: string[] = [c.name];
        if (c.role) parts.push(c.role);
        if (c.company) parts.push(c.company);
        const tags = (c.tags as string[]) ?? [];
        if (tags.length > 0) parts.push(`[${tags.join(", ")}]`);
        if (c.lastContact)
          parts.push(
            `last contact: ${c.lastContact.toISOString().slice(0, 10)}`,
          );
        if (c.lastInteraction)
          parts.push(
            `last interaction: ${c.lastInteraction.toISOString().slice(0, 10)}`,
          );
        return `- ${parts.join(" · ")}`;
      })
      .join("\n");
  },
};
