/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { personalInfoSlot } from "./personal-info.slot";
import { knowledgeSlot } from "./knowledge.slot";
import { contactsSlot } from "./contacts.slot";
import { meetingsSlot } from "./meetings.slot";
import { tasksSlot } from "./tasks.slot";

/**
 * A context slot contributes one labeled section to the LLM system prompt.
 * Return null to omit the section entirely (no empty headers emitted).
 *
 * To add a new feature: create <feature>.slot.ts, export a ContextSlot,
 * and append it to SLOT_REGISTRY below. Nothing else needs to change.
 */
export interface ContextSlot {
  /** Machine label used in debug / logging. */
  key: string;
  /** Section heading rendered in the system prompt. */
  label: string;
  /** Fetch and format data for this slot. Return null to skip. */
  fetch: (userId: string, query: string) => Promise<string | null>;
}

/**
 * Ordered list of all context slots injected into the system prompt.
 * Slots are evaluated in order; each runs independently.
 */
export const SLOT_REGISTRY: ContextSlot[] = [
  personalInfoSlot,
  knowledgeSlot,
  contactsSlot,
  meetingsSlot,
  tasksSlot,
  // future: decisionsSlot
];
