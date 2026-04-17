/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * SPDX-License-Identifier: Elastic-2.0
 */

import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import {
  authRateLimiter,
  createRateLimitResponse,
  getRateLimitIdentifier,
} from "@/lib/security";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(req: Request) {
  const identifier = getRateLimitIdentifier(req, "auth");
  const { allowed, retryAfterSeconds } = await authRateLimiter.check(identifier);

  if (!allowed) {
    return createRateLimitResponse(
      retryAfterSeconds,
      "Too many authentication attempts. Please try again later.",
    );
  }

  return handler.POST(req);
}
