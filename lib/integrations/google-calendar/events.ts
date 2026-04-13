/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { getCalendarClient } from "./client";

/**
 * Creates a new event on the user's primary Google Calendar.
 * Returns the Google event ID of the created event.
 */
export async function createCalendarEvent(
  userId: string,
  input: {
    title: string;
    scheduledAt: Date;
    durationMin?: number | null;
    location?: string | null;
    agenda?: string | null;
  },
): Promise<string> {
  const calendar = await getCalendarClient(userId);

  const start = input.scheduledAt;
  const end = input.durationMin
    ? new Date(start.getTime() + input.durationMin * 60_000)
    : new Date(start.getTime() + 60 * 60_000); // default 1 hour

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: input.title,
      ...(input.location ? { location: input.location } : {}),
      ...(input.agenda ? { description: input.agenda } : {}),
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });

  if (!event.data.id) {
    throw new Error("Google Calendar did not return an event ID");
  }

  return event.data.id;
}

/**
 * Patches an existing Google Calendar event with updated meeting data.
 * Only updates the fields that are relevant to calendar display.
 * All fields are taken from the post-update Princeps meeting record.
 */
export async function updateCalendarEvent(
  userId: string,
  googleEventId: string,
  data: {
    title: string;
    scheduledAt: string; // ISO string (from MeetingRecord)
    durationMin: number | null;
    location: string | null;
    agenda: string | null;
  },
): Promise<void> {
  const calendar = await getCalendarClient(userId);

  const start = new Date(data.scheduledAt);
  const end = data.durationMin
    ? new Date(start.getTime() + data.durationMin * 60_000)
    : new Date(start.getTime() + 60 * 60_000); // default 1 hour

  await calendar.events.patch({
    calendarId: "primary",
    eventId: googleEventId,
    requestBody: {
      summary: data.title,
      location: data.location,
      description: data.agenda,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });
}

/**
 * Deletes an event from the user's primary Google Calendar.
 * Silently ignores 404 — the event may have already been deleted on Google's side.
 */
export async function deleteCalendarEvent(
  userId: string,
  googleEventId: string,
): Promise<void> {
  const calendar = await getCalendarClient(userId);

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
    });
  } catch (err: unknown) {
    // Treat 404 (already deleted) as a non-error
    const status = (err as { code?: number })?.code;
    if (status !== 404 && status !== 410) {
      throw err;
    }
  }
}
