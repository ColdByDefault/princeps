/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { z } from "zod";

// ─── Upload ───────────────────────────────────────────────

/**
 * Validated shape for knowledge document creation.
 * The file is received as raw text by the API route before this schema runs.
 */
export const createKnowledgeDocumentSchema = z.object({
  /** Original filename for display. Never used to access the file system. */
  name: z.string().min(1).max(255),
  /** Full text content of the file (already read by the route handler). */
  content: z.string().min(1),
});

export type CreateKnowledgeDocumentInput = z.infer<
  typeof createKnowledgeDocumentSchema
>;
