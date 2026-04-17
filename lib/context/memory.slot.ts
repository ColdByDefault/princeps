/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { listMemoryEntries } from "@/lib/memory";
import type { ContextSlot } from "@/lib/context";

export const memorySlot: ContextSlot = {
  key: "memory",
  label: "Long-Term Memory",
  async fetch(userId) {
    const entries = await listMemoryEntries(userId);
    if (entries.length === 0) return null;

    const lines = entries.map((e) => `- [${e.id}] ${e.key}: ${e.value}`);

    return lines.join("\n");
  },
};
