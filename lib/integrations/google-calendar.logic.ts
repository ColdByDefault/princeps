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

type ProcessedEvent = {
  id: string;
  scheduledAt: Date;
  durationMin: number | null;
  title: string;
  location: string | null;
  agenda: string | null;
};

/**
 * Syncs the user's primary Google Calendar for the next 30 days.
 * Upserts Meeting records keyed on googleEventId.
 * Does not overwrite title/agenda/location if already edited in See-Sweet
 * (i.e. googleEventId match preserves user edits on subsequent syncs).
 *
 * A1: Follows nextPageToken to fetch all events (no 100-event truncation).
 * A4: One findMany batch lookup instead of one findUnique per event.
 */
export async function syncGoogleCalendar(userId: string): Promise<{
  upserted: number;
  skipped: number;
}> {
  const accessToken = await getValidAccessToken(userId);

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // A1 — paginated fetch until no nextPageToken
  const allEvents: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(CALENDAR_API);
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "250");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Google Calendar API error: ${body}`);
    }

    const data = (await res.json()) as {
      items?: GoogleCalendarEvent[];
      nextPageToken?: string;
    };
    allEvents.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  // Pre-process: parse dates and filter invalid / cancelled events
  const valid: ProcessedEvent[] = [];
  let skipped = 0;

  for (const event of allEvents) {
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
      durationMin = Math.round(
        (new Date(endRaw).getTime() - scheduledAt.getTime()) / 60_000,
      );
    }

    valid.push({
      id: event.id,
      scheduledAt,
      durationMin,
      title: event.summary ?? "Untitled event",
      location: event.location ?? null,
      agenda: event.description ?? null,
    });
  }

  if (valid.length > 0) {
    // A4 — single batch lookup, then split into creates / updates
    const allIds = valid.map((e) => e.id);
    const existing = await db.meeting.findMany({
      where: { googleEventId: { in: allIds } },
      select: { googleEventId: true },
    });
    const existingIds = new Set(
      existing
        .map((m) => m.googleEventId)
        .filter((id): id is string => id !== null),
    );

    const toCreate = valid.filter((e) => !existingIds.has(e.id));
    const toUpdate = valid.filter((e) => existingIds.has(e.id));

    await Promise.all([
      db.meeting.createMany({
        data: toCreate.map((e) => ({
          userId,
          title: e.title,
          scheduledAt: e.scheduledAt,
          durationMin: e.durationMin,
          location: e.location,
          agenda: e.agenda,
          googleEventId: e.id,
          status: "upcoming",
        })),
        skipDuplicates: true,
      }),
      ...toUpdate.map((e) =>
        // Only update scheduledAt and durationMin — preserve user edits to title/notes
        db.meeting.update({
          where: { googleEventId: e.id },
          data: {
            scheduledAt: e.scheduledAt,
            ...(e.durationMin !== null ? { durationMin: e.durationMin } : {}),
          },
        }),
      ),
    ]);
  }

  await db.integration.update({
    where: { userId_provider: { userId, provider: "google_calendar" } },
    data: { lastSyncedAt: new Date() },
  });

  return { upserted: valid.length, skipped };
}
