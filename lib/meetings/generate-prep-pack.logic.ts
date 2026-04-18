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
import { callChat } from "@/lib/llm-providers/provider";
import { MEETING_SELECT, toMeetingRecord } from "./shared.logic";
import type { MeetingRecord } from "@/types/api";

export type GeneratePrepPackResult =
  | { ok: true; meeting: MeetingRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string };

export async function generatePrepPack(
  meetingId: string,
  userId: string,
): Promise<GeneratePrepPackResult> {
  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, userId },
    select: {
      ...MEETING_SELECT,
      decisions: {
        select: { id: true, title: true, status: true },
      },
    },
  });

  if (!meeting) {
    return { ok: false, notFound: true };
  }

  const scheduled = new Date(meeting.scheduledAt)
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");

  const lines: string[] = [
    `Meeting: ${meeting.title}`,
    `Date & time: ${scheduled}`,
  ];

  if (meeting.durationMin != null) {
    lines.push(`Duration: ${meeting.durationMin} min`);
  }
  if (meeting.location) {
    lines.push(`Location: ${meeting.location}`);
  }
  if (meeting.agenda) {
    lines.push(`Agenda:\n${meeting.agenda}`);
  }
  if (meeting.participants.length > 0) {
    lines.push(
      `Participants: ${meeting.participants.map((p) => p.contact.name).join(", ")}`,
    );
  }
  if (meeting.tasks.length > 0) {
    lines.push(
      `Linked tasks:\n${meeting.tasks.map((t) => `- ${t.title} (${t.status})`).join("\n")}`,
    );
  }
  if (meeting.decisions.length > 0) {
    lines.push(
      `Linked decisions:\n${meeting.decisions.map((d) => `- ${d.title} (${d.status})`).join("\n")}`,
    );
  }

  const prompt = `You are a chief-of-staff assistant. Generate a concise meeting prep pack in Markdown for the following meeting.

${lines.join("\n")}

The prep pack must contain:
1. **Goal** — one sentence stating the purpose of the meeting.
2. **Key context** — 2–4 bullet points the meeting owner should know going in (background, history, stakes).
3. **Participants** — one line per participant with their name and relevant role/context if known.
4. **Open items** — any linked tasks or decisions that need attention during this meeting.
5. **Suggested talking points** — 3–5 specific, actionable agenda items.
6. **Questions to resolve** — 2–4 concrete questions that should be answered by the end of the meeting.

Keep the total under 400 words. Be direct and practical. Use Markdown headings and bullet points.`;

  let result: Awaited<ReturnType<typeof callChat>>;
  try {
    result = await callChat([{ role: "user", content: prompt }], {
      temperature: 0.4,
    });
  } catch {
    return {
      ok: false,
      notFound: false,
      error: "LLM call failed.",
    };
  }

  if (!result.content) {
    return {
      ok: false,
      notFound: false,
      error: "No content returned from LLM.",
    };
  }

  const prepPack = result.content.trim();

  const updated = await db.meeting.update({
    where: { id: meetingId, userId },
    data: { prepPack },
    select: MEETING_SELECT,
  });

  // Fire-and-forget: accumulate actual LLM tokens into the monthly counter.
  // enforcePrepPackMonthly guarantees the UsageCounter row exists before we get here.
  db.usageCounter
    .update({
      where: { userId },
      data: {
        tokenMonthlyCount: {
          increment: result.promptTokens + result.completionTokens,
        },
      },
    })
    .catch(() => {});

  return { ok: true, meeting: toMeetingRecord(updated) };
}

// ─── Get prep pack ────────────────────────────────────────

export type GetPrepPackResult =
  | { ok: true; prepPack: string | null; meetingTitle: string }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string };

export async function getMeetingPrepPack(
  meetingId: string,
  userId: string,
): Promise<GetPrepPackResult> {
  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, userId },
    select: { title: true, prepPack: true },
  });

  if (!meeting) return { ok: false, notFound: true };

  return { ok: true, prepPack: meeting.prepPack, meetingTitle: meeting.title };
}

// ─── Clear prep pack ─────────────────────────────────────

export type ClearPrepPackResult =
  | { ok: true; meeting: MeetingRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string };

export async function clearMeetingPrepPack(
  meetingId: string,
  userId: string,
): Promise<ClearPrepPackResult> {
  const existing = await db.meeting.findFirst({
    where: { id: meetingId, userId },
    select: { id: true },
  });

  if (!existing) return { ok: false, notFound: true };

  const updated = await db.meeting.update({
    where: { id: meetingId, userId },
    data: { prepPack: null },
    select: MEETING_SELECT,
  });

  return { ok: true, meeting: toMeetingRecord(updated) };
}

// ─── Update (manual edit) ─────────────────────────────────

export type UpdatePrepPackResult =
  | { ok: true; meeting: MeetingRecord }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string };

export async function updateMeetingPrepPack(
  meetingId: string,
  userId: string,
  content: string,
): Promise<UpdatePrepPackResult> {
  const existing = await db.meeting.findFirst({
    where: { id: meetingId, userId },
    select: { id: true },
  });

  if (!existing) return { ok: false, notFound: true };

  const updated = await db.meeting.update({
    where: { id: meetingId, userId },
    data: { prepPack: content.trim() },
    select: MEETING_SELECT,
  });

  return { ok: true, meeting: toMeetingRecord(updated) };
}
