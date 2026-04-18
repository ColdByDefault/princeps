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

import { listLabels } from "@/lib/labels";
import type { ContextSlot } from "@/lib/context";

export const labelsSlot: ContextSlot = {
  key: "labels",
  label: "Available Labels",
  async fetch(userId) {
    const labels = await listLabels(userId);
    if (labels.length === 0) return null;

    const lines = labels.map(
      (l) => `- [${l.id}] ${l.name} (color: ${l.color})`,
    );
    return lines.join("\n");
  },
};
