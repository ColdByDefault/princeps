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

type TaskItem = { id: string; title: string; labels: LabelItem[] };
type ContactItem = {
  id: string;
  name: string;
  company: string | null;
  labels: LabelItem[];
};
type MeetingItem = { id: string; title: string; labels: LabelItem[] };
type DecisionItem = { id: string; title: string; labels: LabelItem[] };
type GoalItem = { id: string; title: string; labels: LabelItem[] };
type ReportItem = {
  id: string;
  createdAt: string;
  toolsCalled: string[];
  detailTools: string[];
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

async function fetchSearchData(): Promise<SearchData> {
  const res = await fetch("/api/global-search");

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
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((value) => !value);
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
    if (!open || data !== null) return;

    void fetchSearchData()
      .then((nextData) => {
        setData(nextData);
      })
      .catch(() => {
        setData(EMPTY_SEARCH_DATA);
      });
  }, [open, data]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return {
    open,
    setOpen,
    data,
    navigate,
  };
}
