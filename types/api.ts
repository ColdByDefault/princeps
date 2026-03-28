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
