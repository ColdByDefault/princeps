/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import Link from "next/link";
import { CalendarDays, Clock3, MapPin, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMessage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { type MessageDictionary } from "@/types/i18n";
import {
  type MeetingActionStatus,
  type MeetingDecisionStatus,
  type MeetingStatus,
} from "@/types/meetings";

function toDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

export function formatDateTime(
  value: Date | string | null | undefined,
  locale: string,
) {
  const date = toDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(
  value: Date | string | null | undefined,
  locale: string,
) {
  const date = toDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
}

export function getMeetingStatusLabel(
  messages: MessageDictionary,
  status: MeetingStatus,
) {
  return getMessage(messages, `meetings.status.${status}`, status);
}

export function getActionStatusLabel(
  messages: MessageDictionary,
  status: MeetingActionStatus,
) {
  return getMessage(messages, `meetings.actionStatus.${status}`, status);
}

export function getDecisionStatusLabel(
  messages: MessageDictionary,
  status: MeetingDecisionStatus,
) {
  return getMessage(messages, `meetings.decisionStatus.${status}`, status);
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase",
        tone === "neutral" &&
          "border-border/70 bg-background/80 text-muted-foreground",
        tone === "success" &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        tone === "danger" &&
          "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      )}
    >
      {children}
    </span>
  );
}

export function getStatusTone(status: MeetingStatus) {
  if (status === "completed") {
    return "success" as const;
  }

  if (status === "cancelled") {
    return "danger" as const;
  }

  return "neutral" as const;
}

export function MeetingWorkspaceShell({
  children,
  description,
  eyebrow,
  title,
  messages,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
  messages: MessageDictionary;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 py-8 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-5 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-xl shadow-black/5 backdrop-blur lg:flex-row lg:items-end lg:justify-between lg:p-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            <Link
              href="/home"
              className="cursor-pointer rounded-full border border-border/70 bg-background/80 px-3 py-1.5 transition hover:border-primary/40 hover:text-foreground"
            >
              {getMessage(
                messages,
                "meetings.nav.backHome",
                "Back to workspace",
              )}
            </Link>
            <span>{eyebrow}</span>
          </div>
          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {secondaryHref && secondaryLabel ? (
            <Button
              size="lg"
              variant="outline"
              className="cursor-pointer rounded-xl px-5"
              nativeButton={false}
              render={<Link href={secondaryHref} />}
            >
              {secondaryLabel}
            </Button>
          ) : null}
          {primaryHref && primaryLabel ? (
            <Button
              size="lg"
              className="cursor-pointer rounded-xl px-5"
              nativeButton={false}
              render={<Link href={primaryHref} />}
            >
              {primaryLabel}
              <MoveRight className="size-4" />
            </Button>
          ) : null}
        </div>
      </header>

      <div className="mt-8 flex flex-1 flex-col gap-6">{children}</div>
    </div>
  );
}

export function MeetingMetaRow({
  durationMinutes,
  locale,
  messages,
  scheduledAt,
  location,
}: {
  durationMinutes?: number | null;
  locale: string;
  messages: MessageDictionary;
  scheduledAt?: Date | string | null;
  location?: string | null;
}) {
  const formattedDate = formatDateTime(scheduledAt, locale);

  return (
    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2">
        <CalendarDays className="size-4 text-primary" />
        {formattedDate ??
          getMessage(messages, "meetings.list.unscheduled", "Unscheduled")}
      </span>
      {durationMinutes ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2">
          <Clock3 className="size-4 text-primary" />
          {durationMinutes} min
        </span>
      ) : null}
      {location ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2">
          <MapPin className="size-4 text-primary" />
          {location}
        </span>
      ) : null}
    </div>
  );
}
