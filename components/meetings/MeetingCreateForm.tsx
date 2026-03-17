/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getMessage } from "@/lib/i18n";
import { type MessageDictionary } from "@/types/i18n";
import {
  type CreateMeetingPayload,
  type MeetingFormInitialValues,
} from "@/types/meetings";

function parseParticipants(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function parseTitledItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((title) => ({ title }));
}

function buildInitialValues(
  initialValues?: Partial<MeetingFormInitialValues>,
): MeetingFormInitialValues {
  return {
    title: initialValues?.title ?? "",
    objective: initialValues?.objective ?? "",
    scheduledAt: initialValues?.scheduledAt ?? "",
    durationMinutes: initialValues?.durationMinutes ?? "",
    location: initialValues?.location ?? "",
    prepNotes: initialValues?.prepNotes ?? "",
    participants: initialValues?.participants ?? "",
    summary: initialValues?.summary ?? "",
    nextSteps: initialValues?.nextSteps ?? "",
    actionItems: initialValues?.actionItems ?? "",
    decisions: initialValues?.decisions ?? "",
  };
}

export default function MeetingCreateForm({
  initialValues,
  meetingId,
  messages,
  mode = "create",
}: {
  initialValues?: Partial<MeetingFormInitialValues>;
  meetingId?: string;
  messages: MessageDictionary;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const defaults = buildInitialValues(initialValues);
  const [title, setTitle] = useState(defaults.title);
  const [objective, setObjective] = useState(defaults.objective);
  const [scheduledAt, setScheduledAt] = useState(defaults.scheduledAt);
  const [durationMinutes, setDurationMinutes] = useState(
    defaults.durationMinutes,
  );
  const [location, setLocation] = useState(defaults.location);
  const [participants, setParticipants] = useState(defaults.participants);
  const [prepNotes, setPrepNotes] = useState(defaults.prepNotes);
  const [summary, setSummary] = useState(defaults.summary);
  const [nextSteps, setNextSteps] = useState(defaults.nextSteps);
  const [actionItems, setActionItems] = useState(defaults.actionItems);
  const [decisions, setDecisions] = useState(defaults.decisions);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const payload: CreateMeetingPayload = {
      title,
      objective: objective || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      location: location || null,
      prepNotes: prepNotes || null,
      participants: parseParticipants(participants),
      summary: summary || null,
      nextSteps: nextSteps || null,
      actionItems: parseTitledItems(actionItems),
      decisions: parseTitledItems(decisions),
    };

    try {
      const response = await fetch(
        mode === "edit" && meetingId
          ? `/api/meetings/${meetingId}`
          : "/api/meetings",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = (await response.json()) as {
        error?: string;
        meeting?: { id: string };
      };

      if (!response.ok || !result.meeting) {
        setError(
          result.error ??
            getMessage(
              messages,
              mode === "edit"
                ? "meetings.form.updateErrorFallback"
                : "meetings.form.errorFallback",
              mode === "edit"
                ? "Unable to update meeting. Please try again."
                : "Unable to create meeting. Please try again.",
            ),
        );
        setLoading(false);
        return;
      }

      router.push(`/meetings/${result.meeting.id}`);
      router.refresh();
    } catch {
      setError(
        getMessage(
          messages,
          mode === "edit"
            ? "meetings.form.updateErrorFallback"
            : "meetings.form.errorFallback",
          mode === "edit"
            ? "Unable to update meeting. Please try again."
            : "Unable to create meeting. Please try again.",
        ),
      );
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!meetingId) {
      return;
    }

    const confirmed = window.confirm(
      getMessage(
        messages,
        "meetings.form.deleteConfirm",
        "Delete this meeting? This cannot be undone.",
      ),
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setDeleting(true);

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(
          result.error ??
            getMessage(
              messages,
              "meetings.form.deleteErrorFallback",
              "Unable to delete meeting. Please try again.",
            ),
        );
        setDeleting(false);
        return;
      }

      router.push("/meetings");
      router.refresh();
    } catch {
      setError(
        getMessage(
          messages,
          "meetings.form.deleteErrorFallback",
          "Unable to delete meeting. Please try again.",
        ),
      );
      setDeleting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:grid-cols-[1.1fr_0.9fr] lg:p-8"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            {getMessage(messages, "meetings.form.titleLabel", "Meeting title")}
          </label>
          <Input
            id="title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={getMessage(
              messages,
              "meetings.form.titlePlaceholder",
              "Board prep with investor group",
            )}
            className="h-12 rounded-xl bg-background/80"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="objective" className="text-sm font-medium">
            {getMessage(messages, "meetings.form.objectiveLabel", "Objective")}
          </label>
          <Textarea
            id="objective"
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder={getMessage(
              messages,
              "meetings.form.objectivePlaceholder",
              "What needs to be aligned, decided, or unlocked?",
            )}
            className="rounded-2xl bg-background/80"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="prepNotes" className="text-sm font-medium">
            {getMessage(
              messages,
              "meetings.form.prepNotesLabel",
              "Preparation notes",
            )}
          </label>
          <Textarea
            id="prepNotes"
            value={prepNotes}
            onChange={(event) => setPrepNotes(event.target.value)}
            placeholder={getMessage(
              messages,
              "meetings.form.prepNotesPlaceholder",
              "Context, talking points, known risks, or questions to resolve.",
            )}
            className="min-h-44 rounded-2xl bg-background/80"
          />
        </div>

        {mode === "edit" ? (
          <>
            <div className="space-y-2">
              <label htmlFor="summary" className="text-sm font-medium">
                {getMessage(messages, "meetings.form.summaryLabel", "Summary")}
              </label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder={getMessage(
                  messages,
                  "meetings.form.summaryPlaceholder",
                  "What happened, what was aligned, and what changed?",
                )}
                className="min-h-36 rounded-2xl bg-background/80"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="nextSteps" className="text-sm font-medium">
                {getMessage(
                  messages,
                  "meetings.form.nextStepsLabel",
                  "Next steps",
                )}
              </label>
              <Textarea
                id="nextSteps"
                value={nextSteps}
                onChange={(event) => setNextSteps(event.target.value)}
                placeholder={getMessage(
                  messages,
                  "meetings.form.nextStepsPlaceholder",
                  "What should happen next after this meeting?",
                )}
                className="min-h-32 rounded-2xl bg-background/80"
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="scheduledAt" className="text-sm font-medium">
              {getMessage(
                messages,
                "meetings.form.scheduledAtLabel",
                "Scheduled time",
              )}
            </label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="h-12 rounded-xl bg-background/80"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="durationMinutes" className="text-sm font-medium">
              {getMessage(
                messages,
                "meetings.form.durationMinutesLabel",
                "Duration in minutes",
              )}
            </label>
            <Input
              id="durationMinutes"
              type="number"
              min="1"
              step="1"
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              className="h-12 rounded-xl bg-background/80"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium">
            {getMessage(
              messages,
              "meetings.form.locationLabel",
              "Location or channel",
            )}
          </label>
          <Input
            id="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={getMessage(
              messages,
              "meetings.form.locationPlaceholder",
              "Zoom, HQ conference room, phone",
            )}
            className="h-12 rounded-xl bg-background/80"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="participants" className="text-sm font-medium">
            {getMessage(
              messages,
              "meetings.form.participantsLabel",
              "Participants",
            )}
          </label>
          <Textarea
            id="participants"
            value={participants}
            onChange={(event) => setParticipants(event.target.value)}
            placeholder={getMessage(
              messages,
              "meetings.form.participantsPlaceholder",
              "Ada Lovelace\nGrace Hopper",
            )}
            className="min-h-36 rounded-2xl bg-background/80"
          />
          <p className="text-sm text-muted-foreground">
            {getMessage(
              messages,
              "meetings.form.participantsHint",
              "One person per line. Add role or context later if needed.",
            )}
          </p>
        </div>

        {mode === "edit" ? (
          <>
            <div className="space-y-2">
              <label htmlFor="actionItems" className="text-sm font-medium">
                {getMessage(
                  messages,
                  "meetings.form.actionItemsLabel",
                  "Action items",
                )}
              </label>
              <Textarea
                id="actionItems"
                value={actionItems}
                onChange={(event) => setActionItems(event.target.value)}
                placeholder={getMessage(
                  messages,
                  "meetings.form.actionItemsPlaceholder",
                  "Share updated board memo\nConfirm budget assumptions",
                )}
                className="min-h-32 rounded-2xl bg-background/80"
              />
              <p className="text-sm text-muted-foreground">
                {getMessage(
                  messages,
                  "meetings.form.actionItemsHint",
                  "One action item per line.",
                )}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="decisions" className="text-sm font-medium">
                {getMessage(
                  messages,
                  "meetings.form.decisionsLabel",
                  "Decisions",
                )}
              </label>
              <Textarea
                id="decisions"
                value={decisions}
                onChange={(event) => setDecisions(event.target.value)}
                placeholder={getMessage(
                  messages,
                  "meetings.form.decisionsPlaceholder",
                  "Approve revised roadmap\nDelay vendor migration to Q3",
                )}
                className="min-h-32 rounded-2xl bg-background/80"
              />
              <p className="text-sm text-muted-foreground">
                {getMessage(
                  messages,
                  "meetings.form.decisionsHint",
                  "One decision per line.",
                )}
              </p>
            </div>
          </>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading || deleting}
            className="cursor-pointer rounded-xl px-5"
            size="lg"
          >
            {loading
              ? getMessage(
                  messages,
                  mode === "edit"
                    ? "meetings.form.updating"
                    : "meetings.form.submitting",
                  mode === "edit" ? "Saving changes..." : "Creating meeting...",
                )
              : getMessage(
                  messages,
                  mode === "edit"
                    ? "meetings.form.update"
                    : "meetings.form.submit",
                  mode === "edit" ? "Save changes" : "Create meeting",
                )}
            <ArrowRight className="size-4" />
          </Button>
          {mode === "edit" && meetingId ? (
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={loading || deleting}
              className="cursor-pointer rounded-xl px-5"
              onClick={handleDelete}
            >
              {deleting
                ? getMessage(messages, "meetings.form.deleting", "Deleting...")
                : getMessage(messages, "meetings.nav.delete", "Delete meeting")}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={loading || deleting}
            className="cursor-pointer rounded-xl px-5"
            nativeButton={false}
            render={
              <Link
                href={
                  mode === "edit" && meetingId
                    ? `/meetings/${meetingId}`
                    : "/meetings"
                }
              />
            }
          >
            {getMessage(
              messages,
              mode === "edit"
                ? "meetings.nav.backToDetail"
                : "meetings.nav.backToMeetings",
              mode === "edit" ? "Back to meeting" : "Back to meetings",
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
