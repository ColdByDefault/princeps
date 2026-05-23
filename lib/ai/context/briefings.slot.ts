/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */

import "server-only";

import { getBriefing } from "@/lib/features/briefings";
import type { ContextSlot } from "@/lib/ai/context";

const TRUNCATE_AT = 1500;

export const briefingsSlot: ContextSlot = {
  key: "briefings",
  label: "Today's Briefing",
  async fetch(userId) {
    const briefing = await getBriefing(userId);
    if (!briefing?.content) return null;

    if (briefing.content.length <= TRUNCATE_AT) {
      return briefing.content;
    }

    return (
      briefing.content.slice(0, TRUNCATE_AT) +
      "\n[...truncated — call get_briefing for full text]"
    );
  },
};
