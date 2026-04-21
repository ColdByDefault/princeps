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

import { createRequire } from "module";
const _require = createRequire(import.meta.url);
// pdf-parse is a CJS-only package; bypass Turbopack's ESM interop entirely
const pdfParse = _require("pdf-parse") as (
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

export interface DriveFileEntry {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  size: string | null;
  imported: boolean;
}

// ─── List files ───────────────────────────────────────────

/**
 * Fetches supported files from the user's Google Drive and returns them
 * with an `imported` flag indicating whether each file has already been
 * indexed into the Knowledge Base.
 *
 * Does NOT index anything — indexing is user-initiated via importDriveFile.
 */
export async function listDriveFiles(
  userId: string,
): Promise<DriveFileEntry[]> {
  const drive = await getDriveClient(userId);

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

  // Cross-reference with already-imported docs
  const existingDocs = await db.knowledgeDocument.findMany({
    where: { userId, sourceType: "drive" },
    select: { sourceId: true },
  });
  const importedIds = new Set(existingDocs.map((d) => d.sourceId!));

  await markSynced(userId, "google_drive");

  return files
    .filter((f) => f.id && f.name && f.mimeType)
    .map((f) => ({
      id: f.id!,
      name: f.name!,
      mimeType: f.mimeType!,
      modifiedTime: f.modifiedTime ?? null,
      size: f.size ?? null,
      imported: importedIds.has(f.id!),
    }));
}

// ─── Import single file ───────────────────────────────────

/**
 * Indexes a single Drive file chosen by the user into the Knowledge Base.
 * If the file was previously imported, the old record is replaced.
 */
export async function importDriveFile(
  userId: string,
  fileId: string,
): Promise<{ name: string }> {
  const drive = await getDriveClient(userId);

  const meta = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, modifiedTime, size",
  });
  const file = meta.data;

  if (!file.id || !file.name || !file.mimeType) {
    throw new Error("Invalid file metadata from Drive.");
  }

  let content: string;
  try {
    content = await extractFileContent(drive, file);
  } catch (err) {
    throw new Error(
      `Failed to extract content from "${file.name}": ${String(err)}`,
    );
  }

  if (content.length > MAX_CHARS_PER_FILE) {
    content = content.slice(0, MAX_CHARS_PER_FILE);
  }

  const charCount = content.length;
  if (charCount < 50) {
    throw new Error("File content is too short to index.");
  }

  // Delete existing record first so the quota slot is freed before enforcement
  const existing = await db.knowledgeDocument.findFirst({
    where: { userId, sourceType: "drive", sourceId: fileId },
    select: { id: true },
  });
  if (existing) {
    await db.knowledgeDocument.delete({ where: { id: existing.id } });
  }

  const fileSizeBytes = file.size ? parseInt(file.size, 10) : charCount;
  const enforcement = await enforceKnowledgeUpload(
    userId,
    fileSizeBytes,
    charCount,
  );
  if (!enforcement.allowed) {
    throw new Error(enforcement.reason ?? "Knowledge Base quota reached.");
  }

  const driveModifiedAt = file.modifiedTime
    ? new Date(file.modifiedTime)
    : new Date();
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
          sourceUpdatedAt: driveModifiedAt,
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

  return { name: file.name };
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
