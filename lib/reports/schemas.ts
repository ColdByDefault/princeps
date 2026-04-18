/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

import { z } from "zod";

/** A single key-value entry inside a report detail item. */
export const reportKVSchema = z.record(z.string(), z.unknown());

/** Per-tool-call detail entry stored in AssistantReport.details. */
export const reportDetailCallSchema = z.object({
  tool: z.string(),
  ok: z.boolean(),
  kv: reportKVSchema,
});

export type ReportDetailCall = z.infer<typeof reportDetailCallSchema>;

/** Input for creating a new report (called from stream routes, never from user). */
export const createReportSchema = z.object({
  toolsCalled: z.array(z.string()),
  toolCallCount: z.number().int().min(0),
  tokenUsage: z.number().int().min(0),
  details: z.array(reportDetailCallSchema),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
