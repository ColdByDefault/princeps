/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

import { PDFParse } from "pdf-parse";
import {
  isKnowledgeSourceType,
  type KnowledgeSourceType,
} from "@/types/knowledge";

export async function extractKnowledgeText(
  sourceType: string,
  buffer: Buffer,
): Promise<string> {
  if (!isKnowledgeSourceType(sourceType)) {
    throw new Error("Unsupported knowledge source type");
  }

  return extractBySourceType(sourceType, buffer);
}

async function extractBySourceType(
  sourceType: KnowledgeSourceType,
  buffer: Buffer,
) {
  switch (sourceType) {
    case "pdf":
      return extractPdfText(buffer);
    case "text":
      return extractPlainText(buffer);
    case "markdown":
      return extractMarkdownText(buffer);
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();

  return result.text.trim();
}

async function extractPlainText(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8").trim();
}

async function extractMarkdownText(buffer: Buffer): Promise<string> {
  const rawText = buffer.toString("utf-8");

  return rawText
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, (value) => value.replace(/`/g, ""))
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
