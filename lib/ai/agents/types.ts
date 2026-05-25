/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.10
 * @since canary-v1.1.3
 * @description Shared types for the Princeps sub-agents system.
 */

import "server-only";

import type { Tier } from "@/types/billing";
import type { ActionResult } from "@/lib/ai/tools/types";

/**
 * Static definition for a sub-agent.
 * Registered in lib/agents/registry.ts — one entry per agent file.
 */
export type AgentDefinition = {
  /** Stable snake_case identifier (e.g. "task-extractor"). */
  name: string;
  /** Human-readable description used by the orchestrator to decide when to delegate. */
  description: string;
  /** Narrow, task-specific system prompt for this agent. */
  systemPrompt: string;
  /** Subset of tool names from lib/tools/registry.ts this agent is allowed to call. */
  tools: string[];
  /** Minimum tier required to invoke this agent. */
  minTier: Tier;
  /** Maximum tool-call rounds before the agent stops. Defaults to 3. */
  maxRounds?: number;
};

/**
 * Input passed to runner.ts when invoking a sub-agent.
 */
export type AgentInput = {
  userId: string;
  userMessage: string;
  /** Optional pre-built context string (e.g. system-prompt slot data). */
  context?: string;
};

/**
 * Optional runtime constraints supplied by the orchestrator.
 */
export type AgentRunOptions = {
  /** Optional runtime allow-list for tool names (e.g. active-skill intersection). */
  allowedToolNames?: string[];
};

/**
 * A single tool call captured during a sub-agent run.
 * Preserves the tool name, raw arguments, and result so the orchestrator
 * can reconstruct ReportDetailCall entries for the reports system.
 */
export type AgentActionCall = {
  toolName: string;
  args: string;
  result: ActionResult;
};

/**
 * Structured result returned by runner.ts to the orchestrator.
 */
export type AgentOutput = {
  ok: boolean;
  /** Concise result summary for the orchestrator to incorporate into its response. */
  summary: string;
  /** Full tool call records (name, args, result) performed during the run. */
  agentCalls?: AgentActionCall[];
  error?: string;
};
