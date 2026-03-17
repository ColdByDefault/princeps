/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";
import { type MeetingDetail } from "@/types/meetings";
import {
  formatDate,
  formatDateTime,
  getActionStatusLabel,
  getDecisionStatusLabel,
  getMeetingStatusLabel,
  getStatusTone,
  MeetingMetaRow,
  MeetingWorkspaceShell,
  StatusPill,
} from "@/components/meetings/shared";

function ValueBlock({
  content,
  fallback,
  title,
}: {
  content: string | null;
  fallback: string;
  title: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
        {content ?? fallback}
      </p>
    </section>
  );
}

export default function MeetingDetailView({
  language,
  meeting,
  messages,
}: {
  language: string;
  meeting: MeetingDetail;
  messages: MessageDictionary;
}) {
  return (
    <MeetingWorkspaceShell
      eyebrow={getMessage(
        messages,
        "meetings.detail.eyebrow",
        "Meeting record",
      )}
      title={meeting.title}
      description={
        meeting.objective ??
        getMessage(
          messages,
          "meetings.list.objectiveFallback",
          "No objective captured yet.",
        )
      }
      messages={messages}
      primaryHref={`/meetings/${meeting.id}/edit`}
      primaryLabel={getMessage(messages, "meetings.nav.edit", "Edit meeting")}
      secondaryHref="/meetings"
      secondaryLabel={getMessage(
        messages,
        "meetings.nav.backToMeetings",
        "Back to meetings",
      )}
    >
      <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <StatusPill tone={getStatusTone(meeting.status)}>
              {getMeetingStatusLabel(messages, meeting.status)}
            </StatusPill>
            <MeetingMetaRow
              scheduledAt={meeting.scheduledAt}
              durationMinutes={meeting.durationMinutes}
              location={meeting.location}
              locale={language}
              messages={messages}
            />
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
            <p>
              {getMessage(
                messages,
                "meetings.detail.scheduledAtLabel",
                "Scheduled",
              )}
              :{" "}
              {formatDateTime(meeting.scheduledAt, language) ??
                getMessage(messages, "meetings.detail.emptyValue", "Not set")}
            </p>
            <p className="mt-2">
              {getMessage(messages, "meetings.detail.statusLabel", "Status")}:{" "}
              {getMeetingStatusLabel(messages, meeting.status)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ValueBlock
          title={getMessage(
            messages,
            "meetings.detail.prepNotesLabel",
            "Preparation notes",
          )}
          content={meeting.prepNotes}
          fallback={getMessage(
            messages,
            "meetings.detail.noPrep",
            "No preparation notes captured yet.",
          )}
        />
        <ValueBlock
          title={getMessage(
            messages,
            "meetings.detail.prepBriefLabel",
            "Preparation brief",
          )}
          content={meeting.prepBrief}
          fallback={getMessage(
            messages,
            "meetings.detail.noPrepBrief",
            "No preparation brief captured yet.",
          )}
        />
        <ValueBlock
          title={getMessage(
            messages,
            "meetings.detail.summaryLabel",
            "Summary",
          )}
          content={meeting.summary}
          fallback={getMessage(
            messages,
            "meetings.detail.noSummary",
            "No post-meeting summary captured yet.",
          )}
        />
        <ValueBlock
          title={getMessage(
            messages,
            "meetings.detail.nextStepsLabel",
            "Next steps",
          )}
          content={meeting.nextSteps}
          fallback={getMessage(
            messages,
            "meetings.detail.noNextSteps",
            "No next steps captured yet.",
          )}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">
                {getMessage(
                  messages,
                  "meetings.detail.participantsTitle",
                  "Participants",
                )}
              </h2>
              <StatusPill>{meeting.participants.length}</StatusPill>
            </div>
            <div className="mt-5 space-y-3">
              {meeting.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {getMessage(
                    messages,
                    "meetings.detail.emptyParticipants",
                    "No participants captured yet.",
                  )}
                </p>
              ) : (
                meeting.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4"
                  >
                    <p className="font-medium">{participant.name}</p>
                    {participant.role ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {participant.role}
                      </p>
                    ) : null}
                    {participant.email ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {participant.email}
                      </p>
                    ) : null}
                    {participant.notes ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {participant.notes}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur">
            <h2 className="text-xl font-semibold">
              {getMessage(
                messages,
                "meetings.detail.decisionsTitle",
                "Decisions",
              )}
            </h2>
            <div className="mt-5 space-y-3">
              {meeting.decisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {getMessage(
                    messages,
                    "meetings.detail.emptyDecisions",
                    "No decisions captured yet.",
                  )}
                </p>
              ) : (
                meeting.decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="rounded-2xl border border-border/70 bg-background/70 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium">{decision.title}</p>
                      <StatusPill>
                        {getDecisionStatusLabel(messages, decision.status)}
                      </StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {getMessage(
                        messages,
                        "meetings.detail.decidedAtLabel",
                        "Decided",
                      )}
                      :{" "}
                      {formatDate(decision.decidedAt, language) ??
                        getMessage(
                          messages,
                          "meetings.detail.emptyValue",
                          "Not set",
                        )}
                    </p>
                    {decision.rationale ? (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {getMessage(
                          messages,
                          "meetings.detail.rationaleLabel",
                          "Rationale",
                        )}
                        : {decision.rationale}
                      </p>
                    ) : null}
                    {decision.outcome ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {getMessage(
                          messages,
                          "meetings.detail.outcomeLabel",
                          "Outcome",
                        )}
                        : {decision.outcome}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              {getMessage(
                messages,
                "meetings.detail.actionsTitle",
                "Action items",
              )}
            </h2>
            <StatusPill>{meeting.actionItems.length}</StatusPill>
          </div>
          <div className="mt-5 space-y-3">
            {meeting.actionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {getMessage(
                  messages,
                  "meetings.detail.emptyActions",
                  "No action items captured yet.",
                )}
              </p>
            ) : (
              meeting.actionItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/70 bg-background/70 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium">{item.title}</p>
                    <StatusPill>
                      {getActionStatusLabel(messages, item.status)}
                    </StatusPill>
                  </div>
                  {item.notes ? (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {item.notes}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      {getMessage(
                        messages,
                        "meetings.detail.assigneeLabel",
                        "Assignee",
                      )}
                      :{" "}
                      {item.assigneeName ??
                        getMessage(
                          messages,
                          "meetings.detail.emptyValue",
                          "Not set",
                        )}
                    </span>
                    <span>
                      {getMessage(
                        messages,
                        "meetings.detail.dueAtLabel",
                        "Due",
                      )}
                      :{" "}
                      {formatDate(item.dueAt, language) ??
                        getMessage(
                          messages,
                          "meetings.detail.emptyValue",
                          "Not set",
                        )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </MeetingWorkspaceShell>
  );
}
