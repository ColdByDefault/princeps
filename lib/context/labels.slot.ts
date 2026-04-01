/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { type ContextSlot } from "@/lib/context";

export const labelsSlot: ContextSlot = {
  key: "labels",
  label: "Available labels",
  async fetch(userId: string): Promise<string | null> {
    const labels = await db.label.findMany({
      where: { userId },
      orderBy: [{ normalizedName: "asc" }, { createdAt: "asc" }],
      take: 50,
      select: { name: true },
    });

    if (labels.length === 0) {
      return null;
    }

    return [
      "Use only these existing labels when applying structured labels to records:",
      `- ${labels.map((label) => label.name).join(", ")}`,
    ].join("\n");
  },
};
