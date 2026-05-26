/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.2.1
 * @since canary-v1.2.1
 */

import "server-only";

import { db } from "@/lib/core/db";

import { getLimitsForUser } from "./helpers";
import type { EnforceResult } from "./types";

async function enforceMaxAtRest(
  userId: string,
  countPromise: Promise<number>,
  limitSelector: (
    limits: Awaited<ReturnType<typeof getLimitsForUser>>,
  ) => number,
  reason: string,
): Promise<EnforceResult> {
  const [limits, count] = await Promise.all([
    getLimitsForUser(userId),
    countPromise,
  ]);

  const limit = limitSelector(limits);

  if (limit !== -1 && count >= limit) {
    return { allowed: false, reason };
  }

  return { allowed: true };
}

// ─── Knowledge document slots ─────────────────────────────

/**
 * Checks whether the user is allowed to upload another knowledge document.
 * Enforces three independent limits:
 *
 *  1. `knowledgeDocs`        — maximum documents stored at rest (current count).
 *  2. `knowledgeFileSizeBytes` — maximum size of the file being uploaded.
 *  3. `knowledgeLifetimeChars` — lifetime chars ever processed (NEVER decremented,
 *     so delete-then-re-upload does not bypass the quota).
 *
 * Does NOT increment counters — the caller (createKnowledgeDocument) handles that
 * inside a transaction after the document is successfully persisted.
 */
export async function enforceKnowledgeUpload(
  userId: string,
  fileSizeBytes: number,
  newCharCount: number,
): Promise<EnforceResult> {
  const [limits, docCount, user] = await Promise.all([
    getLimitsForUser(userId),
    db.knowledgeDocument.count({ where: { userId } }),
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { knowledgeCharsUsed: true },
    }),
  ]);

  if (docCount >= limits.knowledgeDocs) {
    return {
      allowed: false,
      reason: "Knowledge document limit reached for your plan.",
    };
  }

  if (fileSizeBytes > limits.knowledgeFileSizeBytes) {
    const maxMB = (limits.knowledgeFileSizeBytes / 1_000_000).toFixed(1);
    return {
      allowed: false,
      reason: `File exceeds the ${maxMB} MB limit for your plan.`,
    };
  }

  if (user.knowledgeCharsUsed + newCharCount > limits.knowledgeLifetimeChars) {
    return {
      allowed: false,
      reason:
        "Lifetime knowledge character quota exhausted for your plan. Uploading more content is not possible on your current plan.",
    };
  }

  return { allowed: true };
}

/**
 * Checks whether the user is allowed to upload another knowledge document.
 * This is a slot limit (count-at-rest), not a daily counter —
 * no increment is performed here. The caller must create the document on success.
 * @deprecated Use enforceKnowledgeUpload() which checks all three limits.
 */
export async function enforceKnowledgeDocs(
  userId: string,
): Promise<EnforceResult> {
  const [limits, count] = await Promise.all([
    getLimitsForUser(userId),
    db.knowledgeDocument.count({ where: { userId } }),
  ]);

  if (count >= limits.knowledgeDocs) {
    return {
      allowed: false,
      reason: "Knowledge document limit reached for your plan.",
    };
  }

  return { allowed: true };
}

// ─── Contacts limit ───────────────────────────────────────

/**
 * Checks whether the user is allowed to create another contact.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the contact on success.
 */
export async function enforceContactsMax(
  userId: string,
): Promise<EnforceResult> {
  return enforceMaxAtRest(
    userId,
    db.contact.count({ where: { userId } }),
    (limits) => limits.contactsMax,
    "Contact limit reached for your plan.",
  );
}

// ─── Skills limit ─────────────────────────────────────────

/**
 * Checks whether the user is allowed to create another saved skill.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the skill on success.
 * Enterprise does not currently use unlimited for this feature.
 */
export async function enforceSkillsMax(userId: string): Promise<EnforceResult> {
  return enforceMaxAtRest(
    userId,
    db.skill.count({ where: { userId } }),
    (limits) => limits.skillsMax,
    "Skill limit reached for your plan.",
  );
}

// ─── Tasks limit ──────────────────────────────────────────

/**
 * Checks whether the user is allowed to create another task.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the task on success.
 * Enterprise tier uses `-1` (unlimited) — the count check is skipped.
 */
export async function enforceTasksMax(userId: string): Promise<EnforceResult> {
  return enforceMaxAtRest(
    userId,
    db.task.count({ where: { userId } }),
    (limits) => limits.tasksMax,
    "Task limit reached for your plan.",
  );
}

// ─── Meetings limit ───────────────────────────────────────

/**
 * Checks whether the user is allowed to create another meeting.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the meeting on success.
 * Enterprise tier uses `-1` (unlimited) — the count check is skipped.
 */
export async function enforceMeetingsMax(
  userId: string,
): Promise<EnforceResult> {
  return enforceMaxAtRest(
    userId,
    db.meeting.count({ where: { userId } }),
    (limits) => limits.meetingsMax,
    "Meeting limit reached for your plan.",
  );
}

// ─── Decisions limit ──────────────────────────────────────

/**
 * Checks whether the user is allowed to create another decision.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the decision on success.
 * Enterprise tier uses `-1` (unlimited) — the count check is skipped.
 */
export async function enforceDecisionsMax(
  userId: string,
): Promise<EnforceResult> {
  return enforceMaxAtRest(
    userId,
    db.decision.count({ where: { userId } }),
    (limits) => limits.decisionsMax,
    "Decision limit reached for your plan.",
  );
}

// ─── Goals limit ─────────────────────────────────────────

/**
 * Checks whether the user is allowed to create another goal.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the goal on success.
 * Enterprise tier uses `-1` (unlimited) — the count check is skipped.
 */
export async function enforceGoalsMax(userId: string): Promise<EnforceResult> {
  return enforceMaxAtRest(
    userId,
    db.goal.count({ where: { userId } }),
    (limits) => limits.goalsMax,
    "Goal limit reached for your plan.",
  );
}

// ─── Memory limit ─────────────────────────────────────────

/**
 * Checks whether the user is allowed to create another memory entry.
 * This is a count-at-rest limit (no monthly reset) —
 * no counter is incremented here. The caller creates the entry on success.
 * Enterprise tier uses `-1` (unlimited) — the count check is skipped.
 */
export async function enforceMemoryMax(userId: string): Promise<EnforceResult> {
  return enforceMaxAtRest(
    userId,
    db.memoryEntry.count({ where: { userId } }),
    (limits) => limits.memoryMax,
    "Memory entry limit reached for your plan.",
  );
}

// ─── Reading queue limit ──────────────────────────────────

/**
 * Checks whether the user is allowed to add another reading queue item.
 * `0` = feature disabled for that tier (free).
 * `-1` = unlimited.
 */
export async function enforceReadingQueueMax(
  userId: string,
): Promise<EnforceResult> {
  const [limits, count] = await Promise.all([
    getLimitsForUser(userId),
    db.readingItem.count({ where: { userId } }),
  ]);

  if (limits.readingQueueMax === 0) {
    return {
      allowed: false,
      reason:
        "The reading queue is not available on the free plan. Upgrade to Pro or above.",
    };
  }

  if (limits.readingQueueMax !== -1 && count >= limits.readingQueueMax) {
    return {
      allowed: false,
      reason: "Reading queue limit reached for your plan.",
    };
  }

  return { allowed: true };
}
