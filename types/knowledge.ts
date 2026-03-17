/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

export const KNOWLEDGE_SOURCE_TYPES = ["pdf", "text", "markdown"] as const;
export const KNOWLEDGE_DOCUMENT_PRIORITIES = ["low", "medium", "high"] as const;
export const KNOWLEDGE_DOCUMENT_STATUSES = [
  "processing",
  "ready",
  "failed",
] as const;
export const KNOWLEDGE_TIERS = ["free", "pro", "premium"] as const;

export type KnowledgeSourceType = (typeof KNOWLEDGE_SOURCE_TYPES)[number];
export type KnowledgeDocumentPriority =
  (typeof KNOWLEDGE_DOCUMENT_PRIORITIES)[number];
export type KnowledgeDocumentStatus =
  (typeof KNOWLEDGE_DOCUMENT_STATUSES)[number];
export type KnowledgeTier = (typeof KNOWLEDGE_TIERS)[number];

export interface KnowledgeUsageSnapshot {
  activeDocuments: number;
  uploadCountUsed: number;
  embeddingCharsUsed: number;
  embeddingCharsLimit: number;
  maxDocuments: number;
  maxUploadBytes: number;
  tier: KnowledgeTier;
}

export interface KnowledgeDocumentListItem {
  id: string;
  title: string;
  fileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  sourceType: KnowledgeSourceType;
  priority: KnowledgeDocumentPriority;
  status: KnowledgeDocumentStatus;
  charCount: number;
  chunkCount: number;
  embeddingChars: number;
  indexedAt: Date | string | null;
  lastError: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CustomField {
  label: string;
  value: string;
}

export interface PersonalInfoInput {
  fullName?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  address?: string | null;
  occupation?: string | null;
  bio?: string | null;
  customFields?: CustomField[];
}

export interface PersonalInfoRecord {
  fullName: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
  occupation: string | null;
  bio: string | null;
  customFields: CustomField[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface KnowledgeDocumentDetail extends KnowledgeDocumentListItem {
  tags: string[];
  textContent: string;
}

export function isKnowledgeSourceType(
  value: string | null | undefined,
): value is KnowledgeSourceType {
  return KNOWLEDGE_SOURCE_TYPES.includes(value as KnowledgeSourceType);
}

export function isKnowledgeDocumentPriority(
  value: string | null | undefined,
): value is KnowledgeDocumentPriority {
  return KNOWLEDGE_DOCUMENT_PRIORITIES.includes(
    value as KnowledgeDocumentPriority,
  );
}

export function isKnowledgeTier(
  value: string | null | undefined,
): value is KnowledgeTier {
  return KNOWLEDGE_TIERS.includes(value as KnowledgeTier);
}
