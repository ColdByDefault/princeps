/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since canary-v1.1.4
 */

import "server-only";

import {
  createReadingItem,
  listReadingItems,
  updateReadingItem,
  deleteReadingItem,
  createReadingItemSchema,
} from "@/lib/features/reading-queue";
import { enforceReadingQueueMax } from "@/lib/platform/tiers";
import type { ActionResult, ToolHandler } from "@/lib/ai/tools/types";

async function handleAddToReadingQueue(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const parsed = createReadingItemSchema.safeParse({
    url: args.url,
    ...(args.title !== undefined ? { title: args.title } : {}),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid add_to_reading_queue input.",
    };
  }

  const gate = await enforceReadingQueueMax(userId);
  if (!gate.allowed) {
    return { ok: false, error: gate.reason ?? "Reading queue limit reached." };
  }

  const item = await createReadingItem(userId, parsed.data);
  return { ok: true, data: item };
}

async function handleListReadingQueue(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const validStatuses = ["unread", "read", "archived"] as const;
  type ReadingStatus = (typeof validStatuses)[number];

  const status =
    typeof args.status === "string" &&
    validStatuses.includes(args.status as ReadingStatus)
      ? (args.status as ReadingStatus)
      : undefined;

  const items = await listReadingItems(userId, status ? { status } : {});
  return { ok: true, data: items };
}

async function handleMarkReadingItemRead(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.id !== "string" || !args.id.trim()) {
    return { ok: false, error: "id is required for mark_reading_item_read." };
  }

  const result = await updateReadingItem(userId, args.id, { status: "read" });

  if (!result.ok) {
    return { ok: false, error: "Reading item not found." };
  }

  return { ok: true, data: result.record };
}

async function handleArchiveReadingItem(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.id !== "string" || !args.id.trim()) {
    return { ok: false, error: "id is required for archive_reading_item." };
  }

  const result = await updateReadingItem(userId, args.id, {
    status: "archived",
  });

  if (!result.ok) {
    return { ok: false, error: "Reading item not found." };
  }

  return { ok: true, data: result.record };
}

async function handleMarkReadingItemUnread(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.id !== "string" || !args.id.trim()) {
    return { ok: false, error: "id is required for mark_reading_item_unread." };
  }

  const result = await updateReadingItem(userId, args.id, { status: "unread" });

  if (!result.ok) {
    return { ok: false, error: "Reading item not found." };
  }

  return { ok: true, data: result.record };
}

async function handleUnarchiveReadingItem(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.id !== "string" || !args.id.trim()) {
    return { ok: false, error: "id is required for unarchive_reading_item." };
  }

  const result = await updateReadingItem(userId, args.id, { status: "unread" });

  if (!result.ok) {
    return { ok: false, error: "Reading item not found." };
  }

  return { ok: true, data: result.record };
}

async function handleDeleteReadingItem(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.id !== "string" || !args.id.trim()) {
    return { ok: false, error: "id is required for delete_reading_item." };
  }

  const result = await deleteReadingItem(userId, args.id);

  if (!result.deleted) {
    return { ok: false, error: "Reading item not found." };
  }

  return { ok: true, data: { deleted: true, id: args.id } };
}

export const readingQueueHandlers: Record<string, ToolHandler> = {
  add_to_reading_queue: handleAddToReadingQueue,
  list_reading_queue: handleListReadingQueue,
  mark_reading_item_read: handleMarkReadingItemRead,
  mark_reading_item_unread: handleMarkReadingItemUnread,
  archive_reading_item: handleArchiveReadingItem,
  unarchive_reading_item: handleUnarchiveReadingItem,
  delete_reading_item: handleDeleteReadingItem,
};
