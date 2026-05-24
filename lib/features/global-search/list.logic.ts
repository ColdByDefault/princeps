/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since canary-v1.1.8
 */

import "server-only";

import { listContacts } from "@/lib/features/contacts";
import { listDecisions } from "@/lib/features/decisions";
import { listGoals } from "@/lib/features/goals";
import { listLabels } from "@/lib/features/labels";
import { listMeetings } from "@/lib/features/meetings";
import { listReports } from "@/lib/features/reports";
import { listTasks } from "@/lib/features/tasks";

const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 5;
const MAX_LIMIT = 50;
const RECENCY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const RECENCY_MAX_BOOST = 18;
const FUZZY_MIN_QUERY_LEN = 3;

type SearchLabelItem = {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
};

type SearchTaskItem = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  labels: SearchLabelItem[];
};

type SearchContactItem = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  labels: SearchLabelItem[];
};

type SearchMeetingItem = {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
  labels: SearchLabelItem[];
};

type SearchDecisionItem = {
  id: string;
  title: string;
  status: string;
  decidedAt: string | null;
  labels: SearchLabelItem[];
};

type SearchGoalItem = {
  id: string;
  title: string;
  status: string;
  targetDate: string | null;
  labels: SearchLabelItem[];
};

type SearchReportItem = {
  id: string;
  createdAt: string;
  toolsCalled: string[];
  detailTools: string[];
  toolCallCount: number;
  matchedTool: string | null;
};

export interface GlobalSearchOptions {
  query?: string;
  limit?: number;
}

export interface GlobalSearchData {
  tasks: SearchTaskItem[];
  contacts: SearchContactItem[];
  meetings: SearchMeetingItem[];
  decisions: SearchDecisionItem[];
  goals: SearchGoalItem[];
  labels: SearchLabelItem[];
  reports: SearchReportItem[];
}

function mapLabels(
  labels: Array<{
    id: string;
    name: string;
    color: string;
    icon?: string | null;
  }>,
): SearchLabelItem[] {
  return labels.map(({ id, name, color, icon }) => ({
    id,
    name,
    color,
    icon: icon ?? null,
  }));
}

function uniqueTools(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function splitTokens(value: string): string[] {
  return normalize(value)
    .split(/[\s._:/\\|-]+/g)
    .map((token) => token.trim())
    .filter(Boolean);
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

function scoreFuzzyMatch(query: string, candidate: string): number {
  if (query.length < FUZZY_MIN_QUERY_LEN) {
    return 0;
  }

  const tokens = splitTokens(candidate);

  if (tokens.length === 0) {
    return 0;
  }

  const threshold = maxFuzzyDistance(query.length);
  let best = 0;

  for (const token of tokens) {
    const distance = levenshteinDistance(query, token);

    if (distance > threshold) {
      continue;
    }

    const lengthPenalty = Math.abs(token.length - query.length) * 2;
    const score = Math.max(20, 52 - distance * 11 - lengthPenalty);

    if (score > best) {
      best = score;
    }
  }

  // Initialism support: "mtg" can match "Monthly Team Growth".
  const initials = tokens.map((token) => token[0]).join("");

  if (initials && (initials === query || initials.startsWith(query))) {
    best = Math.max(best, 36);
  }

  return best;
}

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;

  const parsed = Math.floor(limit as number);
  return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, parsed));
}

function scoreTextMatch(
  query: string,
  candidate: string | null | undefined,
): number {
  const value = normalize(candidate);

  if (!query || !value) return 0;
  if (value === query) return 130;
  if (value.startsWith(query)) return 95;
  if (value.includes(query)) return 70;

  return scoreFuzzyMatch(query, value);
}

function bestScore(
  query: string,
  values: Array<string | null | undefined>,
): number {
  let best = 0;

  for (const value of values) {
    const score = scoreTextMatch(query, value);
    if (score > best) best = score;
  }

  return best;
}

function bestMatch(
  query: string,
  values: Array<string | null | undefined>,
): { score: number; value: string | null } {
  let topScore = 0;
  let topValue: string | null = null;

  for (const value of values) {
    const score = scoreTextMatch(query, value);

    if (score > topScore) {
      topScore = score;
      topValue = value?.trim() || null;
    }
  }

  return { score: topScore, value: topValue };
}

function recencyBoost(iso: string | null | undefined): number {
  if (!iso) return 0;

  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return 0;

  const age = Date.now() - timestamp;
  if (age <= 0) return RECENCY_MAX_BOOST;
  if (age >= RECENCY_WINDOW_MS) return 0;

  return Math.round((1 - age / RECENCY_WINDOW_MS) * RECENCY_MAX_BOOST);
}

function withRecency(
  baseScore: number,
  iso: string | null | undefined,
): number {
  if (baseScore <= 0) return 0;
  return baseScore + recencyBoost(iso);
}

