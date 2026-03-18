/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { type ChatSource } from "@/types/chat";
import { type KnowledgeRetrievalChunk } from "@/lib/knowledge/retrieve.logic";

export function buildDocumentSources(
  chunks: KnowledgeRetrievalChunk[],
): ChatSource[] {
  const sourcesByDocument = new Map<string, ChatSource>();

  for (const chunk of chunks) {
    const key = chunk.documentId;
    const snippet = chunk.content.slice(0, 180);
    const existing = sourcesByDocument.get(key);

    if (!existing) {
      sourcesByDocument.set(key, {
        kind: "document",
        label: chunk.documentTitle,
        snippet,
      });
      continue;
    }

    if (!existing.snippet.includes(snippet)) {
      existing.snippet = `${existing.snippet}\n\n${snippet}`.slice(0, 380);
    }
  }

  return Array.from(sourcesByDocument.values());
}

export function buildProfileSource(lines: string[]): ChatSource[] {
  if (lines.length === 0) {
    return [];
  }

  return [
    {
      kind: "profile",
      label: "Personal info",
      snippet: lines.slice(0, 3).join(" | "),
    },
  ];
}

export function buildMeetingSources(input: {
  actionItems: Array<{
    title: string;
    status: string;
    assigneeName: string | null;
    dueAt: Date | null;
  }>;
  decisions: Array<{
    title: string;
    status: string;
    outcome: string | null;
    rationale: string | null;
  }>;
  meetings: Array<{
    title: string;
    objective: string | null;
    summary: string | null;
    status: string;
    nextSteps: string | null;
  }>;
}): ChatSource[] {
  const meetingSources = input.meetings.map((meeting) => ({
    kind: "meeting" as const,
    label: meeting.title,
    snippet:
      meeting.summary ??
      meeting.objective ??
      meeting.nextSteps ??
      meeting.status,
  }));

  const actionItemSources = input.actionItems.map((actionItem) => ({
    kind: "meeting" as const,
    label: actionItem.title,
    snippet: [
      `Action item status: ${actionItem.status}`,
      actionItem.assigneeName ? `Owner: ${actionItem.assigneeName}` : null,
      actionItem.dueAt ? `Due: ${actionItem.dueAt.toISOString()}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
  }));

  const decisionSources = input.decisions.map((decision) => ({
    kind: "meeting" as const,
    label: decision.title,
    snippet:
      decision.outcome ??
      decision.rationale ??
      `Decision status: ${decision.status}`,
  }));

  const mergedSources = new Map<string, ChatSource>();

  for (const source of [
    ...meetingSources,
    ...actionItemSources,
    ...decisionSources,
  ]) {
    const key = `${source.kind}:${source.label}`;
    const existing = mergedSources.get(key);

    if (!existing) {
      mergedSources.set(key, source);
      continue;
    }

    if (!existing.snippet.includes(source.snippet)) {
      existing.snippet = `${existing.snippet} | ${source.snippet}`.slice(
        0,
        380,
      );
    }
  }

  return Array.from(mergedSources.values());
}
