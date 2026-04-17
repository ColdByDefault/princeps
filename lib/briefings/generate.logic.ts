/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import "server-only";

import { db } from "@/lib/db";
import { callChat } from "@/lib/llm-providers/provider";
import { listTasks } from "@/lib/tasks";
import { listMeetings } from "@/lib/meetings";
import { listDecisions } from "@/lib/decisions";
import type { BriefingRecord } from "@/types/api";

export type GenerateBriefingResult =
  | { ok: true; briefing: BriefingRecord }
  | { ok: false; error: string };

/**
 * Generates a fresh daily briefing for the user by querying tasks, upcoming
 * meetings and open decisions, then calling the LLM. The result is upserted
 * into the BriefingCache table (one row per user). Tokens are counted against
 * the monthly budget.
 */
export async function generateBriefing(
  userId: string,
): Promise<GenerateBriefingResult> {
  const today = new Date().toISOString().slice(0, 10);

  const [tasks, inProgress, meetings, decisions] = await Promise.all([
    listTasks(userId, { status: "open" }),
    listTasks(userId, { status: "in_progress" }),
    listMeetings(userId, { status: "upcoming" }),
    listDecisions(userId, { status: "open" }),
  ]);

  const allTasks = [...inProgress, ...tasks];

  // ─── Build context sections ───────────────────────────

  const taskSection =
    allTasks.length > 0
      ? allTasks
          .map((t) => {
            const due = t.dueDate
              ? ` (due ${new Date(t.dueDate).toISOString().slice(0, 10)})`
              : "";
            const status = t.status === "in_progress" ? " [in progress]" : "";
            return `- ${t.title}${status}${due} — priority: ${t.priority}`;
          })
          .join("\n")
      : "No open tasks.";

  // Meetings in the next 14 days
  const upcomingCutoff = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const nearMeetings = meetings.filter(
    (m) => new Date(m.scheduledAt) <= upcomingCutoff,
  );
  const meetingSection =
    nearMeetings.length > 0
      ? nearMeetings
          .map((m) => {
            const date = new Date(m.scheduledAt)
              .toISOString()
              .slice(0, 16)
              .replace("T", " ");
            const loc = m.location ? ` @ ${m.location}` : "";
            return `- ${m.title} — ${date}${loc}`;
          })
          .join("\n")
      : "No upcoming meetings.";

  const decisionSection =
    decisions.length > 0
      ? decisions.map((d) => `- ${d.title}`).join("\n")
      : "No open decisions pending.";

  const prompt = `You are a chief-of-staff assistant preparing the user's daily executive briefing.
Today is ${today}.

## Open & In-Progress Tasks
${taskSection}

## Upcoming Meetings (next 14 days)
${meetingSection}

## Pending Decisions
${decisionSection}

Write a concise daily briefing in Markdown (under 350 words). Structure it as:

### Good morning
One sentence situational summary for today.

### Priority focus
2–3 bullet points — the most important tasks or decisions that need attention today.

### Upcoming
Key meetings or deadlines in the next 3 days, if any.

### Pending decisions
1–2 sentences on the most pressing open decisions, if any.

Be direct, practical, and actionable. Do not repeat all data — synthesise what matters most.`;

  let result: Awaited<ReturnType<typeof callChat>>;
  try {
    result = await callChat([{ role: "user", content: prompt }], {
      temperature: 0.3,
    });
  } catch {
    return { ok: false, error: "LLM call failed." };
  }

  if (!result.content) {
    return { ok: false, error: "No content returned from LLM." };
  }

  const content = result.content.trim();

  const row = await db.briefingCache.upsert({
    where: { userId },
    create: { userId, content },
    update: { content, generatedAt: new Date() },
    select: { id: true, content: true, generatedAt: true },
  });

  // Accumulate tokens into the monthly budget (fire-and-forget).
  db.usageCounter
    .upsert({
      where: { userId },
      create: {
        userId,
        tokenMonthlyCount: result.promptTokens + result.completionTokens,
      },
      update: {
        tokenMonthlyCount: {
          increment: result.promptTokens + result.completionTokens,
        },
      },
    })
    .catch(() => {});

  return {
    ok: true,
    briefing: {
      id: row.id,
      content: row.content,
      generatedAt: row.generatedAt.toISOString(),
    },
  };
}
