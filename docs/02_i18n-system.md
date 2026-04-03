# i18n System

## Overview

Replaced the custom `getMessage()` / flat `MessageDictionary` system with **next-intl**. Locale is resolved at the edge and supplied to every server and client component via the Next.js `NextIntlClientProvider`.

---

## Locale Resolution Priority

1. **Cookie** (`akhiil-language`) — fastest path, used on every subsequent request
2. **DB user preference** — used for authenticated users whose cookie is absent (e.g. browser wipe); read in `i18n/request.ts` via `getUserPreferences()`
3. **`Accept-Language` header** — fallback for unauthenticated users without a cookie
4. **Default: `"de"`** — final fallback

---

## Key Files

| File                                     | Role                                                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `types/i18n.ts`                          | `SUPPORTED_LANGUAGES`, `AppLanguage`, `DEFAULT_LANGUAGE`, cookie/storage key constants, `isSupportedLanguage()` guard |
| `proxy.ts` (middleware)                  | Seeds the language cookie on first visit for unauthenticated visitors using `Accept-Language`                         |
| `i18n/request.ts`                        | `getRequestConfig()` — full resolution chain (cookie → DB → header → default)                                         |
| `messages/de.json`                       | German message strings (default locale)                                                                               |
| `messages/en.json`                       | English message strings                                                                                               |
| `components/shared/LanguageHydrator.tsx` | Client component that re-seeds the cookie after sign-in so subsequent requests hit the fast cookie path               |
| `components/shared/LanguageToggle.tsx`   | UI toggle — sets cookie and reloads                                                                                   |

---

## Message File Structure

Messages use **nested keys by namespace**. Do not use flat keys.

```json
{
  "common": { ... },
  "auth": { ... },
  "nav": { ... },
  "errors": { ... }
}
```

---

## Rules

- All user-facing UI strings go in both `messages/de.json` and `messages/en.json`.
- Technical text, logs, and internal validation errors stay in English only.
- Locale resolution is **decoupled from DB user preferences** at the middleware layer — the cookie is the source of truth at runtime. DB preference is only consulted during `getRequestConfig()` when the cookie is missing.
- Never hardcode user-facing copy directly in components.
