/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.10
 */

import "server-only";

import { TOOL_REGISTRY } from "@/lib/ai/tools/registry";
import type { SkillRecord } from "@/types/api";

const KNOWN_TOOL_NAMES = new Set(
  TOOL_REGISTRY.map((entry) => entry.function.name),
);

export const SKILL_SELECT = {
  id: true,
  name: true,
  description: true,
  instructionsMarkdown: true,
  allowedTools: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SkillRow = {
  id: string;
  name: string;
  description: string;
  instructionsMarkdown: string;
  allowedTools: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export function normalizeAllowedTools(toolNames: string[]): string[] {
  const cleaned = toolNames.map((name) => name.trim()).filter(Boolean);
  return [...new Set(cleaned)];
}

export function getUnknownToolNames(toolNames: string[]): string[] {
  return toolNames.filter((name) => !KNOWN_TOOL_NAMES.has(name));
}

export function toSkillRecord(row: SkillRow): SkillRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    instructionsMarkdown: row.instructionsMarkdown,
    allowedTools: parseAllowedTools(row.allowedTools),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseAllowedTools(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const names = value.filter(
    (item): item is string => typeof item === "string",
  );
  return normalizeAllowedTools(names);
}
