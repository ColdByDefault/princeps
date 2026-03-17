/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";

interface ChunkTextOptions {
  chunkSize?: number;
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP = 50;

export function chunkKnowledgeText(
  text: string,
  options?: ChunkTextOptions,
): string[] {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options?.overlap ?? DEFAULT_CHUNK_OVERLAP;
  const normalizedText = text.replace(/\r\n/g, "\n").trim();

  if (!normalizedText) {
    return [];
  }

  if (normalizedText.length <= chunkSize) {
    return [normalizedText];
  }

  const paragraphs = normalizedText.split(/\n{2,}/).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();

    if (!trimmedParagraph) {
      continue;
    }

    if (trimmedParagraph.length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      const sentences = splitSentences(trimmedParagraph);
      let sentenceBuffer = "";

      for (const sentence of sentences) {
        if (sentence.length > chunkSize) {
          if (sentenceBuffer) {
            chunks.push(sentenceBuffer.trim());
            sentenceBuffer = "";
          }

          chunks.push(...hardCutText(sentence, chunkSize));
          continue;
        }

        const nextBuffer = sentenceBuffer
          ? `${sentenceBuffer} ${sentence}`
          : sentence;

        if (nextBuffer.length > chunkSize) {
          chunks.push(sentenceBuffer.trim());
          sentenceBuffer = sentence;
        } else {
          sentenceBuffer = nextBuffer;
        }
      }

      if (sentenceBuffer) {
        chunks.push(sentenceBuffer.trim());
      }

      continue;
    }

    const nextChunk = currentChunk
      ? `${currentChunk}\n\n${trimmedParagraph}`
      : trimmedParagraph;

    if (nextChunk.length > chunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedParagraph;
    } else {
      currentChunk = nextChunk;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  if (overlap <= 0 || chunks.length <= 1) {
    return chunks;
  }

  return chunks.map((chunk, index) => {
    if (index === 0) {
      return chunk;
    }

    const overlapText = chunks[index - 1].slice(-overlap);

    return `${overlapText} ${chunk}`.trim();
  });
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);

  return matches
    ? matches.map((value) => value.trim()).filter(Boolean)
    : [text];
}

function hardCutText(text: string, maxLength: number): string[] {
  const result: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    let cutIndex = remaining.lastIndexOf(" ", maxLength);

    if (cutIndex <= 0) {
      cutIndex = maxLength;
    }

    result.push(remaining.slice(0, cutIndex).trim());
    remaining = remaining.slice(cutIndex).trim();
  }

  if (remaining) {
    result.push(remaining);
  }

  return result;
}
