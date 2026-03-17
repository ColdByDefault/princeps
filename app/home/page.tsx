/**
 * @author ColdByDefault
 * @copyright  2026 ColdByDefault. All Rights Reserved.
 *
 */

import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRequestConfig } from "@/i18n/request";
import { auth } from "@/lib/auth";
import { getMessage } from "@/lib/i18n";
import { listMeetings } from "@/lib/meetings/list.logic";
import {
  formatDateTime,
  getMeetingStatusLabel,
  getStatusTone,
  StatusPill,
} from "@/components/meetings/shared";
import { type MeetingListItem } from "@/types/meetings";

function getGreeting(messages: Record<string, string>): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return getMessage(messages, "home.greetingMorning", "");
  }
  if (hour < 18) {
    return getMessage(messages, "home.greetingAfternoon", "");
  }
  return getMessage(messages, "home.greetingEvening", "");
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { language, messages } = await getRequestConfig();

  if (!session) {
    redirect("/login");
  }

  const greeting = getGreeting(messages);
  const firstName = session.user.name?.split(" ")[0] ?? "";
  const meetings = (await listMeetings(session.user.id, {
    limit: "3",
  })) as MeetingListItem[];

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-2xl shadow-black/5 backdrop-blur lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            {getMessage(messages, "home.focusTitle", "Phase 1 focus")}
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {greeting}, {firstName}.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              {getMessage(
                messages,
                "home.description",
                "Start with the meeting workflow, keep decisions visible, and build continuity session by session.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="cursor-pointer rounded-xl px-5"
              nativeButton={false}
              render={<Link href="/meetings" />}
            >
              {getMessage(messages, "home.primaryCta", "Open meetings")}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="cursor-pointer rounded-xl px-5"
              nativeButton={false}
              render={<Link href="/meetings/new" />}
            >
              {getMessage(messages, "home.secondaryCta", "Create meeting")}
            </Button>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-border/70 bg-background/70 p-5">
          <p className="text-sm font-semibold tracking-[0.22em] text-muted-foreground uppercase">
            {getMessage(messages, "home.focusTitle", "Phase 1 focus")}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {getMessage(
              messages,
              "home.focusBody",
              "Meeting prep and follow-up is now the main workflow in the authenticated workspace.",
            )}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              {getMessage(
                messages,
                "home.recentMeetingsTitle",
                "Recent meetings",
              )}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {getMessage(messages, "home.title", "Your executive workspace")}
            </h2>
          </div>
          <Button
            variant="outline"
            className="cursor-pointer rounded-xl px-4"
            nativeButton={false}
            render={<Link href="/meetings" />}
          >
            {getMessage(messages, "home.primaryCta", "Open meetings")}
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          {meetings.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/60 p-6 text-sm text-muted-foreground">
              {getMessage(
                messages,
                "home.emptyMeetings",
                "No meetings yet. Create one to begin the Phase 1 workflow.",
              )}
            </div>
          ) : (
            meetings.map((meeting) => (
              <article
                key={meeting.id}
                className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill tone={getStatusTone(meeting.status)}>
                        {getMeetingStatusLabel(messages, meeting.status)}
                      </StatusPill>
                      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="size-4 text-primary" />
                        {formatDateTime(meeting.scheduledAt, language) ??
                          getMessage(
                            messages,
                            "meetings.list.unscheduled",
                            "Unscheduled",
                          )}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{meeting.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {meeting.objective ??
                          getMessage(
                            messages,
                            "meetings.list.objectiveFallback",
                            "No objective captured yet.",
                          )}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="cursor-pointer rounded-xl px-5"
                    nativeButton={false}
                    render={<Link href={`/meetings/${meeting.id}`} />}
                  >
                    {getMessage(messages, "meetings.list.open", "Open meeting")}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
