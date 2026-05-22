/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 */

import "server-only";

import { createMeeting } from "@/lib/features/meetings/create.logic";
import { listMeetings } from "@/lib/features/meetings/list.logic";
import { updateMeeting } from "@/lib/features/meetings/update.logic";
import { deleteMeeting } from "@/lib/features/meetings/delete.logic";
import {
  generatePrepPack,
  getMeetingPrepPack,
  clearMeetingPrepPack,
  updateMeetingPrepPack,
} from "@/lib/features/meetings/generate-prep-pack.logic";
import {
  createMeetingSchema,
  updateMeetingSchema,
} from "@/lib/features/meetings/schemas";
import {
  resolveContactIdsByRefs,
  resolveOrCreateLabelIdsByNames,
} from "@/lib/ai/tools/resolvers";
import {
  enforceMeetingsMax,
  enforcePrepPackMonthly,
} from "@/lib/platform/tiers";
import type { ActionResult, ToolHandler } from "@/lib/ai/tools/types";

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
  const participantRefs = Array.isArray(args.participantContactIds)
    ? (args.participantContactIds as unknown[]).filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const participantContactIds = participantRefs.length
    ? await resolveContactIdsByRefs(userId, participantRefs)
    : undefined;

  if (participantContactIds?.missing.length) {
    return {
      ok: false,
      error: `Participant contact not found: ${participantContactIds.missing.join(", ")}. Create the contact first, then retry with the returned contact ID.`,
    };
  }

  const parsed = createMeetingSchema.safeParse({
    ...args,
    labelIds,
    ...(participantContactIds
      ? { participantContactIds: participantContactIds.ids }
      : {}),
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
  const participantRefs = Array.isArray(args.participantContactIds)
    ? (args.participantContactIds as unknown[]).filter(
        (value): value is string => typeof value === "string",
      )
    : undefined;
  const participantContactIds =
    participantRefs !== undefined
      ? await resolveContactIdsByRefs(userId, participantRefs)
      : undefined;

  if (participantContactIds?.missing.length) {
    return {
      ok: false,
      error: `Participant contact not found: ${participantContactIds.missing.join(", ")}. Create the contact first, then retry with the returned contact ID.`,
    };
  }

  const { meetingId, ...rest } = args;
  const parsed = updateMeetingSchema.safeParse({
    ...rest,
    ...(labelIds !== undefined ? { labelIds } : {}),
    ...(participantContactIds !== undefined
      ? { participantContactIds: participantContactIds.ids }
      : {}),
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
  // Return a slim confirmation — the full prep pack content is stored in the DB
  // and visible in the Meetings view. Returning the full meeting object would cause
  // the LLM to reproduce the entire prep pack markdown in the chat response.
  return {
    ok: true,
    data: {
      meetingId: args.meetingId,
      title: result.meeting.title,
      prepPackGenerated: true,
    },
  };
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
  // Return a slim confirmation only — same reason as generate_meeting_prep_pack.
  return {
    ok: true,
    data: {
      meetingId: args.meetingId,
      title: result.meeting.title,
      prepPackUpdated: true,
    },
  };
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
