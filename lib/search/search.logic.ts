/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { db } from "@/lib/db";

export type SearchResultType =
  | "contact"
  | "meeting"
  | "task"
  | "decision"
  | "knowledge";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string | null;
  href: string;
}

const PER_TYPE = 5;

/**
 * Full-workspace text search across contacts, meetings, tasks, decisions,
 * and knowledge documents. Returns up to PER_TYPE results per category.
 */
export async function searchWorkspace(
  userId: string,
  query: string,
): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const ilike = { contains: q, mode: "insensitive" as const };

  const [contacts, meetings, tasks, decisions, knowledge] = await Promise.all([
    db.contact.findMany({
      where: {
        userId,
        OR: [
          { name: ilike },
          { role: ilike },
          { company: ilike },
          { email: ilike },
        ],
      },
      select: { id: true, name: true, role: true, company: true },
      take: PER_TYPE,
      orderBy: { name: "asc" },
    }),

    db.meeting.findMany({
      where: {
        userId,
        OR: [{ title: ilike }, { agenda: ilike }, { summary: ilike }],
      },
      select: { id: true, title: true, scheduledAt: true },
      take: PER_TYPE,
      orderBy: { scheduledAt: "desc" },
    }),

    db.task.findMany({
      where: {
        userId,
        OR: [{ title: ilike }, { notes: ilike }],
      },
      select: { id: true, title: true, status: true, priority: true },
      take: PER_TYPE,
      orderBy: { createdAt: "desc" },
    }),

    db.decision.findMany({
      where: {
        userId,
        OR: [{ title: ilike }, { rationale: ilike }, { outcome: ilike }],
      },
      select: { id: true, title: true, status: true },
      take: PER_TYPE,
      orderBy: { createdAt: "desc" },
    }),

    db.knowledgeDocument.findMany({
      where: {
        userId,
        name: ilike,
      },
      select: { id: true, name: true },
      take: PER_TYPE,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const results: SearchResult[] = [];

  for (const c of contacts) {
    results.push({
      id: c.id,
      type: "contact",
      title: c.name,
      subtitle: [c.role, c.company].filter(Boolean).join(" · ") || null,
      href: `/contacts/${c.id}`,
    });
  }

  for (const m of meetings) {
    results.push({
      id: m.id,
      type: "meeting",
      title: m.title,
      subtitle: m.scheduledAt
        ? m.scheduledAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : null,
      href: `/meetings/${m.id}`,
    });
  }

  for (const t of tasks) {
    results.push({
      id: t.id,
      type: "task",
      title: t.title,
      subtitle: [t.status, t.priority].filter(Boolean).join(" · ") || null,
      href: `/tasks/${t.id}`,
    });
  }

  for (const d of decisions) {
    results.push({
      id: d.id,
      type: "decision",
      title: d.title,
      subtitle: d.status ?? null,
      href: `/decisions/${d.id}`,
    });
  }

  for (const k of knowledge) {
    results.push({
      id: k.id,
      type: "knowledge",
      title: k.name,
      subtitle: null,
      href: `/knowledge`,
    });
  }

  return results;
}
