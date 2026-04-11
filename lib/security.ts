/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

import "server-only";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(identifier: string): Promise<RateLimitResult>;
}

// ---------------------------------------------------------------------------
// In-memory fallback — suitable for local dev and single-node deploys.
// Each instance keeps its own counters; not suitable for multi-instance or
// serverless. Automatically used when UPSTASH_REDIS_REST_URL is not set.
// ---------------------------------------------------------------------------
class InMemoryRateLimiter implements RateLimiter {
  private readonly requests = new Map<string, number[]>();
  private lastCleanupAt = Date.now();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
    private readonly cleanupIntervalMs: number = 5 * 60 * 1000,
  ) {}

  async check(identifier: string): Promise<RateLimitResult> {
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
      return { allowed: false, retryAfterSeconds };
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  private cleanup(now: number): void {
    for (const [identifier, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, valid);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Upstash (Redis-backed) limiter — production-grade, multi-instance safe.
// Used automatically when UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN environment variables are both present.
// ---------------------------------------------------------------------------
class UpstashRateLimiter implements RateLimiter {
  private readonly limiter: Ratelimit;

  constructor(limiter: Ratelimit) {
    this.limiter = limiter;
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const result = await this.limiter.limit(identifier);
    if (result.success) {
      return { allowed: true, retryAfterSeconds: 0 };
    }
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }
}

// ---------------------------------------------------------------------------
// Factory — returns Upstash limiter when env vars are present, otherwise
// falls back to in-memory.
// ---------------------------------------------------------------------------
function createRateLimiter(
  tokens: number,
  windowMs: number,
  upstashWindow: `${number} ${"s" | "m" | "h" | "d"}`,
): RateLimiter {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const redis = new Redis({ url, token });
    return new UpstashRateLimiter(
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(tokens, upstashWindow),
        analytics: false,
      }),
    );
  }

  return new InMemoryRateLimiter(windowMs, tokens);
}

export const chatRateLimiter = createRateLimiter(30, 60_000, "60 s");
export const searchRateLimiter = createRateLimiter(45, 60_000, "60 s");
export const uploadRateLimiter = createRateLimiter(10, 5 * 60_000, "5 m");
export const writeRateLimiter = createRateLimiter(30, 60_000, "60 s");
export const briefingRateLimiter = createRateLimiter(5, 60 * 60_000, "60 m");
export const prepRateLimiter = createRateLimiter(10, 60 * 60_000, "60 m");
export const authRateLimiter = createRateLimiter(10, 60_000, "60 s");

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
