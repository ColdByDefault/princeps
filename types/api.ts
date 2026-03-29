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
  status: string; // "upcoming" | "done" | "cancelled"
  createdAt: string; // ISO string on the client
  updatedAt: string; // ISO string on the client
  participants: MeetingParticipantRecord[];
}
