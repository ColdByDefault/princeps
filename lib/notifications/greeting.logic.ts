/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { callChat } from "@/lib/llm-providers/provider";
import { fetchWeather } from "@/lib/weather/fetch";
import { listTasks } from "@/lib/tasks/list.logic";
import {
  NOTIFICATION_SELECT,
  toNotificationRecord,
  findTodayGreeting,
  todayUtc,
} from "./shared.logic";
import type { NotificationRecord } from "@/types/api";

export interface GreetingResult {
  created: boolean;
  notification: NotificationRecord | null;
}

/**
 * Generates a warm, human-toned daily greeting for the user using the LLM.
 *
 * Deduplication: only one greeting per UTC calendar day.
 * Dev override: set FORCE_GREETING=true in .env.local to bypass the check.
 */
export async function generateDailyGreeting(
  userId: string,
): Promise<GreetingResult> {
  // Deduplication check — skip if already generated today
  const forceGreeting = process.env.FORCE_GREETING === "true";
  if (!forceGreeting) {
    const existing = await findTodayGreeting(userId);
    if (existing) {
      return { created: false, notification: toNotificationRecord(existing) };
    }
  }

  // Load user context
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, timezone: true, preferences: true },
  });

  if (!user) return { created: false, notification: null };

  const timezone = user.timezone ?? "UTC";
  const name = user.name ?? "there";

  // Derive language from stored preferences
  const prefs = (user.preferences ?? {}) as Record<string, unknown>;
  const lang = typeof prefs.language === "string" ? prefs.language : "de";
  const langName = lang === "de" ? "German" : "English";

  // Local time description
  const now = new Date();
  const localTimeStr = now.toLocaleString(lang === "de" ? "de-DE" : "en-US", {
    timeZone: timezone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Weather (non-critical — proceed without it if unavailable)
  const weather = await fetchWeather(timezone);
  const weatherLine = weather
    ? `Current weather in ${weather.location}: ${weather.conditionEmoji} ${weather.conditionLabel}, ${weather.temperatureCelsius}°C.`
    : null;

  // Open task count for context
  const openTasks = await listTasks(userId, { status: "open" });
  const inProgressTasks = await listTasks(userId, { status: "in_progress" });
  const totalActive = openTasks.length + inProgressTasks.length;
  const taskLine =
    totalActive > 0
      ? `The user has ${totalActive} active task${totalActive !== 1 ? "s" : ""}.`
      : "The user has no active tasks at the moment.";

  // Build LLM prompt
  const systemPrompt = [
    `You are the private executive assistant for ${name}.`,
    `Respond only in ${langName}.`,
    "Write a brief, warm, personal greeting (2–3 sentences maximum). Do not use bullet points, headers, or lists.",
    "Sound like a thoughtful human assistant, not a corporate chatbot. Be natural and genuine.",
    "Do not mention that you are an AI. Do not offer to help — this is just a greeting.",
  ].join("\n");

  const userPrompt = [
    `Local time: ${localTimeStr} (${timezone}).`,
    weatherLine,
    taskLine,
  ]
    .filter(Boolean)
    .join("\n");

  let greetingBody: string;
  try {
    const result = await callChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    greetingBody = result.content?.trim() ?? "";
  } catch {
    return { created: false, notification: null };
  }

  if (!greetingBody) return { created: false, notification: null };

  // Derive a short title from the time of day
  const hour = new Date().toLocaleString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });
  const hourNum = parseInt(hour, 10);
  let title: string;
  if (lang === "de") {
    title =
      hourNum < 12
        ? "Guten Morgen"
        : hourNum < 17
          ? "Guten Tag"
          : "Guten Abend";
  } else {
    title =
      hourNum < 12
        ? "Good morning"
        : hourNum < 17
          ? "Good afternoon"
          : "Good evening";
  }

  const metadata = {
    date: todayUtc(),
    ...(weather
      ? {
          weather: {
            temp: weather.temperatureCelsius,
            code: weather.weatherCode,
            label: weather.conditionLabel,
            emoji: weather.conditionEmoji,
            location: weather.location,
          },
        }
      : {}),
  } satisfies Record<string, unknown>;

  const created = await db.notification.create({
    data: {
      userId,
      category: "daily_greeting",
      source: "assistant",
      title,
      body: greetingBody,
      metadata,
    },
    select: NOTIFICATION_SELECT,
  });

  return { created: true, notification: toNotificationRecord(created) };
}
