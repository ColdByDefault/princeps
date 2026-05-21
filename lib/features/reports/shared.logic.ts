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

import type { ReportDetailCall } from "./schemas";

/** Client-safe shape of an AssistantReport row. */
export interface AssistantReportRecord {
  id: string;
  toolsCalled: string[];
  toolCallCount: number;
  tokenUsage: number;
  details: ReportDetailCall[];
  createdAt: string; // ISO string on the client
}

export const REPORT_SELECT = {
  id: true,
  toolsCalled: true,
  toolCallCount: true,
  tokenUsage: true,
  details: true,
  createdAt: true,
} as const;

type ReportRow = {
  id: string;
  toolsCalled: unknown;
  toolCallCount: number;
  tokenUsage: number;
  details: unknown;
  createdAt: Date;
};

export function toReportRecord(row: ReportRow): AssistantReportRecord {
  return {
    id: row.id,
    toolsCalled: Array.isArray(row.toolsCalled)
      ? (row.toolsCalled as string[])
      : [],
    toolCallCount: row.toolCallCount,
    tokenUsage: row.tokenUsage,
    details: Array.isArray(row.details)
      ? (row.details as ReportDetailCall[])
      : [],
    createdAt: row.createdAt.toISOString(),
  };
}
