/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  CheckSquare,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";
import { type MeetingListItem } from "@/types/meetings";
import {
  formatDateTime,
  getMeetingStatusLabel,
  getStatusTone,
  MeetingMetaRow,
  MeetingWorkspaceShell,
  StatusPill,
} from "@/components/meetings/shared";

export default function MeetingListView({
  language,
  meetings,
  messages,
}: {
  language: string;
  meetings: MeetingListItem[];
  messages: MessageDictionary;
}) {
  return (
    <MeetingWorkspaceShell
      eyebrow={getMessage(
        messages,
        "meetings.list.eyebrow",
        "Phase 1 workspace",
      )}
      title={getMessage(
        messages,
        "meetings.list.title",
        "Meeting prep and follow-up",
      )}
      description={getMessage(
        messages,
        "meetings.list.description",
        "Track the meetings that matter, keep preparation visible, and carry decisions forward into the next session.",
      )}
      messages={messages}
      primaryHref="/meetings/new"
      primaryLabel={getMessage(messages, "meetings.nav.new", "New meeting")}
    >
      {meetings.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border/70 bg-card/60 p-10 text-center shadow-lg shadow-black/5 backdrop-blur">
          <div className="mx-auto max-w-2xl space-y-4">
            <p className="text-2xl font-semibold">
              {getMessage(
                messages,
                "meetings.list.emptyTitle",
                "No meetings yet",
              )}
            </p>
            <p className="text-muted-foreground">
              {getMessage(
                messages,
                "meetings.list.emptyBody",
                "Create the first meeting to start building a durable record of objectives, preparation, and follow-through.",
              )}
            </p>
            <div className="pt-2">
              <Button
                size="lg"
                className="cursor-pointer rounded-xl px-5"
                nativeButton={false}
                render={<Link href="/meetings/new" />}
              >
                {getMessage(messages, "meetings.nav.new", "New meeting")}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          {meetings.map((meeting) => (
            <article
              key={meeting.id}
              className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-7"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill tone={getStatusTone(meeting.status)}>
                      {getMeetingStatusLabel(messages, meeting.status)}
                    </StatusPill>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(meeting.updatedAt, language)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {meeting.title}
                    </h2>
                    <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                      {meeting.objective ??
                        getMessage(
                          messages,
                          "meetings.list.objectiveFallback",
                          "No objective captured yet.",
                        )}
                    </p>
                  </div>
                  <MeetingMetaRow
                    scheduledAt={meeting.scheduledAt}
                    locale={language}
                    messages={messages}
                  />
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2">
                      <CalendarRange className="size-4 text-primary" />
                      {getMessage(
                        messages,
                        "meetings.list.participantsCount",
                        "Participants",
                      )}
                      : {meeting._count.participants}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2">
                      <CheckSquare className="size-4 text-primary" />
                      {getMessage(
                        messages,
                        "meetings.list.actionsCount",
                        "Action items",
                      )}
                      : {meeting._count.actionItems}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2">
                      <GitBranch className="size-4 text-primary" />
                      {getMessage(
                        messages,
                        "meetings.list.decisionsCount",
                        "Decisions",
                      )}
                      : {meeting._count.decisions}
                    </span>
                  </div>
                </div>

                <div>
                  <Button
                    size="lg"
                    className="cursor-pointer rounded-xl px-5"
                    nativeButton={false}
                    render={<Link href={`/meetings/${meeting.id}`} />}
                  >
                    {getMessage(messages, "meetings.list.open", "Open meeting")}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </MeetingWorkspaceShell>
  );
}
