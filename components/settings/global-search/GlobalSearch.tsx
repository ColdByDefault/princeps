/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since beta
 */

"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  CheckSquare,
  CreditCard,
  BrainCircuit,
  Users,
  CalendarDays,
  Scale,
  Tag,
  Target,
  BookMarked,
  BookOpen,
  BarChart3,
  User2,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { buildKeywords, useGlobalSearch } from "./logic/useGlobalSearch";

function formatReportDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase();
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function maxFuzzyDistance(queryLength: number): number {
  if (queryLength <= 4) return 1;
  if (queryLength <= 8) return 2;
  return 3;
}

function findHighlightRange(
  text: string,
  query: string,
): { start: number; end: number } | null {
  const normalizedQuery = normalizeForMatch(query);

  if (!normalizedQuery) {
    return null;
  }

  const loweredText = text.toLowerCase();
  const directIndex = loweredText.indexOf(normalizedQuery);

  if (directIndex >= 0) {
    return {
      start: directIndex,
      end: directIndex + normalizedQuery.length,
    };
  }

  if (normalizedQuery.length < 3) {
    return null;
  }

  const wordMatches = [...text.matchAll(/[\p{L}\p{N}_-]+/gu)];
  const threshold = maxFuzzyDistance(normalizedQuery.length);

  let bestMatch: { start: number; end: number; distance: number } | null = null;

  for (const match of wordMatches) {
    const matchedWord = match[0];
    const start = match.index;

    if (start === undefined) {
      continue;
    }

    const distance = levenshteinDistance(
      normalizedQuery,
      normalizeForMatch(matchedWord),
    );

    if (distance > threshold) {
      continue;
    }

    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = {
        start,
        end: start + matchedWord.length,
        distance,
      };
    }
  }

  return bestMatch ? { start: bestMatch.start, end: bestMatch.end } : null;
}

function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const range = findHighlightRange(text, query);

  if (!range) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {text.slice(0, range.start)}
      <mark className="rounded-sm bg-amber-200/70 px-0.5 text-foreground">
        {text.slice(range.start, range.end)}
      </mark>
      {text.slice(range.end)}
    </span>
  );
}

function PreviewChips({ labels, query }: { labels: string[]; query: string }) {
  const visible = labels.slice(0, 3);

  if (visible.length === 0) {
    return null;
  }

  return (
    <span className="mt-1 flex flex-wrap gap-1">
      {visible.map((label) => (
        <span
          key={label}
          className="rounded-sm border border-border/70 bg-muted/50 px-1.5 py-0 text-[10px] leading-4 text-muted-foreground"
        >
          <HighlightedText text={label} query={query} />
        </span>
      ))}
    </span>
  );
}

function joinPreview(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(" • ");
}

function fallbackStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export function GlobalSearch() {
  const { open, setOpen, data, query, setQuery, navigate } = useGlobalSearch();
  const t = useTranslations("shell");
  const tCommon = useTranslations("common");
  const tTasks = useTranslations("tasks");
  const tContacts = useTranslations("contacts");
  const tMeetings = useTranslations("meetings");
  const tDecisions = useTranslations("decisions");
  const tGoals = useTranslations("goals");
  const tReports = useTranslations("reports");

  const getTaskStatusLabel = (status: string): string => {
    switch (status) {
      case "open":
        return tCommon("status.open");
      case "in_progress":
        return tTasks("status.inProgress");
      case "done":
        return tCommon("status.done");
      case "cancelled":
        return tCommon("status.cancelled");
      default:
        return fallbackStatus(status);
    }
  };

  const getMeetingStatusLabel = (status: string): string => {
    switch (status) {
      case "upcoming":
        return tMeetings("status.upcoming");
      case "done":
        return tCommon("status.done");
      case "cancelled":
        return tCommon("status.cancelled");
      default:
        return fallbackStatus(status);
    }
  };

  const getDecisionStatusLabel = (status: string): string => {
    switch (status) {
      case "open":
        return tCommon("status.open");
      case "decided":
        return tDecisions("status.decided");
      case "reversed":
        return tDecisions("status.reversed");
      default:
        return fallbackStatus(status);
    }
  };

  const getGoalStatusLabel = (status: string): string => {
    switch (status) {
      case "open":
        return tCommon("status.open");
      case "in_progress":
        return tGoals("status.in_progress");
      case "done":
        return tCommon("status.done");
      case "cancelled":
        return tCommon("status.cancelled");
      default:
        return fallbackStatus(status);
    }
  };

  const navLinks: { href: string; icon: LucideIcon; label: string }[] = [
    { href: "/home", icon: LayoutDashboard, label: t("nav.home") },
    { href: "/chat", icon: MessageSquare, label: t("nav.chat") },
    {
      href: "/knowledge",
      icon: BrainCircuit,
      label: tCommon("entities.knowledge"),
    },
    { href: "/labels", icon: Tag, label: tCommon("entities.labels") },
    { href: "/tasks", icon: CheckSquare, label: tCommon("entities.tasks") },
    { href: "/goals", icon: Target, label: tCommon("entities.goals") },
    { href: "/contacts", icon: Users, label: tCommon("entities.contacts") },
    {
      href: "/meetings",
      icon: CalendarDays,
      label: tCommon("entities.meetings"),
    },
    {
      href: "/decisions",
      icon: Scale,
      label: tCommon("entities.decisions"),
    },
    { href: "/memory", icon: BookMarked, label: tCommon("entities.memory") },
    {
      href: "/reading-queue",
      icon: BookOpen,
      label: tCommon("entities.readingQueue"),
    },
    {
      href: "/reports",
      icon: BarChart3,
      label: tCommon("entities.reports"),
    },
    {
      href: "/settings",
      icon: Settings,
      label: tCommon("entities.settings"),
    },
    { href: "/pricing", icon: CreditCard, label: tCommon("entities.plans") },
    { href: "/profile", icon: User2, label: t("nav.profile") },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setQuery("");
        }
      }}
      title={t("search.title")}
      description={t("search.description")}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("search.placeholder")}
      />
      <CommandList>
        {open && data === null ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <CommandEmpty>{t("search.empty")}</CommandEmpty>

            <CommandGroup heading={t("search.navigation")}>
              {navLinks.map(({ href, icon: Icon, label }) => (
                <CommandItem
                  key={href}
                  value={label}
                  onSelect={() => navigate(href)}
                >
                  <Icon />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>

            {(data?.reports.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.reports")}>
                {data!.reports.map((item) => {
                  const reportDate = formatReportDate(item.createdAt);
                  const reportLabel =
                    item.toolsCalled.slice(0, 3).join(" · ") ||
                    tCommon("entities.reports");
                  const reportPreview = joinPreview([
                    item.matchedTool,
                    `${item.toolCallCount} ${tReports("toolCalls")}`,
                  ]);

                  return (
                    <CommandItem
                      key={item.id}
                      value={`${reportDate} ${reportLabel}`}
                      keywords={buildKeywords(
                        query,
                        "report",
                        "bericht",
                        tCommon("entities.reports"),
                        ...item.toolsCalled,
                        ...item.detailTools,
                      )}
                      onSelect={() => navigate(`/reports#report-${item.id}`)}
                    >
                      <BarChart3 className="self-start mt-0.5" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <HighlightedText
                          text={reportLabel}
                          query={query}
                          className="truncate"
                        />
                        {reportPreview && (
                          <span className="truncate text-xs text-muted-foreground">
                            <HighlightedText
                              text={reportPreview}
                              query={query}
                            />
                          </span>
                        )}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {reportDate}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {(data?.labels.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.labels")}>
                {data!.labels.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    keywords={buildKeywords(
                      query,
                      "label",
                      tCommon("entities.labels"),
                    )}
                    onSelect={() => navigate("/labels")}
                  >
                    <Tag className="self-start mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <HighlightedText
                        text={item.name}
                        query={query}
                        className="truncate"
                      />
                      <span className="truncate text-xs text-muted-foreground">
                        {item.color}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.tasks.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.tasks")}>
                {data!.tasks.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={buildKeywords(
                      query,
                      "task",
                      tCommon("entities.tasks"),
                      item.status,
                      ...item.labels.map((label) => label.name),
                    )}
                    onSelect={() => navigate("/tasks")}
                  >
                    <CheckSquare className="self-start mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <HighlightedText
                        text={item.title}
                        query={query}
                        className="truncate"
                      />
                      <span className="truncate text-xs text-muted-foreground">
                        {joinPreview([
                          getTaskStatusLabel(item.status),
                          item.dueDate
                            ? `${tTasks("fields.dueDate")}: ${formatShortDate(item.dueDate) ?? ""}`
                            : null,
                        ])}
                      </span>
                      <PreviewChips
                        labels={item.labels.map((label) => label.name)}
                        query={query}
                      />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.contacts.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.contacts")}>
                {data!.contacts.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    keywords={buildKeywords(
                      query,
                      "contact",
                      tCommon("entities.contacts"),
                      item.role,
                      item.company,
                      ...item.labels.map((label) => label.name),
                    )}
                    onSelect={() => navigate("/contacts")}
                  >
                    <Users className="self-start mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <HighlightedText
                        text={item.name}
                        query={query}
                        className="truncate"
                      />
                      <span className="truncate text-xs text-muted-foreground">
                        {joinPreview([
                          item.role
                            ? `${tContacts("fields.role")}: ${item.role}`
                            : null,
                          item.company,
                        ])}
                      </span>
                      <PreviewChips
                        labels={item.labels.map((label) => label.name)}
                        query={query}
                      />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.meetings.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.meetings")}>
                {data!.meetings.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={buildKeywords(
                      query,
                      "meeting",
                      tCommon("entities.meetings"),
                      item.status,
                      ...item.labels.map((label) => label.name),
                    )}
                    onSelect={() => navigate("/meetings")}
                  >
                    <CalendarDays className="self-start mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <HighlightedText
                        text={item.title}
                        query={query}
                        className="truncate"
                      />
                      <span className="truncate text-xs text-muted-foreground">
                        {joinPreview([
                          getMeetingStatusLabel(item.status),
                          `${tMeetings("fields.scheduledAt")}: ${formatShortDate(item.scheduledAt) ?? ""}`,
                        ])}
                      </span>
                      <PreviewChips
                        labels={item.labels.map((label) => label.name)}
                        query={query}
                      />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.decisions.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.decisions")}>
                {data!.decisions.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={buildKeywords(
                      query,
                      "decision",
                      tCommon("entities.decisions"),
                      item.status,
                      ...item.labels.map((label) => label.name),
                    )}
                    onSelect={() => navigate("/decisions")}
                  >
                    <Scale className="self-start mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <HighlightedText
                        text={item.title}
                        query={query}
                        className="truncate"
                      />
                      <span className="truncate text-xs text-muted-foreground">
                        {joinPreview([
                          getDecisionStatusLabel(item.status),
                          item.decidedAt
                            ? `${tDecisions("fields.decidedAt")}: ${formatShortDate(item.decidedAt) ?? ""}`
                            : null,
                        ])}
                      </span>
                      <PreviewChips
                        labels={item.labels.map((label) => label.name)}
                        query={query}
                      />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data?.goals.length ?? 0) > 0 && (
              <CommandGroup heading={tCommon("entities.goals")}>
                {data!.goals.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    keywords={buildKeywords(
                      query,
                      "goal",
                      tCommon("entities.goals"),
                      item.status,
                      ...item.labels.map((label) => label.name),
                    )}
                    onSelect={() => navigate("/goals")}
                  >
                    <Target className="self-start mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <HighlightedText
                        text={item.title}
                        query={query}
                        className="truncate"
                      />
                      <span className="truncate text-xs text-muted-foreground">
                        {joinPreview([
                          getGoalStatusLabel(item.status),
                          item.targetDate
                            ? `${tGoals("fields.targetDate")}: ${formatShortDate(item.targetDate) ?? ""}`
                            : null,
                        ])}
                      </span>
                      <PreviewChips
                        labels={item.labels.map((label) => label.name)}
                        query={query}
                      />
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
