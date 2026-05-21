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

import { createTranslator } from "next-intl";
import { db } from "@/lib/core/db";
import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";
import { parseUserPreferences } from "@/lib/platform/settings/user-preferences.logic";
import { getPlanLimits, type Tier } from "@/types/billing";
import { Prisma } from "@/prisma/generated/prisma/client";

const OVERDUE_TASKS_CATEGORY = "overdue_tasks";
const ACTIVE_TASK_STATUSES = ["open", "in_progress"] as const;
const TASK_PREVIEW_LIMIT = 3;
const MAX_TASK_TITLE_LENGTH = 90;
const SERIALIZABLE_RETRY_LIMIT = 3;

type AppLanguage = "de" | "en";

type UtcDayWindow = {
  start: Date;
  end: Date;
  date: string;
};

type OverdueTaskPreview = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
};

type UserNudgeOutcome = "created" | "cooldown" | "no_overdue_tasks";

export interface OverdueTaskNudgeRunResult {
  usersScanned: number;
  eligibleUsers: number;
  skippedTier: number;
  skippedNotifications: number;
  skippedUserPreference: number;
  skippedCooldown: number;
  withoutOverdueTasks: number;
  created: number;
  failed: number;
}

export async function runOverdueTaskNudges(
  now = new Date(),
): Promise<OverdueTaskNudgeRunResult> {
  const users = await db.user.findMany({
    select: {
      id: true,
      tier: true,
      preferences: true,
    },
  });

  const result: OverdueTaskNudgeRunResult = {
    usersScanned: users.length,
    eligibleUsers: 0,
    skippedTier: 0,
    skippedNotifications: 0,
    skippedUserPreference: 0,
    skippedCooldown: 0,
    withoutOverdueTasks: 0,
    created: 0,
    failed: 0,
  };

  const today = getUtcDayWindow(now);

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
    if (preferences.overdueTaskNudgesEnabled === false) {
      result.skippedUserPreference++;
      continue;
    }

    try {
      const outcome = await processUserOverdueNudge({
        userId: user.id,
        language: preferences.language ?? "de",
        now,
        today,
      });

      if (outcome === "created") result.created++;
      if (outcome === "cooldown") result.skippedCooldown++;
      if (outcome === "no_overdue_tasks") result.withoutOverdueTasks++;
    } catch {
      result.failed++;
    }
  }

  return result;
}

async function processUserOverdueNudge(input: {
  userId: string;
  language: AppLanguage;
  now: Date;
  today: UtcDayWindow;
}): Promise<UserNudgeOutcome> {
  return withSerializableRetry(() =>
    db.$transaction(
      async (tx) => {
        const existingToday = await tx.notification.findFirst({
          where: {
            userId: input.userId,
            category: OVERDUE_TASKS_CATEGORY,
            createdAt: {
              gte: input.today.start,
              lt: input.today.end,
            },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });

        if (existingToday) return "cooldown";

        const where = overdueTaskWhere(input.userId, input.now);
        const overdueCount = await tx.task.count({ where });

        if (overdueCount === 0) return "no_overdue_tasks";

        const previewTasks = await tx.task.findMany({
          where,
          orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
          take: TASK_PREVIEW_LIMIT,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        });

        const copy = buildNotificationCopy({
          language: input.language,
          overdueCount,
          previewTasks,
        });

        await tx.notification.create({
          data: {
            userId: input.userId,
            category: OVERDUE_TASKS_CATEGORY,
            source: "assistant",
            title: copy.title,
            body: copy.body,
            metadata: buildNotificationMetadata({
              date: input.today.date,
              overdueCount,
              previewTasks,
            }),
          },
          select: { id: true },
        });

        return "created";
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  );
}

function overdueTaskWhere(userId: string, now: Date): Prisma.TaskWhereInput {
  return {
    userId,
    status: { in: [...ACTIVE_TASK_STATUSES] },
    dueDate: { lt: now },
  };
}

function buildNotificationCopy(input: {
  language: AppLanguage;
  overdueCount: number;
  previewTasks: OverdueTaskPreview[];
}): { title: string; body: string } {
  const messages = input.language === "en" ? enMessages : deMessages;
  const t = createTranslator({
    locale: input.language,
    messages,
    namespace: "notifications.overdueTasks",
  });
  const taskLines = input.previewTasks
    .map((task) => `- ${truncateTaskTitle(task.title)}`)
    .join("\n");
  const remainingCount = input.overdueCount - input.previewTasks.length;
  const title =
    input.overdueCount === 1
      ? t("titleOne")
      : t("titleOther", { count: input.overdueCount });

  let remainingLine = "";
  if (remainingCount > 0) {
    remainingLine =
      "\n" +
      (remainingCount === 1
        ? t("remainingOne")
        : t("remainingOther", { count: remainingCount }));
  }

  return {
    title,
    body: `${t("bodyIntro")}\n${taskLines}${remainingLine}`,
  };
}

function buildNotificationMetadata(input: {
  date: string;
  overdueCount: number;
  previewTasks: OverdueTaskPreview[];
}): Prisma.InputJsonValue {
  return {
    date: input.date,
    overdueCount: input.overdueCount,
    previewTaskIds: input.previewTasks.map((task) => task.id),
    previewTasks: input.previewTasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
    })),
  };
}

function getUtcDayWindow(referenceDate: Date): UtcDayWindow {
  const start = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    ),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    start,
    end,
    date: start.toISOString().slice(0, 10),
  };
}

function truncateTaskTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length <= MAX_TASK_TITLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_TASK_TITLE_LENGTH - 3).trimEnd()}...`;
}

async function withSerializableRetry<T>(
  operation: () => Promise<T>,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (
        attempt >= SERIALIZABLE_RETRY_LIMIT ||
        !isSerializationConflict(error)
      ) {
        throw error;
      }
    }
  }
}

function isSerializationConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2034"
  );
}
