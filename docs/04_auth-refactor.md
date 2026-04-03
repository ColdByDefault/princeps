# Auth Refactor

## Overview

Auth is powered by **Better Auth** with a Prisma/PostgreSQL adapter. The refactor added Zod validation, in-memory rate limiting, and a password-confirmation step to the sign-up flow.

---

## Validation (`lib/auth/auth-schemas.ts`)

All auth inputs are validated with Zod before any DB or auth library call.

| Schema         | Fields                                         | Key rules                                                               |
| -------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `signUpSchema` | `name`, `email`, `password`, `confirmPassword` | name 2–100 chars; valid email; password ≥ 8 chars; passwords must match |
| `signInSchema` | `email`, `password`                            | valid email; password ≥ 8 chars                                         |

---

## Rate Limiting (`lib/security.ts`)

`InMemoryRateLimiter` — sliding-window, per-identifier.

| Constructor args          | Default cleanup interval |
| ------------------------- | ------------------------ |
| `windowMs`, `maxRequests` | 5 minutes                |

**Limitations (documented in source):**

- Per-process state — not safe for multi-instance or serverless deployments.
- Production use requires a distributed limiter (Redis / Upstash).

Rate limiters are instantiated per-route at module level (singleton per process).

---

## Better Auth Configuration (`lib/auth/auth.ts`)

| Setting            | Value                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| DB adapter         | Prisma (PostgreSQL)                                                         |
| Email + password   | Enabled; min password length 8                                              |
| Session expiry     | 3 days                                                                      |
| Session refresh    | Refresh if older than 1 day                                                 |
| Custom user fields | `timezone` (UTC), `preferences` (JSON string), `role` (user), `tier` (free) |

---

## Key Files

| File                             | Role                                           |
| -------------------------------- | ---------------------------------------------- |
| `lib/auth/auth.ts`               | Better Auth instance + session/user config     |
| `lib/auth/auth-schemas.ts`       | Zod schemas for sign-up and sign-in            |
| `lib/auth/auth-client.ts`        | Client-side Better Auth helpers                |
| `lib/security.ts`                | `InMemoryRateLimiter`                          |
| `app/api/auth/[...all]/route.ts` | Better Auth catch-all handler                  |
| `components/auth/LoginCard.tsx`  | Sign-in form                                   |
| `components/auth/SignUpCard.tsx` | Sign-up form (includes confirm-password field) |

---

## Auth Route Pattern

1. Validate request body with the relevant Zod schema — return `400` on failure.
2. Check rate limiter — return `429` on breach.
3. Delegate to Better Auth.
