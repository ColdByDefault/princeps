/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { createMeeting } from "@/lib/meetings/create.logic";
import { listMeetings } from "@/lib/meetings/list.logic";
import { updateMeeting } from "@/lib/meetings/update.logic";
import { deleteMeeting } from "@/lib/meetings/delete.logic";
import {
  createMeetingSchema,
  updateMeetingSchema,
} from "@/lib/meetings/schemas";
import { resolveOrCreateLabelIdsByNames } from "@/lib/tools/resolvers";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

async function handleCreateMeeting(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const labelNames = Array.isArray(args.labelNames)
    ? (args.labelNames as string[])
    : [];
  const labelIds = labelNames.length
    ? await resolveOrCreateLabelIdsByNames(userId, labelNames)
    : undefined;

  const parsed = createMeetingSchema.safeParse({ ...args, labelIds });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid create_meeting input.",
    };
  }

  const meeting = await createMeeting(userId, parsed.data);
  return { ok: true, data: meeting };
}

async function handleListMeetings(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const validStatuses = ["upcoming", "done", "cancelled"] as const;
  type MeetingStatus = (typeof validStatuses)[number];
  const status =
    typeof args.status === "string" &&
    validStatuses.includes(args.status as MeetingStatus)
      ? (args.status as MeetingStatus)
      : undefined;

  const meetings = await listMeetings(userId, status ? { status } : {});
  return { ok: true, data: meetings };
}

async function handleUpdateMeeting(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.meetingId !== "string") {
    return { ok: false, error: "update_meeting requires meetingId." };
  }

  const labelNames = Array.isArray(args.labelNames)
    ? (args.labelNames as string[])
    : undefined;
  const labelIds =
    labelNames !== undefined
      ? await resolveOrCreateLabelIdsByNames(userId, labelNames)
      : undefined;

  const { meetingId, ...rest } = args;
  const parsed = updateMeetingSchema.safeParse({
    ...rest,
    ...(labelIds !== undefined ? { labelIds } : {}),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid update_meeting input.",
    };
  }

  const result = await updateMeeting(meetingId as string, userId, parsed.data);
  if (!result.ok) {
    return { ok: false, error: "Meeting not found." };
  }
  return { ok: true, data: result.meeting };
}

async function handleDeleteMeeting(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.meetingId !== "string") {
    return { ok: false, error: "delete_meeting requires meetingId." };
  }

  const result = await deleteMeeting(args.meetingId, userId);
  if (!result.ok) {
    return { ok: false, error: "Meeting not found." };
  }
  return { ok: true, data: { deleted: true, meetingId: args.meetingId } };
}

export const meetingHandlers: Record<string, ToolHandler> = {
  create_meeting: handleCreateMeeting,
  list_meetings: handleListMeetings,
  update_meeting: handleUpdateMeeting,
  delete_meeting: handleDeleteMeeting,
};
