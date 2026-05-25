/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.4
 */

import type { Tier } from "@/types/billing";

export interface ApiErrorResponse {
  error: string;
}

/** Compact key-value entry inside a report detail. */
export interface ReportDetailCall {
  tool: string;
  ok: boolean;
  kv: Record<string, unknown>;
}

/** Client-safe shape of an AssistantReport record. */
export interface AssistantReportRecord {
  id: string;
  toolsCalled: string[];
  toolCallCount: number;
  tokenUsage: number;
  details: ReportDetailCall[];
  createdAt: string; // ISO string on the client
}

/** One entry in the tool frequency breakdown. */
export interface ToolFrequencyEntry {
  tool: string;
  count: number;
}

/** Aggregated tool-call frequency data for the reports page. */
export interface ToolFrequencyData {
  top: ToolFrequencyEntry[];
  total: number;
  sessionCount: number;
}

/** Client-safe shape of a Notification record (matches the Prisma model). */
export interface NotificationRecord {
  id: string;
  userId: string;
  category: string;
  source: string;
  title: string;
  body: string;
  read: boolean;
  dismissed: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string; // ISO string on the client
}

/** Client-safe shape of a KnowledgeDocument (no chunks, no embeddings). */
export interface KnowledgeDocumentRecord {
  id: string;
  name: string;
  charCount: number;
  sourceType: string | null; // "drive" | null (manual upload)
  labels: LabelOptionRecord[];
  createdAt: string; // ISO string on the client
}

/** Client-safe shape of a lightweight label reference. */
export interface LabelOptionRecord {
  id: string;
  name: string;
  color: string;
  icon?: string | null;
}

/**
 * Serialisable entry passed from the settings server page to ToolsTab.
 * Carries only what the client needs — no function schemas.
 */
export interface ToolDisplayEntry {
  name: string;
  minTier: Tier;
  group: string;
}

/** Client-safe shape of a Contact record. */
export interface ContactRecord {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  labels: LabelOptionRecord[];
  lastContact: string | null; // ISO string on the client
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}

/** Client-safe shape of a manual contact interaction note. */
export interface ContactNoteRecord {
  id: string;
  userId: string;
  contactId: string;
  type: string; // "call" | "email" | "meeting" | "note"
  note: string;
  date: string; // ISO string on the client
  createdAt: string; // ISO string on the client
}

/** Client-safe shape of a meeting participant. */
export interface MeetingParticipantRecord {
  id: string;
  contactId: string;
  contactName: string;
}

/** Client-safe shape of a Meeting record. */
export interface MeetingRecord {
  id: string;
  title: string;
  scheduledAt: string; // ISO string on the client
  durationMin: number | null;
  location: string | null;
  agenda: string | null;
  summary: string | null;
  prepPack: string | null;
  status: string; // "upcoming" | "done" | "cancelled"
  kind: string; // "meeting" | "appointment"
  source: string; // "manual" | "llm" | "google_calendar" | "microsoft_outlook" | ...
  googleEventId: string | null;
  labels: LabelOptionRecord[];
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
  participants: MeetingParticipantRecord[];
  tasks: { id: string; title: string; status: string }[];
}

/** Client-safe shape of a Task record. */
export interface TaskRecord {
  id: string;
  title: string;
  notes: string | null;
  status: string; // "open" | "in_progress" | "done" | "cancelled"
  priority: string; // "low" | "normal" | "high" | "urgent"
  dueDate: string | null; // ISO string on the client
  meetingId: string | null;
  meetingTitle: string | null;
  delegatedTo: string | null;
  delegatedAt: string | null; // ISO string on the client
  delegateNotes: string | null;
  goals: { id: string; title: string }[];
  labels: LabelOptionRecord[];
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}

/** Client-safe shape of a Decision record. */
export interface DecisionRecord {
  id: string;
  title: string;
  rationale: string | null;
  outcome: string | null;
  status: string; // "open" | "decided" | "reversed"
  decidedAt: string | null; // ISO string on the client
  meetingId: string | null;
  meetingTitle: string | null;
  labels: LabelOptionRecord[];
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}

/** Client-safe shape of a Label record. */
export interface LabelRecord extends LabelOptionRecord {
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}

/** Client-safe shape of a Skill record. */
export interface SkillRecord {
  id: string;
  name: string;
  description: string;
  instructionsMarkdown: string;
  allowedTools: string[];
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}

/** Client-safe shape of a Goal milestone. */
export interface MilestoneRecord {
  id: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}

/** Client-safe shape of a Goal record. */
export interface GoalRecord {
  id: string;
  title: string;
  description: string | null;
  status: string; // "open" | "in_progress" | "done" | "cancelled"
  targetDate: string | null; // ISO string on the client
  meetingId: string | null;
  milestones: MilestoneRecord[];
  tasks: { id: string; title: string; status: string }[];
  labels: LabelOptionRecord[];
  stakeholders: StakeholderRecord[];
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}

/** Client-safe shape of a StakeholderEntry record. */
export interface StakeholderRecord {
  id: string;
  goalId: string | null;
  contactId: string;
  contactName: string;
  role: string | null; // "sponsor" | "blocker" | "champion" | "neutral" | custom
  health: string; // "warm" | "neutral" | "cold"
  notes: string | null;
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}

/** Client-safe shape of a MemoryEntry record. */
export interface MemoryEntryRecord {
  id: string;
  key: string;
  value: string;
  source: string; // "llm" | "user"
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}

/** Client-safe shape of a BriefingCache record. */
export interface BriefingRecord {
  id: string;
  content: string;
  generatedAt: string; // ISO string on the client
}

/** Client-safe shape of a ReadingItem record. */
export interface ReadingItemRecord {
  id: string;
  url: string;
  title: string | null;
  aiSummary: string | null;
  relevanceScore: number | null; // 0–1
  status: string; // "unread" | "read" | "archived"
  addedAt: string; // ISO string on the client
  readAt: string | null; // ISO string on the client
  updatedAt: string; // ISO string on the client
}
