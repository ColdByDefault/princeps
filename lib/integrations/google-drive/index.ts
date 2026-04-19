/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import "server-only";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  buffer: Buffer,
) => Promise<{ text: string }>;

import { db } from "@/lib/db";
import { embedBatch } from "@/lib/llm-providers";
import { accumulateTokens, enforceKnowledgeUpload } from "@/lib/tiers/enforce";
import {
  chunkText,
  normalizeVector,
  EMBEDDING_DIM,
} from "@/lib/knowledge/shared.logic";
import { getDriveClient } from "./client";
import { markSynced } from "@/lib/integrations/shared/upsert";
import type { drive_v3 } from "googleapis";

// ─── Constants ────────────────────────────────────────────

/** Google Workspace MIME types and their plain-text export format. */
const EXPORTABLE_MIME_TYPES: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
  "application/vnd.google-apps.presentation": "text/plain",
};

const PDF_MIME_TYPE = "application/pdf";

/**
 * Maximum characters extracted from a single file.
 * Prevents one large document from exhausting the entire quota.
 */
const MAX_CHARS_PER_FILE = 100_000;

// ─── Types ────────────────────────────────────────────────

export interface DriveIndexResult {
  indexed: number;
  skipped: number;
  errors: number;
  quotaReached: boolean;
}

// ─── Main indexing function ───────────────────────────────

/**
 * Lists supported files in the user's Google Drive and indexes new or
 * changed files into the Knowledge Base (pgvector).
 *
 * Incremental: files already indexed and unchanged (by modifiedTime) are
 * skipped. Changed files are deleted and re-indexed.
 *
 * Call enforceKnowledgeUpload() is called per new file; tier limits apply.
 */
export async function indexDriveFiles(
  userId: string,
): Promise<DriveIndexResult> {
  const drive = await getDriveClient(userId);
  const result: DriveIndexResult = {
    indexed: 0,
    skipped: 0,
    errors: 0,
    quotaReached: false,
  };

  // ── 1. Fetch all supported files from Drive ──────────────
  const supportedMimeQuery = [
    ...Object.keys(EXPORTABLE_MIME_TYPES),
    PDF_MIME_TYPE,
  ]
    .map((m) => `mimeType='${m}'`)
    .join(" or ");

  let pageToken: string | undefined;
  const files: drive_v3.Schema$File[] = [];

  do {
    const resp = await drive.files.list({
      q: `(${supportedMimeQuery}) and trashed=false`,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
      pageSize: 100,
      ...(pageToken ? { pageToken } : {}),
    });
    files.push(...(resp.data.files ?? []));
    pageToken = resp.data.nextPageToken ?? undefined;
  } while (pageToken);

  // ── 2. Load existing Drive-sourced docs for deduplication ─
  const existingDocs = await db.knowledgeDocument.findMany({
    where: { userId, sourceType: "drive" },
    select: { id: true, sourceId: true, sourceUpdatedAt: true },
  });

  const existingByFileId = new Map(
    existingDocs.map((d) => [
      d.sourceId!,
      { id: d.id, sourceUpdatedAt: d.sourceUpdatedAt },
    ]),
  );

  // ── 3. Process each file ─────────────────────────────────
  for (const file of files) {
    if (!file.id || !file.name || !file.mimeType) {
      result.errors++;
      continue;
    }

    const existing = existingByFileId.get(file.id);
    const driveModifiedAt = file.modifiedTime
      ? new Date(file.modifiedTime)
      : null;

    // Skip if already indexed and the file has not changed
    if (existing) {
      const isUnchanged =
        driveModifiedAt &&
        existing.sourceUpdatedAt &&
        driveModifiedAt <= existing.sourceUpdatedAt;
      if (isUnchanged || !driveModifiedAt) {
        result.skipped++;
        continue;
      }
    }

    // ── Export / download file content ───────────────────
    let content: string;
    try {
      content = await extractFileContent(drive, file);
    } catch (err) {
      console.error(`[google-drive] Failed to extract "${file.name}":`, err);
      result.errors++;
      continue;
    }

    // Trim to max chars per file
    if (content.length > MAX_CHARS_PER_FILE) {
      content = content.slice(0, MAX_CHARS_PER_FILE);
    }

    const charCount = content.length;
    if (charCount < 50) {
      result.skipped++;
      continue;
    }

    // ── Tier enforcement ──────────────────────────────────
    // For re-indexed files: delete the old doc first so the slot is freed
    // before enforcement runs (avoids false "quota reached" on replace).
    if (existing) {
      await db.knowledgeDocument.delete({ where: { id: existing.id } });
    }

    // fileSizeBytes: use Drive metadata for PDFs, char count for others
    const fileSizeBytes = file.size ? parseInt(file.size, 10) : charCount;
    const enforcement = await enforceKnowledgeUpload(
      userId,
      fileSizeBytes,
      charCount,
    );
    if (!enforcement.allowed) {
      result.quotaReached = true;
      break;
    }

    // ── Chunk + embed + persist ───────────────────────────
    try {
      const chunks = chunkText(content);
      const rawVectors = await embedBatch(chunks);
      accumulateTokens(
        userId,
        chunks.reduce((s, c) => s + c.length, 0),
        0,
      ).catch(() => {});
      const vectors = rawVectors.map((v) => normalizeVector(v, EMBEDDING_DIM));

      await db.$transaction(
        async (tx) => {
          const doc = await tx.knowledgeDocument.create({
            data: {
              userId,
              name: file.name!,
              charCount,
              sourceType: "drive",
              sourceId: file.id!,
              sourceUpdatedAt: driveModifiedAt ?? new Date(),
            },
            select: { id: true },
          });

          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]!;
            const vector = vectors[i]!;
            const vectorLiteral = `[${vector.join(",")}]`;

            await tx.$executeRawUnsafe(
              `INSERT INTO "knowledge_chunk" ("id", "documentId", "userId", "content", "embedding", "chunkIndex", "createdAt")
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector(1536), $5, NOW())`,
              doc.id,
              userId,
              chunk,
              vectorLiteral,
              i,
            );
          }

          // Increment lifetime counters (never decremented)
          await tx.user.update({
            where: { id: userId },
            data: {
              knowledgeCharsUsed: { increment: charCount },
              knowledgeUploadsUsed: { increment: 1 },
            },
          });
        },
        { timeout: 30_000 },
      );

      result.indexed++;
    } catch (err) {
      console.error(`[google-drive] Failed to index "${file.name}":`, err);
      result.errors++;
    }
  }

  await markSynced(userId, "google_drive");
  return result;
}

// ─── File content extraction ──────────────────────────────

async function extractFileContent(
  drive: drive_v3.Drive,
  file: drive_v3.Schema$File,
): Promise<string> {
  const { id, name, mimeType } = file;

  const exportMime = EXPORTABLE_MIME_TYPES[mimeType!];
  if (exportMime) {
    // Google Workspace file — use the Drive export endpoint
    const resp = await drive.files.export(
      { fileId: id!, mimeType: exportMime },
      { responseType: "text" },
    );
    return typeof resp.data === "string" ? resp.data : String(resp.data);
  }

  if (mimeType === PDF_MIME_TYPE) {
    // Binary PDF — download and extract text with pdf-parse
    const resp = await drive.files.get(
      { fileId: id!, alt: "media" },
      { responseType: "arraybuffer" },
    );
    const buffer = Buffer.from(resp.data as ArrayBuffer);
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  throw new Error(`Unsupported MIME type: ${mimeType} for file "${name}"`);
}
