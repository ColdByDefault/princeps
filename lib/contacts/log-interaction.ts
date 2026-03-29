import "server-only";

import { db } from "@/lib/db";

/**
 * Fire-and-forget helper: record that `contactId` was involved in a
 * meeting or task.  Errors are caught so they never bubble up.
 */
export function logInteraction(
  contactId: string,
  source: "meeting" | "task",
  sourceId: string,
): void {
  void db.contactInteraction
    .create({ data: { contactId, source, sourceId } })
    .catch((err) =>
      console.error("[logInteraction] failed to record interaction:", err),
    );
}
