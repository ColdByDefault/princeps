/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { getCalendarClient } from "./client";
import { markSynced } from "@/lib/integrations/shared/upsert";

export interface SyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

const PROVIDER = "google_calendar";
// Sync window: events from 30 days ago up to 1 year ahead
const SYNC_DAYS_PAST = 30;
const SYNC_DAYS_FUTURE = 365;

/**
 * Syncs Google Calendar events for the given user into Meeting rows.
 *
 * - All imported events land as kind=appointment, source=google_calendar.
 * - Deduplication is by googleEventId — upsert on conflict.
 * - Never deletes existing Princeps meetings when a remote event disappears.
 */
export async function syncGoogleCalendar(userId: string): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  const calendar = await getCalendarClient(userId);

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - SYNC_DAYS_PAST);

  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + SYNC_DAYS_FUTURE);

  let pageToken: string | undefined;

  do {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
      ...(pageToken ? { pageToken } : {}),
    });

    const events = response.data.items ?? [];
    pageToken = response.data.nextPageToken ?? undefined;

    for (const event of events) {
      if (!event.id || !event.summary) {
        result.skipped++;
        continue;
      }

      // Skip all-day events (no time component) — no meaningful scheduledAt
      const startRaw = event.start?.dateTime ?? event.start?.date;
      if (!startRaw) {
        result.skipped++;
        continue;
      }

      const scheduledAt = new Date(startRaw);
      if (isNaN(scheduledAt.getTime())) {
        result.skipped++;
        continue;
      }

      // Calculate duration in minutes if end time is present
      let durationMin: number | null = null;
      const endRaw = event.end?.dateTime ?? event.end?.date;
      if (endRaw) {
        const endAt = new Date(endRaw);
        if (!isNaN(endAt.getTime())) {
          durationMin = Math.round(
            (endAt.getTime() - scheduledAt.getTime()) / 60000,
          );
        }
      }

      try {
        const existing = await db.meeting.findUnique({
          where: { googleEventId: event.id },
          select: { id: true },
        });

        if (existing) {
          // Update only the fields that come from Google — do not overwrite
          // user edits to agenda, summary, prepPack, or kind.
          await db.meeting.update({
            where: { googleEventId: event.id },
            data: {
              title: event.summary,
              scheduledAt,
              durationMin,
              location: event.location ?? null,
            },
          });
          result.updated++;
        } else {
          await db.meeting.create({
            data: {
              userId,
              title: event.summary,
              scheduledAt,
              durationMin,
              location: event.location ?? null,
              kind: "appointment",
              source: PROVIDER,
              googleEventId: event.id,
            },
          });
          result.created++;
        }
      } catch (err) {
        result.errors.push(
          `Event ${event.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  } while (pageToken);

  if (result.errors.length === 0) {
    await markSynced(userId, PROVIDER);
  }

  return result;
}
