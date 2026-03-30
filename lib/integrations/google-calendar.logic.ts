/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { getValidAccessToken } from "./google-oauth.logic";

const CALENDAR_API =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  status?: string;
}

/**
 * Syncs the user's primary Google Calendar for the next 30 days.
 * Upserts Meeting records keyed on googleEventId.
 * Does not overwrite title/agenda/location if already edited in See-Sweet
 * (i.e. googleEventId match preserves user edits on subsequent syncs).
 */
export async function syncGoogleCalendar(userId: string): Promise<{
  upserted: number;
  skipped: number;
}> {
  const accessToken = await getValidAccessToken(userId);

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const url = new URL(CALENDAR_API);
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "100");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Calendar API error: ${body}`);
  }

  const data = (await res.json()) as { items?: GoogleCalendarEvent[] };
  const events = data.items ?? [];

  let upserted = 0;
  let skipped = 0;

  for (const event of events) {
    // Skip cancelled events or events with no start time
    if (event.status === "cancelled") {
      skipped++;
      continue;
    }
    const startRaw = event.start?.dateTime ?? event.start?.date;
    if (!startRaw) {
      skipped++;
      continue;
    }

    const scheduledAt = new Date(startRaw);
    if (isNaN(scheduledAt.getTime())) {
      skipped++;
      continue;
    }

    const endRaw = event.end?.dateTime ?? event.end?.date;
    let durationMin: number | null = null;
    if (endRaw) {
      const endMs = new Date(endRaw).getTime();
      durationMin = Math.round((endMs - scheduledAt.getTime()) / 60_000);
    }

    const existing = await db.meeting.findUnique({
      where: { googleEventId: event.id },
      select: { id: true },
    });

    if (existing) {
      // Only update scheduledAt and durationMin on re-sync — preserve user edits
      await db.meeting.update({
        where: { googleEventId: event.id },
        data: { scheduledAt, ...(durationMin !== null ? { durationMin } : {}) },
      });
    } else {
      await db.meeting.create({
        data: {
          userId,
          title: event.summary ?? "Untitled event",
          scheduledAt,
          durationMin: durationMin ?? null,
          location: event.location ?? null,
          agenda: event.description ?? null,
          googleEventId: event.id,
          status: "upcoming",
        },
      });
    }

    upserted++;
  }

  await db.integration.update({
    where: { userId_provider: { userId, provider: "google_calendar" } },
    data: { lastSyncedAt: new Date() },
  });

  return { upserted, skipped };
}
