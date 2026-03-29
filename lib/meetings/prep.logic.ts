/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { OLLAMA_BASE_URL, OLLAMA_MODEL } from "@/lib/chat/ollama";
import { searchKnowledge } from "@/lib/knowledge/search.logic";
import { db } from "@/lib/db";

export type PrepPackResult = {
  prepPack: string;
};

/**
 * Generates a meeting prep pack by combining:
 *  - Meeting metadata (title, agenda, participants)
 *  - Top-5 knowledge chunks relevant to the meeting title
 * Calls Ollama non-streaming, stores the result in Meeting.prepPack, and returns it.
 *
 * Returns null if the meeting does not exist or belongs to a different user.
 */
export async function generatePrepPack(
  userId: string,
  meetingId: string,
): Promise<PrepPackResult | null> {
  const meeting = await db.meeting.findUnique({
    where: { id: meetingId },
    include: {
      participants: {
        include: {
          contact: { select: { name: true, role: true, company: true } },
        },
      },
    },
  });

  if (!meeting || meeting.userId !== userId) return null;

  const [knowledgeChunks] = await Promise.all([
    searchKnowledge(userId, meeting.title, 5),
  ]);

  // Build context sections
  const lines: string[] = [];

  lines.push(`Meeting: ${meeting.title}`);
  if (meeting.scheduledAt) {
    lines.push(
      `Scheduled: ${meeting.scheduledAt.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    );
  }
  if (meeting.durationMin) lines.push(`Duration: ${meeting.durationMin} min`);
  if (meeting.location) lines.push(`Location: ${meeting.location}`);
  if (meeting.agenda) lines.push(`\nAgenda:\n${meeting.agenda}`);

  if (meeting.participants.length > 0) {
    lines.push("\nParticipants:");
    for (const p of meeting.participants) {
      const parts = [p.contact.name];
      if (p.contact.role) parts.push(p.contact.role);
      if (p.contact.company) parts.push(p.contact.company);
      lines.push(`  - ${parts.join(", ")}`);
    }
  }

  if (knowledgeChunks.length > 0) {
    lines.push("\nRelevant context from knowledge base:");
    for (const chunk of knowledgeChunks) {
      lines.push(`  • ${chunk.content.slice(0, 400)}`);
    }
  }

  const context = lines.join("\n");

  const prompt = `You are preparing a meeting briefing document for a professional.

${context}

Write a concise meeting prep pack with these sections:
1. **Objectives** — 2–3 bullet points on what this meeting should accomplish.
2. **Participant Context** — one line per participant with relevant background.
3. **Talking Points** — 3–5 key questions or topics to raise.
4. **Watch-outs** — any risks, tensions, or open items to be aware of.

Be direct and actionable. Keep the entire document under 300 words. Use plain markdown only (no HTML).`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      think: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama returned ${response.status} for prep pack generation`,
    );
  }

  const json = (await response.json()) as { message?: { content?: string } };
  const prepPack = (json?.message?.content ?? "").trim();

  await db.meeting.update({
    where: { id: meetingId },
    data: { prepPack },
  });

  return { prepPack };
}
