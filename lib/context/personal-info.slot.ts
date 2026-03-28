/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { type ContextSlot } from "@/lib/context";

export const personalInfoSlot: ContextSlot = {
  key: "personal-info",
  label: "About the user",
  async fetch(userId: string): Promise<string | null> {
    const record = await db.personalInfo.findUnique({
      where: { userId },
      select: { fields: true },
    });

    if (!record) return null;

    const fields = record.fields as Record<string, unknown>;
    const entries = Object.entries(fields).filter(
      ([, v]) => v !== null && v !== undefined && String(v).trim() !== "",
    );
    if (entries.length === 0) return null;

    return entries.map(([k, v]) => `- ${k}: ${v}`).join("\n");
  },
};
