/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { type OllamaMessage } from "@/lib/chat/ollama";

/**
 * Assembles the system prompt from all available user-scoped data.
 *
 * Each section is independently fetched; missing features (tables that don't
 * exist yet or have no data) simply contribute an empty block. Adding a new
 * feature means adding a new slot here — nothing else needs to change.
 */
export async function buildSystemPrompt(
  userId: string,
  chatId: string,
): Promise<OllamaMessage> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, timezone: true, preferences: true },
  });

  const prefs =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, unknown>)
      : {};

  // ── User identity ──────────────────────────────────────────────────────────
  const identity = [
    `You are the private executive assistant for ${user?.name ?? "the user"}.`,
    `User email: ${user?.email ?? "unknown"}.`,
    `User timezone: ${user?.timezone ?? "UTC"}.`,
  ].join("\n");

  // ── Custom assistant behavior (from preferences) ───────────────────────────
  const behaviorNote =
    typeof prefs["assistantInstructions"] === "string" &&
    prefs["assistantInstructions"].trim()
      ? `\nCustom instructions: ${prefs["assistantInstructions"].trim()}`
      : "";

  // ── Meetings ───────────────────────────────────────────────────────────────
  // TODO: When the Meeting model is added, fetch upcoming meetings here and
  // inject them. Example:
  //   const meetings = await db.meeting.findMany({ where: { userId }, take: 10 });
  const meetingsSection = ""; // stub — will populate in the meetings phase

  // ── Contacts ──────────────────────────────────────────────────────────────
  // TODO: When the Contact model is added, fetch relevant contacts and inject.
  const contactsSection = ""; // stub — will populate in the contacts phase

  // ── Active tasks ──────────────────────────────────────────────────────────
  // TODO: When the Task model is added, fetch open tasks and inject.
  const tasksSection = ""; // stub — will populate in the tasks phase

  // ── Decisions ─────────────────────────────────────────────────────────────
  // TODO: When the Decision model is added, fetch recent decisions and inject.
  const decisionsSection = ""; // stub — will populate in the decisions phase

  // ── Knowledge base (RAG) ──────────────────────────────────────────────────
  // TODO: When pgvector retrieval is wired, perform a similarity search against
  // the user's document corpus using the latest user message as the query, then
  // inject the top-k chunks here.
  const ragSection = ""; // stub — will populate in the knowledge-base phase

  // ── Product self-awareness ────────────────────────────────────────────────
  const productAwareness = [
    "\nYou operate inside See-Sweet, a private executive secretariat.",
    "As features are added (meetings, contacts, tasks, decisions, knowledge base),",
    "their data will be injected into this system prompt automatically.",
    "Always reason over all context provided to give precise, actionable answers.",
  ].join(" ");

  const content = [
    identity,
    behaviorNote,
    meetingsSection,
    contactsSection,
    tasksSection,
    decisionsSection,
    ragSection,
    productAwareness,
  ]
    .filter(Boolean)
    .join("\n\n");

  void chatId; // reserved for per-chat context in future

  return { role: "system", content };
}
