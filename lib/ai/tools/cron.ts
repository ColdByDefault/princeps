/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.11
 * @since canary-v1.1.11
 * @description Helper for running a tool from a cron job with the same
 * tracking parity as chat surfaces: dispatch via executeToolCall, record a
 * report with agent provenance, and accumulate token usage.
 *
 * Used by /api/cron/weekly-review and /api/cron/signal-feed so cron-triggered
 * agent runs surface in the same reports UI as user-triggered ones.
 */

import "server-only";

import { randomUUID } from "node:crypto";
import { executeToolCall } from "@/lib/ai/tools/executor";
import { accumulateTokens } from "@/lib/platform/tiers";
import { createReport } from "@/lib/features/reports";
import { getUserPreferences } from "@/lib/platform/settings/user-preferences.logic";
import type { ReportDetailCall } from "@/lib/features/reports";
import type { LLMToolCall } from "@/types/llm";
import type { AgentActionCall } from "@/lib/ai/agents/types";
import type { ActionResult } from "@/lib/ai/tools/types";

type AgentToolData = {
  agent?: string;
  summary?: string;
  agentCalls?: AgentActionCall[];
};

function truncate(text: string, max = 160): string {
  return text.length > max ? `${text.slice(0, max - 3)}…` : text;
}

function buildOuterRow(
  toolName: string,
  result: ActionResult,
): ReportDetailCall {
  if (!result.ok) {
    return {
      tool: toolName,
      ok: false,
      kv: { err: result.error ?? "unknown" },
    };
  }
  const data = result.data as AgentToolData | null | undefined;
  const kv: Record<string, unknown> = {};
  if (typeof data?.agent === "string") kv["agent"] = data.agent;
  if (typeof data?.summary === "string") kv["summary"] = truncate(data.summary);
  return { tool: toolName, ok: true, kv };
}

function buildInnerRows(
  agentName: string | undefined,
  result: ActionResult,
): ReportDetailCall[] {
  if (!result.ok) return [];
  const data = result.data as AgentToolData | null | undefined;
  const inner = data?.agentCalls ?? [];
  return inner.map((call) => {
    const kv: Record<string, unknown> = {};
    if (agentName) kv["agent"] = agentName;
    if (!call.result.ok) kv["err"] = call.result.error ?? "unknown";
    if (typeof call.toolName === "string" && call.args) {
      try {
        const parsed = JSON.parse(call.args) as Record<string, unknown>;
        if (typeof parsed["title"] === "string") kv["title"] = parsed["title"];
        if (typeof parsed["name"] === "string") kv["name"] = parsed["name"];
        if (typeof parsed["topic"] === "string") kv["topic"] = parsed["topic"];
      } catch {
        /* ignore */
      }
    }
    return { tool: call.toolName, ok: call.result.ok, kv };
  });
}

/**
 * Runs a single tool on behalf of a user from a cron job.
 * Builds a synthetic LLMToolCall, dispatches through executeToolCall, then
 * writes a report row (with agent provenance + flattened inner calls) and
 * accumulates approximate token usage. Both are fire-and-forget for tracking.
 */
export async function runToolFromCron(
  userId: string,
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<ActionResult> {
  const rawArgs = JSON.stringify(args);
  const toolCall: LLMToolCall = {
    id: randomUUID(),
    type: "function",
    function: { name: toolName, arguments: rawArgs },
  };

  const result = await executeToolCall(userId, toolCall);

  // Reports — gated by user preference
  try {
    const prefs = await getUserPreferences(userId);
    if (prefs.reportsEnabled !== false) {
      const outer = buildOuterRow(toolName, result);
      const agentName =
        typeof outer.kv["agent"] === "string"
          ? (outer.kv["agent"] as string)
          : undefined;
      const details: ReportDetailCall[] = [
        outer,
        ...buildInnerRows(agentName, result),
      ];
      const resultChars = result.ok
        ? JSON.stringify(result.data).length
        : (result.error?.length ?? 0);
      const approxTokens = Math.ceil((rawArgs.length + resultChars) / 4);
      await createReport(userId, {
        toolsCalled: details.map((d) => d.tool),
        toolCallCount: details.length,
        tokenUsage: approxTokens,
        details,
      });
    }
  } catch {
    /* fire-and-forget */
  }

  // Token accumulation — best-effort
  try {
    const resultChars = result.ok
      ? JSON.stringify(result.data).length
      : (result.error?.length ?? 0);
    await accumulateTokens(userId, 0, 0, rawArgs.length + resultChars);
  } catch {
    /* fire-and-forget */
  }

  return result;
}
