/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.8
 * @since beta
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type LabelItem = {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
};

type TaskItem = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  labels: LabelItem[];
};
type ContactItem = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  labels: LabelItem[];
};
type MeetingItem = {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
  labels: LabelItem[];
};
type DecisionItem = {
  id: string;
  title: string;
  status: string;
  decidedAt: string | null;
  labels: LabelItem[];
};
type GoalItem = {
  id: string;
  title: string;
  status: string;
  targetDate: string | null;
  labels: LabelItem[];
};
type ReportItem = {
  id: string;
  createdAt: string;
  toolsCalled: string[];
  detailTools: string[];
  toolCallCount: number;
  matchedTool: string | null;
};

export type SearchData = {
  tasks: TaskItem[];
  contacts: ContactItem[];
  meetings: MeetingItem[];
  decisions: DecisionItem[];
  goals: GoalItem[];
  labels: LabelItem[];
  reports: ReportItem[];
};

const EMPTY_SEARCH_DATA: SearchData = {
  tasks: [],
  contacts: [],
  meetings: [],
  decisions: [],
  goals: [],
  labels: [],
  reports: [],
};

const SEARCH_LIMIT = 20;
const QUERY_DEBOUNCE_MS = 200;

export function buildKeywords(
  ...parts: Array<string | null | undefined>
): string[] {
  const unique = new Set<string>();

  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed) continue;
    unique.add(trimmed);
  }

  return [...unique];
}

async function fetchSearchData(
  query: string,
  signal?: AbortSignal,
): Promise<SearchData> {
  const params = new URLSearchParams({ limit: String(SEARCH_LIMIT) });
  const normalizedQuery = query.trim();

  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  }

  const res = await fetch(
    `/api/global-search?${params.toString()}`,
    signal ? { signal } : undefined,
  );

  if (!res.ok) {
    throw new Error("Failed to load global search data");
  }

  const body = (await res.json()) as Partial<SearchData>;

  return {
    tasks: body.tasks ?? [],
    contacts: body.contacts ?? [],
    meetings: body.meetings ?? [],
    decisions: body.decisions ?? [],
    goals: body.goals ?? [],
    labels: body.labels ?? [],
    reports: body.reports ?? [],
  };
}

export function useGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<SearchData | null>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((value) => {
          const next = !value;

          if (!next) {
            setQuery("");
          }

          return next;
        });
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);

    window.addEventListener("global-search:open", handler);
    return () => window.removeEventListener("global-search:open", handler);
  }, []);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchSearchData(query, controller.signal)
        .then((nextData) => {
          setData(nextData);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          setData(EMPTY_SEARCH_DATA);
        });
    }, QUERY_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [open, query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  return {
    open,
    setOpen,
    data,
    query,
    setQuery,
    navigate,
  };
}
