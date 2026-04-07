/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { createLabel } from "@/lib/labels/create.logic";
import { updateLabel } from "@/lib/labels/update.logic";
import { deleteLabel } from "@/lib/labels/delete.logic";
import { listLabels } from "@/lib/labels/list.logic";
import { createLabelSchema, updateLabelSchema } from "@/lib/labels/schemas";
import { resolveLabelIdByName } from "@/lib/tools/resolvers";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

async function handleListLabels(userId: string): Promise<ActionResult> {
  const labels = await listLabels(userId);
  return { ok: true, data: labels };
}

async function handleCreateLabel(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const parsed = createLabelSchema.safeParse(args);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid create_label input.",
    };
  }
  const result = await createLabel(userId, parsed.data);
  if (!result.ok) {
    return {
      ok: false,
      error: result.duplicate
        ? "A label with that name already exists."
        : "Failed to create label.",
    };
  }
  return { ok: true, data: result.label };
}

async function handleUpdateLabel(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.labelName !== "string") {
    return { ok: false, error: "update_label requires labelName." };
  }
  const labelId = await resolveLabelIdByName(userId, args.labelName);
  if (!labelId) {
    return { ok: false, error: `Label "${args.labelName}" not found.` };
  }
  const parsed = updateLabelSchema.safeParse({
    ...(args.newName !== undefined ? { name: args.newName } : {}),
    ...(args.color !== undefined ? { color: args.color } : {}),
    ...(args.icon !== undefined ? { icon: args.icon } : {}),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid update_label input.",
    };
  }
  const result = await updateLabel(labelId, userId, parsed.data);
  if (!result.ok) {
    return {
      ok: false,
      error: result.notFound
        ? "Label not found."
        : result.duplicate
          ? `A label named "${args.newName}" already exists.`
          : "Failed to update label.",
    };
  }
  return { ok: true, data: result.label };
}

async function handleDeleteLabel(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.labelName !== "string") {
    return { ok: false, error: "delete_label requires labelName." };
  }
  const labelId = await resolveLabelIdByName(userId, args.labelName);
  if (!labelId) {
    return { ok: false, error: `Label "${args.labelName}" not found.` };
  }
  const result = await deleteLabel(labelId, userId);
  if (!result.ok) {
    return { ok: false, error: "Failed to delete label." };
  }
  return { ok: true, data: { deleted: true, labelName: args.labelName } };
}

export const labelHandlers: Record<string, ToolHandler> = {
  list_labels: handleListLabels,
  create_label: handleCreateLabel,
  update_label: handleUpdateLabel,
  delete_label: handleDeleteLabel,
};
