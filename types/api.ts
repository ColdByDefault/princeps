/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

export interface ApiErrorResponse {
  error: string;
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
  createdAt: string; // ISO string on the client
}

/** Client-safe shape of the PersonalInfo fields map. */
export type PersonalInfoFields = Record<string, string | number | null>;

/** Client-safe shape of a Contact record. */
export interface ContactRecord {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  lastContact: string | null; // ISO string on the client
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
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
  googleEventId: string | null;
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
  participants: MeetingParticipantRecord[];
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
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}

/** Client-safe shape of a Label record. */
export interface LabelRecord {
  id: string;
  name: string;
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
}
