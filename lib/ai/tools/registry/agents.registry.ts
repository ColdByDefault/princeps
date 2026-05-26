/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.11
 * @since canary-v1.1.11
 * @description Sub-agent tools — exposes each registered agent as an
 * LLM-callable tool. Replaces the standalone classifier pre-pass: the main
 * LLM now decides when to delegate work to a specialised agent based on the
 * tool descriptions below, the same way it picks any other tool.
 *
 * Each tool entry mirrors an AgentDefinition in lib/ai/agents/. The handler
 * (handlers/agents.handler.ts) invokes runAgent() so internal tool calls go
 * through the same executor and are tracked uniformly.
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const agentTools: ToolRegistryEntry[] = [
  {
    minTier: "pro",
    group: "agents",
    type: "function",
    function: {
      name: "run_weekly_review",
      description:
        "Run a structured weekly review for the user. Gathers open tasks, upcoming meetings, and active goals, then returns a concise executive digest. Use when the user explicitly asks to review their week, see a digest of current commitments, or get an overview of what they need to focus on. Do NOT pair with run_task_extractor — this tool only reads existing data and never creates new tasks.",
      parameters: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            description:
              "Optional area to emphasise in the digest (e.g. 'fundraising', 'next 3 days'). Leave empty for a balanced review.",
          },
        },
        required: [],
      },
    },
  },
  {
    minTier: "free",
    group: "agents",
    type: "function",
    function: {
      name: "run_task_extractor",
      description:
        "Extract action items from a block of unstructured text and create one task per item. ONLY use when the user pastes or dictates a free-form block of content (voice memo transcript, meeting notes, email body, brainstorm dump) that contains things to do. Do NOT use when the user asks to review, summarise, or query their existing tasks — those are read operations, not extraction. The text to process MUST be supplied in the `text` argument verbatim.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description:
              "The raw user-supplied content to extract action items from. Must be a substantive block of text, not a question or command about existing data.",
          },
        },
        required: ["text"],
      },
    },
  },
  {
    minTier: "free",
    group: "agents",
    type: "function",
    function: {
      name: "run_decision_logger",
      description:
        "Extract decisions from a block of meeting notes or recap text and log each one. ONLY use when the user provides text that describes decisions that were made or are pending. Do NOT use to query existing decisions — that is list_decisions. The text MUST be supplied in the `text` argument verbatim.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description:
              "The raw user-supplied content (meeting notes, recap, etc.) to extract decisions from.",
          },
        },
        required: ["text"],
      },
    },
  },
  {
    minTier: "pro",
    group: "agents",
    type: "function",
    function: {
      name: "run_signal_feed",
      description:
        "Search the web for recent signals, news, or developments on a topic and produce a scored intelligence digest, persisted to the knowledge base. Use when the user asks what is happening in a particular domain or requests an intelligence feed. Requires an explicit topic.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description:
              "The topic, domain, or query to scan for signals (e.g. 'EU AI Act enforcement', 'Series B fintech rounds').",
          },
        },
        required: ["topic"],
      },
    },
  },
  {
    minTier: "pro",
    group: "agents",
    type: "function",
    function: {
      name: "run_commitment_tracker",
      description:
        "Extract commitments and promises from meeting notes or conversation text and create follow-up tasks for each. ONLY use when the user supplies text describing what was promised, agreed, or assigned. Do NOT use for general task queries. The text MUST be supplied in the `text` argument verbatim.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description:
              "The raw meeting notes or conversation text to extract commitments from.",
          },
        },
        required: ["text"],
      },
    },
  },
];
