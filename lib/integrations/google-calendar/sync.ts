/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";
import { getCalendarClient } from "./client";
import { markSynced } from "@/lib/integrations/shared/upsert";
import { getPlanLimits } from "@/types/billing";
import type { calendar_v3 } from "googleapis";

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
 * - Cancelled/deleted Google events are removed from the DB.
 * - Status is derived from the event END time (not start), so ongoing events stay "upcoming".
 */
/**
 * For each attendee with an email, find or create a Contact for this user.
 * Returns an array of contactIds (skips attendees without email and self).
 */
async function resolveAttendeeContactIds(
  userId: string,
  attendees: calendar_v3.Schema$EventAttendee[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const attendee of attendees) {
    if (attendee.self) continue; // skip the calendar owner
    const email = attendee.email;
    if (!email) continue;

    const name = attendee.displayName ?? email;

    let contact = await db.contact.findFirst({
      where: { userId, email },
      select: { id: true },
    });

    if (!contact) {
      contact = await db.contact.create({
        data: { userId, name, email },
        select: { id: true },
      });
    }

    ids.push(contact.id);
  }
  return ids;
}

export async function syncGoogleCalendar(userId: string): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  // Respect the user's tier cap. -1 means unlimited (enterprise).
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tier: true },
  });
  const limits = getPlanLimits(
    user.tier as Parameters<typeof getPlanLimits>[0],
  );
  const meetingsMax = limits.meetingsMax; // -1 = unlimited

  const calendar = await getCalendarClient(userId);

  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - SYNC_DAYS_PAST);

  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + SYNC_DAYS_FUTURE);

  let pageToken: string | undefined;
  const seenGoogleIds = new Set<string>();

  do {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      showDeleted: true,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
      ...(pageToken ? { pageToken } : {}),
    });

    const events = response.data.items ?? [];
    pageToken = response.data.nextPageToken ?? undefined;

    for (const event of events) {
      if (!event.id) {
        result.skipped++;
        continue;
      }

      // Cancelled/deleted — remove from DB if present
      if (event.status === "cancelled") {
        try {
          await db.meeting.deleteMany({
            where: { googleEventId: event.id, userId },
          });
        } catch {
          // ignore deletion errors
        }
        continue;
      }

      if (!event.summary) {
        result.skipped++;
        continue;
      }

      seenGoogleIds.add(event.id);

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
      let endAt: Date | null = null;
      const endRaw = event.end?.dateTime ?? event.end?.date;
      if (endRaw) {
        const parsed = new Date(endRaw);
        if (!isNaN(parsed.getTime())) {
          endAt = parsed;
          durationMin = Math.round(
            (parsed.getTime() - scheduledAt.getTime()) / 60000,
          );
        }
      }

      // Status: use end time so currently-ongoing events stay "upcoming"
      const now = new Date();
      const eventEnd = endAt ?? scheduledAt;
      const status = eventEnd <= now ? "done" : "upcoming";

      try {
        const attendees = event.attendees ?? [];
        const contactIds = await resolveAttendeeContactIds(userId, attendees);

        const existing = await db.meeting.findUnique({
          where: { googleEventId: event.id },
          select: { id: true },
        });

        if (existing) {
          // Update fields from Google — do not overwrite user edits to summary, prepPack, or kind.
          await db.meeting.update({
            where: { googleEventId: event.id },
            data: {
              title: event.summary,
              scheduledAt,
              durationMin,
              location: event.location ?? null,
              agenda: event.description ?? null,
              status,
            },
          });

          // Sync participants: replace all with current attendee list
          await db.meetingParticipant.deleteMany({
            where: { meetingId: existing.id },
          });
          if (contactIds.length) {
            await db.meetingParticipant.createMany({
              data: contactIds.map((contactId) => ({
                meetingId: existing.id,
                contactId,
              })),
              skipDuplicates: true,
            });
          }

          result.updated++;
        } else {
          // Enforce tier cap before creating new rows
          if (meetingsMax !== -1) {
            const currentCount = await db.meeting.count({ where: { userId } });
            if (currentCount >= meetingsMax) {
              result.skipped++;
              continue;
            }
          }

          const created = await db.meeting.create({
            data: {
              userId,
              title: event.summary,
              scheduledAt,
              durationMin,
              location: event.location ?? null,
              agenda: event.description ?? null,
              kind: "appointment",
              source: PROVIDER,
              googleEventId: event.id,
              status,
            },
            select: { id: true },
          });

          if (contactIds.length) {
            await db.meetingParticipant.createMany({
              data: contactIds.map((contactId) => ({
                meetingId: created.id,
                contactId,
              })),
              skipDuplicates: true,
            });
          }

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
