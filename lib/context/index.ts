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

import { tasksSlot } from "@/lib/context/tasks.slot";
import { labelsSlot } from "@/lib/context/labels.slot";
import { knowledgeSlot } from "@/lib/context/knowledge.slot";
import { contactsSlot } from "@/lib/context/contacts.slot";
import { meetingsSlot } from "@/lib/context/meetings.slot";
import { decisionsSlot } from "@/lib/context/decisions.slot";
import { goalsSlot } from "@/lib/context/goals.slot";
import { memorySlot } from "@/lib/context/memory.slot";

/**
 * A context slot contributes one labeled section to the LLM system prompt.
 * Return null to omit the section entirely.
 *
 * To add a new feature: create <feature>.slot.ts, export a ContextSlot,
 * and append it to SLOT_REGISTRY. Nothing else needs to change.
 */
export interface ContextSlot {
  key: string;
  label: string;
  fetch: (userId: string, query: string) => Promise<string | null>;
}

/**
 * Ordered list of all active context slots.
 * Add slots here as features are built.
 */
export const SLOT_REGISTRY: ContextSlot[] = [
  tasksSlot,
  labelsSlot,
  knowledgeSlot,
  contactsSlot,
  meetingsSlot,
  decisionsSlot,
  goalsSlot,
  memorySlot,
];
