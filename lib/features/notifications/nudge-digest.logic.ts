/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 * @since canary-v1.1.4
 */

import "server-only";

import { createTranslator } from "next-intl";
import { db } from "@/lib/core/db";
import { callChat } from "@/lib/ai/llm-providers/provider";
import { accumulateTokens } from "@/lib/platform/tiers/enforce";
import { parseUserPreferences } from "@/lib/platform/settings/user-preferences.logic";
import { getPlanLimits, type Tier } from "@/types/billing";
import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";

const WEEKLY_DIGEST_CATEGORY = "weekly_digest";

type AppLanguage = "de" | "en";

type WeekActivity = {
  closedTaskCount: number;
  decisionCount: number;
  completedMeetings: Array<{ title: string }>;
};

type UserDigestOutcome = "created" | "cooldown" | "no_activity";

export interface WeeklyDigestRunResult {
  usersScanned: number;
  eligibleUsers: number;
  skippedTier: number;
  skippedNotifications: number;
  skippedCooldown: number;
  noActivity: number;
  created: number;
  failed: number;
}

// ─── ISO-week helpers ─────────────────────────────────────────────────────────

/**
 * Returns the ISO week number (1–53) for a given date.
 * ISO weeks start on Monday.
 */
function getIsoWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Returns "YYYY-Www" e.g. "2026-W21". */
function isoWeekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const week = String(getIsoWeek(date)).padStart(2, "0");
  return `${year}-W${week}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function runWeeklyDigestNudges(
  now = new Date(),
): Promise<WeeklyDigestRunResult> {
  const users = await db.user.findMany({
    select: { id: true, tier: true, preferences: true },
  });

  const result: WeeklyDigestRunResult = {
    usersScanned: users.length,
    eligibleUsers: 0,
    skippedTier: 0,
    skippedNotifications: 0,
    skippedCooldown: 0,
    noActivity: 0,
    created: 0,
    failed: 0,
  };

  const isoWeek = isoWeekKey(now);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const user of users) {
    const limits = getPlanLimits(user.tier as Tier);
    if (!limits.nudgesEnabled) {
      result.skippedTier++;
      continue;
    }

    result.eligibleUsers++;

    const preferences = parseUserPreferences(user.preferences);
    if (preferences.notificationsEnabled === false) {
      result.skippedNotifications++;
      continue;
    }

    try {
      const outcome = await processUserWeeklyDigest({
        userId: user.id,
        language: preferences.language ?? "de",
        now,
        isoWeek,
        weekStart,
      });

      if (outcome === "created") result.created++;
      if (outcome === "cooldown") result.skippedCooldown++;
      if (outcome === "no_activity") result.noActivity++;
    } catch {
      result.failed++;
    }
  }

  return result;
}

// ─── Per-user logic ───────────────────────────────────────────────────────────

async function processUserWeeklyDigest(input: {
  userId: string;
  language: AppLanguage;
  now: Date;
  isoWeek: string;
  weekStart: Date;
}): Promise<UserDigestOutcome> {
  // Dedup: skip if a digest for this ISO week already exists
  const existing = await db.notification.findFirst({
    where: { userId: input.userId, category: WEEKLY_DIGEST_CATEGORY },
    orderBy: { createdAt: "desc" },
    select: { metadata: true },
  });

  if (existing) {
    const meta = existing.metadata as Record<string, unknown> | null;
    if (meta?.isoWeek === input.isoWeek) return "cooldown";
  }

  // Aggregate last 7 days of activity
  const activity = await aggregateWeekActivity(
    input.userId,
    input.weekStart,
    input.now,
  );

  const hasActivity =
    activity.closedTaskCount > 0 ||
    activity.decisionCount > 0 ||
    activity.completedMeetings.length > 0;

  // Generate LLM body
  const { title, body } = await generateDigestCopy({
    userId: input.userId,
    language: input.language,
    activity,
    hasActivity,
  });

  await db.notification.create({
    data: {
      userId: input.userId,
      category: WEEKLY_DIGEST_CATEGORY,
      source: "assistant",
      title,
      body,
      metadata: {
        isoWeek: input.isoWeek,
        closedTaskCount: activity.closedTaskCount,
        decisionCount: activity.decisionCount,
        completedMeetingCount: activity.completedMeetings.length,
      },
    },
    select: { id: true },
  });

  return hasActivity ? "created" : "no_activity";
}

// ─── Activity aggregation ─────────────────────────────────────────────────────

async function aggregateWeekActivity(
  userId: string,
  weekStart: Date,
  now: Date,
): Promise<WeekActivity> {
  const [closedTaskCount, decisionCount, completedMeetings] = await Promise.all(
    [
      db.task.count({
        where: { userId, status: "done", updatedAt: { gte: weekStart, lt: now } },
      }),
      db.decision.count({
        where: { userId, createdAt: { gte: weekStart, lt: now } },
      }),
      db.meeting.findMany({
        where: {
          userId,
          status: "done",
          scheduledAt: { gte: weekStart, lt: now },
        },
        select: { title: true },
        take: 5,
      }),
    ],
  );

  return { closedTaskCount, decisionCount, completedMeetings };
}

// ─── LLM copy generation ──────────────────────────────────────────────────────

async function generateDigestCopy(input: {
  userId: string;
  language: AppLanguage;
  activity: WeekActivity;
  hasActivity: boolean;
}): Promise<{ title: string; body: string }> {
  const messages = input.language === "en" ? enMessages : deMessages;
  const t = createTranslator({
    locale: input.language,
    messages,
    namespace: "notifications.weeklyDigest",
  });

  const title = t("title");
  const langName = input.language === "de" ? "German" : "English";

  let userPrompt: string;
  if (input.hasActivity) {
    const { closedTaskCount, decisionCount, completedMeetings } =
      input.activity;
    const meetingList =
      completedMeetings.length > 0
        ? completedMeetings.map((m) => `- ${m.title}`).join("\n")
        : null;

    userPrompt = [
      `Tasks completed this week: ${closedTaskCount}`,
      `Decisions recorded: ${decisionCount}`,
      meetingList ? `Meetings completed:\n${meetingList}` : "Meetings completed: 0",
    ].join("\n");
  } else {
    userPrompt = "The user had no recorded activity this week.";
  }

  const systemPrompt = [
    `You are the private executive assistant. Respond only in ${langName}.`,
    "Write a concise weekly digest summary in 3–5 sentences.",
    input.hasActivity
      ? "Summarise the week's accomplishments in an encouraging, professional tone."
      : "The user had a quiet week. Write a short, warm motivational message to start fresh next week.",
    "Do not use bullet points or headers. Write flowing prose only.",
    "Do not mention that you are an AI.",
  ].join("\n");

  let body: string;
  try {
    const result = await callChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    body = result.content?.trim() ?? t("fallbackBody");

    // Fire-and-forget — token accounting is non-critical
    accumulateTokens(
      input.userId,
      systemPrompt.length + userPrompt.length,
      body.length,
    ).catch(() => {});
  } catch {
    body = t("fallbackBody");
  }

  return { title, body };
}
