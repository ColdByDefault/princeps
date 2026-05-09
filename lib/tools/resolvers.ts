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
import { createLabel } from "@/lib/labels/create.logic";
import { listLabels } from "@/lib/labels/list.logic";

function normalizeRef(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function uniqueStrings(values: string[] | undefined): string[] {
  if (!values) return [];
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/**
 * Resolves a single label name to its ID for the given user.
 * Returns null if no matching label is found (does NOT create).
 */
export async function resolveLabelIdByName(
  userId: string,
  name: string,
): Promise<string | null> {
  const existing = await listLabels(userId);
  const normalized = name.trim().toLowerCase();
  const found = existing.find((l) => l.name.toLowerCase() === normalized);
  return found?.id ?? null;
}

/**
 * Given a list of label names, returns their IDs.
 * Creates any label that does not yet exist (with the default color).
 * Returns a deduplicated array of label IDs.
 */
export async function resolveOrCreateLabelIdsByNames(
  userId: string,
  names: string[],
): Promise<string[]> {
  const uniqueNames = uniqueStrings(names);
  if (uniqueNames.length === 0) return [];

  const existing = await listLabels(userId);
  const ids: string[] = [];

  for (const name of uniqueNames) {
    const normalized = name.trim().toLowerCase();
    const found = existing.find((l) => l.name.toLowerCase() === normalized);

    if (found) {
      ids.push(found.id);
    } else {
      const result = await createLabel(userId, {
        name: name.trim(),
        color: "#6366f1",
      });
      if (result.ok) ids.push(result.label.id);
    }
  }

  return [...new Set(ids)];
}

export async function resolveMeetingIdByRef(
  userId: string,
  ref: string,
): Promise<string | null> {
  const normalized = normalizeRef(ref);
  const meeting = await db.meeting.findFirst({
    where: {
      userId,
      OR: [
        { id: ref },
        { title: { equals: ref, mode: "insensitive" } },
        { title: { equals: normalized, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return meeting?.id ?? null;
}

export async function resolveContactIdsByRefs(
  userId: string,
  refs: string[],
): Promise<{ ids: string[]; missing: string[] }> {
  const uniqueRefs = uniqueStrings(refs);
  if (uniqueRefs.length === 0) return { ids: [], missing: [] };

  const contacts = await db.contact.findMany({
    where: { userId },
    select: { id: true, name: true },
  });

  const ids: string[] = [];
  const missing: string[] = [];

  for (const ref of uniqueRefs) {
    const normalized = normalizeRef(ref);
    const match = contacts.find(
      (contact) =>
        contact.id === ref || normalizeRef(contact.name) === normalized,
    );

    if (match) {
      ids.push(match.id);
    } else {
      missing.push(ref);
    }
  }

  return { ids: [...new Set(ids)], missing };
}

export async function resolveTaskIdsByRefs(
  userId: string,
  refs: string[],
): Promise<{ ids: string[]; missing: string[] }> {
  const uniqueRefs = uniqueStrings(refs);
  if (uniqueRefs.length === 0) return { ids: [], missing: [] };

  const tasks = await db.task.findMany({
    where: { userId },
    select: { id: true, title: true },
  });

  const ids: string[] = [];
  const missing: string[] = [];

  for (const ref of uniqueRefs) {
    const normalized = normalizeRef(ref);
    const match = tasks.find(
      (task) => task.id === ref || normalizeRef(task.title) === normalized,
    );

    if (match) {
      ids.push(match.id);
    } else {
      missing.push(ref);
    }
  }

  return { ids: [...new Set(ids)], missing };
}

export async function resolveGoalIdsByRefs(
  userId: string,
  refs: string[],
): Promise<{ ids: string[]; missing: string[] }> {
  const uniqueRefs = uniqueStrings(refs);
  if (uniqueRefs.length === 0) return { ids: [], missing: [] };

  const goals = await db.goal.findMany({
    where: { userId },
    select: { id: true, title: true },
  });

  const ids: string[] = [];
  const missing: string[] = [];

  for (const ref of uniqueRefs) {
    const normalized = normalizeRef(ref);
    const match = goals.find(
      (goal) => goal.id === ref || normalizeRef(goal.title) === normalized,
    );

    if (match) {
      ids.push(match.id);
    } else {
      missing.push(ref);
    }
  }

  return { ids: [...new Set(ids)], missing };
}
