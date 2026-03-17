/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import { NextResponse } from "next/server";

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}
/* NEED TO ADJUST/UPDATE/IMPROVE */
/**
 * In-memory rate limiting is acceptable for local development and single-node
 * deployments, but it is not production-grade for multi-instance or serverless
 * environments.
 *
 * Why this is limited:
 * - Each instance keeps its own counter state, so limits are enforced per node,
 *   not globally.
 * - Serverless cold starts reset the counters.
 * - Parallel requests may hit different instances and bypass the intended limit.
 *
 * In practice, a limit like 30 requests per minute can become roughly 90 per
 * minute across 3 instances because each instance tracks requests separately.
 *
 * Keep this implementation as a lightweight fallback for development or simple
 * self-hosted setups. For real production enforcement, replace it with a
 * distributed limiter backed by shared storage such as Redis or Upstash.
 */
export class InMemoryRateLimiter {
  private readonly requests = new Map<string, number[]>();
  private lastCleanupAt = Date.now();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
    private readonly cleanupIntervalMs: number = 5 * 60 * 1000,
  ) {}

  check(identifier: string): RateLimitResult {
    const now = Date.now();

    if (now - this.lastCleanupAt >= this.cleanupIntervalMs) {
      this.cleanup(now);
      this.lastCleanupAt = now;
    }

    const existing = this.requests.get(identifier) ?? [];
    const validRequests = existing.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = validRequests[0];
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((this.windowMs - (now - oldestRequest)) / 1000),
      );

      this.requests.set(identifier, validRequests);

      return {
        allowed: false,
        retryAfterSeconds,
      };
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  private cleanup(now: number): void {
    for (const [identifier, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter(
        (time) => now - time < this.windowMs,
      );

      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

export const chatRateLimiter = new InMemoryRateLimiter(60_000, 30);
export const searchRateLimiter = new InMemoryRateLimiter(60_000, 45);
export const uploadRateLimiter = new InMemoryRateLimiter(5 * 60_000, 10);
export const writeRateLimiter = new InMemoryRateLimiter(60_000, 30);

export function getRateLimitIdentifier(
  req: Request,
  fallbackIdentifier: string,
): string {
  const forwardedFor = req.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const ipAddress = forwardedFor || realIp || "unknown";

  return `${fallbackIdentifier}:${ipAddress}`;
}

export function createRateLimitResponse(
  retryAfterSeconds: number,
  message = "Too many requests",
) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

export function normalizeOptionalText(
  value: string | null | undefined,
  maxLength: number,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\u0000/g, "").trim();

  return normalized.length > 0 ? normalized.slice(0, maxLength) : null;
}

export function normalizeTagList(
  tags: string[] | null | undefined,
  maxTags = 12,
  maxTagLength = 32,
): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seen = new Set<string>();
  const normalizedTags: string[] = [];

  for (const tag of tags) {
    if (typeof tag !== "string") {
      continue;
    }

    const normalizedTag = tag.trim().toLowerCase().slice(0, maxTagLength);

    if (!normalizedTag || seen.has(normalizedTag)) {
      continue;
    }

    seen.add(normalizedTag);
    normalizedTags.push(normalizedTag);

    if (normalizedTags.length >= maxTags) {
      break;
    }
  }

  return normalizedTags;
}