function rankItems<T>(
  items: T[],
  query: string,
  limit: number,
  getScore: (item: T) => number,
): T[] {
  if (!query) {
    return items.slice(0, limit);
  }

  return items
    .map((item, index) => ({ item, score: getScore(item), index }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export async function listGlobalSearchData(
  userId: string,
  options: GlobalSearchOptions = {},
): Promise<GlobalSearchData> {
  const query = normalize(options.query);
  const limit = normalizeLimit(options.limit);

  const [tasks, contacts, meetings, decisions, goals, labels, reports] =
    await Promise.all([
      listTasks(userId),
      listContacts(userId),
      listMeetings(userId),
      listDecisions(userId),
      listGoals(userId),
      listLabels(userId),
      listReports(userId),
    ]);

  const rankedTasks = rankItems(tasks, query, limit, (task) => {
    const titleScore = scoreTextMatch(query, task.title) * 3;
    const labelScore = bestScore(
      query,
      task.labels.map((label) => label.name),
    );

    return withRecency(titleScore + labelScore, task.updatedAt);
  });

  const rankedContacts = rankItems(contacts, query, limit, (contact) => {
    const nameScore = scoreTextMatch(query, contact.name) * 3;
    const companyScore = scoreTextMatch(query, contact.company) * 2;
    const labelScore = bestScore(
      query,
      contact.labels.map((label) => label.name),
    );

    return withRecency(
      nameScore + companyScore + labelScore,
      contact.updatedAt,
    );
  });

  const rankedMeetings = rankItems(meetings, query, limit, (meeting) => {
    const titleScore = scoreTextMatch(query, meeting.title) * 3;
    const stateScore = bestScore(query, [meeting.status, meeting.kind]);
    const labelScore = bestScore(
      query,
      meeting.labels.map((label) => label.name),
    );

    return withRecency(
      titleScore + stateScore + labelScore,
      meeting.scheduledAt,
    );
  });

  const rankedDecisions = rankItems(decisions, query, limit, (decision) => {
    const titleScore = scoreTextMatch(query, decision.title) * 3;
    const notesScore = bestScore(query, [decision.outcome, decision.rationale]);
    const stateScore = scoreTextMatch(query, decision.status);
    const labelScore = bestScore(
      query,
      decision.labels.map((label) => label.name),
    );

    return withRecency(
      titleScore + notesScore + stateScore + labelScore,
      decision.updatedAt,
    );
  });

  const rankedGoals = rankItems(goals, query, limit, (goal) => {
    const titleScore = scoreTextMatch(query, goal.title) * 3;
    const descScore = scoreTextMatch(query, goal.description);
    const stateScore = scoreTextMatch(query, goal.status);
    const labelScore = bestScore(
      query,
      goal.labels.map((label) => label.name),
    );

    return withRecency(
      titleScore + descScore + stateScore + labelScore,
      goal.updatedAt,
    );
  });

  const rankedLabels = rankItems(labels, query, limit, (label) => {
    const nameScore = scoreTextMatch(query, label.name) * 3;
    return withRecency(nameScore, label.updatedAt);
  });

  const rankedReports =
    query.length === 0
      ? reports.slice(0, limit).map((report) => ({
          report,
          matchedTool: null as string | null,
        }))
      : reports
          .map((report, index) => {
            const reportTools = [
              ...report.toolsCalled,
              ...report.details.map((detail) => detail.tool),
            ];
            const match = bestMatch(query, reportTools);
            const score = withRecency(match.score * 2, report.createdAt);

            return {
              report,
              index,
              matchedTool: match.value,
              baseScore: match.score,
              score,
            };
          })
          .filter((entry) => entry.baseScore > 0)
          .sort((a, b) => b.score - a.score || a.index - b.index)
          .slice(0, limit)
          .map((entry) => ({
            report: entry.report,
            matchedTool: entry.matchedTool,
          }));

  return {
    tasks: rankedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
      labels: mapLabels(task.labels),
    })),
    contacts: rankedContacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      role: contact.role,
      company: contact.company,
      labels: mapLabels(contact.labels),
    })),
    meetings: rankedMeetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      status: meeting.status,
      scheduledAt: meeting.scheduledAt,
      labels: mapLabels(meeting.labels),
    })),
    decisions: rankedDecisions.map((decision) => ({
      id: decision.id,
      title: decision.title,
      status: decision.status,
      decidedAt: decision.decidedAt,
      labels: mapLabels(decision.labels),
    })),
    goals: rankedGoals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      status: goal.status,
      targetDate: goal.targetDate,
      labels: mapLabels(goal.labels),
    })),
    labels: rankedLabels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
      icon: label.icon ?? null,
    })),
    reports: rankedReports.map(({ report, matchedTool }) => ({
      id: report.id,
      createdAt: report.createdAt,
      toolsCalled: uniqueTools(report.toolsCalled),
      detailTools: uniqueTools(report.details.map((detail) => detail.tool)),
      toolCallCount: report.toolCallCount,
      matchedTool,
    })),
  };
}
