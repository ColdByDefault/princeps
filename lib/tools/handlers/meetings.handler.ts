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

import { createMeeting } from "@/lib/meetings/create.logic";
import { listMeetings } from "@/lib/meetings/list.logic";
import { updateMeeting } from "@/lib/meetings/update.logic";
import { deleteMeeting } from "@/lib/meetings/delete.logic";
import {
  generatePrepPack,
  getMeetingPrepPack,
  clearMeetingPrepPack,
  updateMeetingPrepPack,
} from "@/lib/meetings/generate-prep-pack.logic";
import {
  createMeetingSchema,
  updateMeetingSchema,
} from "@/lib/meetings/schemas";
import { resolveOrCreateLabelIdsByNames } from "@/lib/tools/resolvers";
import { enforceMeetingsMax, enforcePrepPackMonthly } from "@/lib/tiers";
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

  const parsed = createMeetingSchema.safeParse({
    ...args,
    labelIds,
    source: "llm",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid create_meeting input.",
    };
  }

  // Tier gate
  const gate = await enforceMeetingsMax(userId);
  if (!gate.allowed) {
    return {
      ok: false,
      error: gate.reason ?? "Meeting limit reached for your plan.",
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

async function handleGeneratePrepPack(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.meetingId !== "string") {
    return {
      ok: false,
      error: "generate_meeting_prep_pack requires meetingId.",
    };
  }

  const quota = await enforcePrepPackMonthly(userId);
  if (!quota.allowed) {
    return {
      ok: false,
      error: quota.reason ?? "Prep pack limit reached for your plan.",
    };
  }

  const result = await generatePrepPack(args.meetingId, userId);
  if (!result.ok) {
    if ("notFound" in result && result.notFound) {
      return { ok: false, error: "Meeting not found." };
    }
    return {
      ok: false,
      error: "error" in result ? result.error : "Failed to generate prep pack.",
    };
  }
  return { ok: true, data: result.meeting };
}

async function handleGetPrepPack(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.meetingId !== "string") {
    return { ok: false, error: "get_meeting_prep_pack requires meetingId." };
  }

  const quota = await enforcePrepPackMonthly(userId);
  if (!quota.allowed) {
    return {
      ok: false,
      error: quota.reason ?? "Prep pack limit reached for your plan.",
    };
  }

  const result = await getMeetingPrepPack(args.meetingId, userId);
  if (!result.ok) {
    if ("notFound" in result && result.notFound) {
      return { ok: false, error: "Meeting not found." };
    }
    return {
      ok: false,
      error: "error" in result ? result.error : "Failed to read prep pack.",
    };
  }

  if (!result.prepPack) {
    return {
      ok: true,
      data: {
        meetingTitle: result.meetingTitle,
        prepPack: null,
        message: "No prep pack has been generated for this meeting yet.",
      },
    };
  }

  return {
    ok: true,
    data: { meetingTitle: result.meetingTitle, prepPack: result.prepPack },
  };
}

async function handleClearPrepPack(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.meetingId !== "string") {
    return { ok: false, error: "clear_meeting_prep_pack requires meetingId." };
  }

  const quota = await enforcePrepPackMonthly(userId);
  if (!quota.allowed) {
    return {
      ok: false,
      error: quota.reason ?? "Prep pack limit reached for your plan.",
    };
  }

  const result = await clearMeetingPrepPack(args.meetingId, userId);
  if (!result.ok) {
    if ("notFound" in result && result.notFound) {
      return { ok: false, error: "Meeting not found." };
    }
    return {
      ok: false,
      error: "error" in result ? result.error : "Failed to clear prep pack.",
    };
  }
  return { ok: true, data: { cleared: true, meetingId: args.meetingId } };
}

async function handleUpdatePrepPack(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.meetingId !== "string") {
    return { ok: false, error: "update_meeting_prep_pack requires meetingId." };
  }
  if (typeof args.content !== "string" || !args.content.trim()) {
    return {
      ok: false,
      error: "update_meeting_prep_pack requires non-empty content.",
    };
  }

  const quota = await enforcePrepPackMonthly(userId);
  if (!quota.allowed) {
    return {
      ok: false,
      error: quota.reason ?? "Prep pack limit reached for your plan.",
    };
  }

  const result = await updateMeetingPrepPack(
    args.meetingId,
    userId,
    args.content,
  );
  if (!result.ok) {
    if ("notFound" in result && result.notFound) {
      return { ok: false, error: "Meeting not found." };
    }
    return {
      ok: false,
      error: "error" in result ? result.error : "Failed to update prep pack.",
    };
  }
  return { ok: true, data: result.meeting };
}

export const meetingHandlers: Record<string, ToolHandler> = {
  create_meeting: handleCreateMeeting,
  list_meetings: handleListMeetings,
  update_meeting: handleUpdateMeeting,
  delete_meeting: handleDeleteMeeting,
  generate_meeting_prep_pack: handleGeneratePrepPack,
  get_meeting_prep_pack: handleGetPrepPack,
  clear_meeting_prep_pack: handleClearPrepPack,
  update_meeting_prep_pack: handleUpdatePrepPack,
};
