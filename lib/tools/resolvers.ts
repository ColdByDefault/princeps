/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { createLabel } from "@/lib/labels/create.logic";
import { listLabels } from "@/lib/labels/list.logic";

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
  if (names.length === 0) return [];

  const existing = await listLabels(userId);
  const ids: string[] = [];

  for (const name of names) {
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
