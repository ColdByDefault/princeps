/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
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
        "Retrieve the current user's profile information: name, username, email, plan tier, role, timezone, and account creation date. Use this when the user asks about their own account, profile, or plan details.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];
