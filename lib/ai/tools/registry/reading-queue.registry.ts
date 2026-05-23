/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.4
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const readingQueueTools: ToolRegistryEntry[] = [
  {
    minTier: "pro",
    group: "reading-queue",
    type: "function",
    function: {
      name: "add_to_reading_queue",
      description:
        "Save a URL to the user's reading queue. The page is fetched, summarised by AI, and scored for relevance against the user's active goals. Use this when the user says 'save this for later', 'add to reading list', 'I want to read this', or shares a URL to save.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The full URL of the article or page to save.",
          },
          title: {
            type: "string",
            description:
              "Optional title override. If omitted, the AI will infer a title from the page content.",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    minTier: "pro",
    group: "reading-queue",
    type: "function",
    function: {
      name: "list_reading_queue",
      description:
        "List the user's reading queue items, optionally filtered by status. Items are ordered by relevance score (highest first). Use this when the user asks to see their reading list, what they have saved, or top-scored articles.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["unread", "read", "archived"],
            description:
              "Filter by reading status. Omit to return all items regardless of status.",
          },
        },
        required: [],
      },
    },
  },
  {
    minTier: "pro",
    group: "reading-queue",
    type: "function",
    function: {
      name: "mark_reading_item_read",
      description:
        "Mark a saved reading item as read. Use this when the user says they have read an article, finished it, or asks to mark it as done.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description:
              "The ID of the reading item to mark as read. Use list_reading_queue to find the ID first.",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    minTier: "pro",
    group: "reading-queue",
    type: "function",
    function: {
      name: "archive_reading_item",
      description:
        "Archive a reading item to remove it from the active queue without deleting it. Use when the user says to archive, dismiss, or set aside an article.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the reading item to archive.",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    minTier: "pro",
    group: "reading-queue",
    type: "function",
    function: {
      name: "delete_reading_item",
      description:
        "Permanently delete a reading item. Only call this after the user has explicitly confirmed they want to delete it, not just archive it.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The ID of the reading item to delete.",
          },
        },
        required: ["id"],
      },
    },
  },
];
