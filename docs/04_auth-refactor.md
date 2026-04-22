# Auth Refactor

> Important: This document is a work in progress and may not reflect the final implementation. It is intended to provide an overview of the new auth system architecture and key files, but details are subject to change as development progresses. Please refer to the latest codebase for the most up-to-date information.

## Overview

Auth is powered by **Better Auth** with a Prisma/PostgreSQL adapter. The refactor added Zod validation, in-memory rate limiting, and a password-confirmation step to the sign-up flow.

---

## Validation (`lib/auth/auth-schemas.ts`)

All auth inputs are validated with Zod before any DB or auth library call.

| Schema         | Fields                                                     | Key rules                                                                                                                      |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `signUpSchema` | `name`, `username`, `email`, `password`, `confirmPassword` | name 2–100 chars; username 3–30 chars, alphanumeric/underscore/dot only; valid email; password ≥ 8 chars; passwords must match |
| `signInSchema` | `email`, `password`                                        | valid email; password ≥ 8 chars                                                                                                |

---

## Rate Limiting (`lib/security.ts`)

`InMemoryRateLimiter` — sliding-window, per-identifier.

| Constructor args          | Default cleanup interval |
| ------------------------- | ------------------------ |
| `windowMs`, `maxRequests` | 5 minutes                |

**Limitations (documented in source):**

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
| Plugins            | `username` — enforces uniqueness, 3–30 chars, alphanumeric/underscore/dot   |

The `username` plugin intercepts `/sign-up/email` server-side to validate length, character rules, and uniqueness before the user record is created. It also adds a `username` field (unique, nullable) to the `user` table and exposes a `/sign-in/username` endpoint for future use.

---

## Key Files

| File                             | Role                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| `lib/auth/auth.ts`               | Better Auth instance + session/user config + username plugin |
| `lib/auth/auth-schemas.ts`       | Zod schemas for sign-up and sign-in                          |
| `lib/auth/auth-client.ts`        | Client-side Better Auth helpers (includes `usernameClient`)  |
| `lib/security.ts`                | `InMemoryRateLimiter`                                        |
| `app/api/auth/[...all]/route.ts` | Better Auth catch-all handler                                |
| `components/auth/LoginCard.tsx`  | Sign-in form                                                 |
| `components/auth/SignUpCard.tsx` | Sign-up form (includes username + confirm-password fields)   |

---

## Auth Route Pattern

1. Validate request body with the relevant Zod schema — return `400` on failure.
2. Check rate limiter — return `429` on breach.
3. Delegate to Better Auth.
