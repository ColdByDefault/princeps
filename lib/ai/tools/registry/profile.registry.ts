/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version canary-v1.1.3
 * @since beta
 */

import "server-only";

import type { ToolRegistryEntry } from "../types";

export const profileTools: ToolRegistryEntry[] = [
  {
    minTier: "free",
    group: "profile",
    type: "function",
    function: {
      name: "get_user_info",
      description:
        "Retrieve the current user's profile information: name, username, email, plan tier, role, timezone, and account creation date. Only use this when the user explicitly asks about their own account, profile, or plan details. Do not call this tool proactively or as part of unrelated workflows.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];
