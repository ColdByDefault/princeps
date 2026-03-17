/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { z } from "zod";
import {
  KNOWLEDGE_DOCUMENT_PRIORITIES,
  KNOWLEDGE_DOCUMENT_STATUSES,
  KNOWLEDGE_SOURCE_TYPES,
  KNOWLEDGE_TIERS,
} from "@/types/knowledge";

export const knowledgeSourceTypeSchema = z.enum(KNOWLEDGE_SOURCE_TYPES);
export const knowledgeDocumentPrioritySchema = z.enum(
  KNOWLEDGE_DOCUMENT_PRIORITIES,
);
export const knowledgeDocumentStatusSchema = z.enum(
  KNOWLEDGE_DOCUMENT_STATUSES,
);
export const knowledgeTierSchema = z.enum(KNOWLEDGE_TIERS);

export const customFieldSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(500),
});

export const personalInfoInputSchema = z.object({
  fullName: z.string().trim().max(120).nullish(),
  dateOfBirth: z.string().trim().max(40).nullish(),
  phone: z.string().trim().max(50).nullish(),
  address: z.string().trim().max(240).nullish(),
  occupation: z.string().trim().max(120).nullish(),
  bio: z.string().trim().max(2_000).nullish(),
  customFields: z.array(customFieldSchema).max(25).optional(),
});

export const knowledgeDocumentListSelect = {
  id: true,
  title: true,
  fileName: true,
  mimeType: true,
  fileSizeBytes: true,
  sourceType: true,
  priority: true,
  status: true,
  charCount: true,
  chunkCount: true,
  embeddingChars: true,
  indexedAt: true,
  lastError: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const knowledgeDocumentDetailSelect = {
  ...knowledgeDocumentListSelect,
  textContent: true,
  tags: true,
} as const;
