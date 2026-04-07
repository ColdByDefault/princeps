---
description: "Complete implementation reference for C-Sweet features. The canonical template for every new feature and the correctness benchmark for all existing ones. Supersedes docs/06_feature-refactor.md and docs/10_feature-audit.md."
name: "C-Sweet Feature Implementation"
applyTo: "app/**/*, components/**/*, lib/**/*, types/**"
---

# C-Sweet Feature Implementation Reference

> **Status:** Live — April 2026
> **Supersedes:** `docs/06_feature-refactor.md`, `docs/10_feature-audit.md`
> Use this file as the template for every new feature and as the correctness benchmark for all existing ones.

---

## Full-Stack Layer Map

A complete feature spans nine layers. Every layer has a contract; nothing bleeds into the wrong one.

```
prisma/schema.prisma               1. Data model
lib/<feature>/                     2. Server logic (Zod + DB)
  schemas.ts
  shared.logic.ts
  create.logic.ts
  list.logic.ts
  update.logic.ts
  delete.logic.ts
app/api/<feature>/                 3. REST API routes (thin handlers)
  route.ts                            GET + POST
  [id]/route.ts                       PATCH + DELETE
lib/tools/                         4. LLM tool layer (feature-agnostic)
  registry.ts                         Tool schemas (OpenAI format) + minTier
  types.ts                            ActionResult + ToolHandler types
  executor.ts                         Thin dispatcher — never edited for new features
  resolvers.ts                        Shared name→ID helpers
  handlers/<feature>.handler.ts       One file per feature domain
lib/context/<feature>.slot.ts      5. LLM system-prompt context slot
components/<feature>/              6. Client UI
  index.ts                            Barrel exports
  <Feature>Shell.tsx                  Full page: list + filters + empty state
  <Feature>Card.tsx                   Single-item card
  Create<Feature>Dialog.tsx           Create form in Dialog
  Edit<Feature>Dialog.tsx             Edit form in Dialog
  logic/
    use<Feature>Mutations.ts          All API calls + loading state + toasts
app/(app)/<feature>/page.tsx       7. Server page (auth + data fetch + pass to shell)
messages/{en,de}.json              8. i18n strings (both locales)
lib/tiers/enforce.ts               9. Tier enforcement (if quota-gated)
```

---

## 1. Prisma Schema — `prisma/schema.prisma`

- IDs: `@default(cuid())`
- Timestamps: `@default(now())` + `@updatedAt`
- All models and fields use `@map("snake_case")` / `@@map("snake_case")`
- Add `@@index` on any `userId` or foreign-key column queried in lists
- Fixed-value fields (status, priority) → Prisma enums
- Many-to-many join tables (`LabelOn<Feature>`) → composite `@@id`

After editing:

```bash
npx prisma db push
npx prisma generate
```

Restart the dev server after `generate` — the running process won't pick up the new client.

---

## 2. Server Logic — `lib/<feature>/`

All files must start with `import "server-only"`.

### `schemas.ts`

Zod validators only — no DB imports, no business logic.

```ts
import { z } from "zod";

export const createFeatureSchema = z.object({
  title: z.string().min(1).max(255),
  notes: z.string().max(4000).optional(),
});

export const updateFeatureSchema = createFeatureSchema.partial();

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
```

### `shared.logic.ts`

Holds the Prisma `select` object and the DB-row → client-type mapper. Imported by every other logic file.

```ts
import "server-only";
import type { FeatureRecord } from "@/types/api";

export const FEATURE_SELECT = {
  id: true,
  title: true,
  // …all fields
  labelLinks: {
    select: { label: { select: { id: true, name: true, color: true } } },
  },
} as const;

type FeatureRow = {
  /* mirrors FEATURE_SELECT */
};

export function toFeatureRecord(row: FeatureRow): FeatureRecord {
  return {
    ...row,
    labels: row.labelLinks.map((l) => l.label),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
```

### `create.logic.ts` / `list.logic.ts` / `update.logic.ts` / `delete.logic.ts`

Each does one thing. All accept `userId` as the first parameter (auth is handled by the caller).

**Single round-trip rule:**

```ts
// ✅ update — userId in where; .catch(() => null) handles not-found
const row = await db.feature.update({
  where: { id, userId },
  data: { ... },
  select: FEATURE_SELECT,
}).catch(() => null);
if (!row) return { ok: false, notFound: true };

// ✅ delete — deleteMany returns count; 0 = not found
const { count } = await db.feature.deleteMany({ where: { id, userId } });
return { ok: count > 0 };

// ❌ wrong — two round trips
const existing = await db.feature.findFirst({ where: { id, userId } });
if (!existing) return { ok: false };
await db.feature.delete({ where: { id } });
```

**`exactOptionalPropertyTypes` pattern:**

```ts
// ✅ build filter conditionally
const filter = status ? { status } : {};
await listFeatures(userId, filter);

// ❌ rejected by TS strict mode
await listFeatures(userId, { status }); // status may be undefined
```

---

## 3. API Routes — `app/api/<feature>/`

**`route.ts`** — handles `GET` (list) and `POST` (create).
**`[id]/route.ts`** — handles `PATCH` (update) and `DELETE`.

Pattern:

1. Auth via `auth.api.getSession({ headers: await headers() })` — return `401` if no session.
2. Rate-limit writes via `writeRateLimiter`/`getRateLimitIdentifier`/`createRateLimitResponse` from `@/lib/security`.
3. Tier gate on `POST` via `enforce<Feature>Max` — return `createTierLimitResponse(gate.reason)` if not allowed.
4. Validate body with `schema.safeParse(await req.json() as unknown)` — return `400` on failure.
5. Delegate to `lib/<feature>/` — no business logic in routes.
6. Status codes: `201` create, `200` read/update, `204` (no body) delete, `404` not found.

```ts
// route.ts — POST
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const identifier = getRateLimitIdentifier(req, session.user.id);
  const rateLimit = writeRateLimiter.check(identifier);
  if (!rateLimit.allowed)
    return createRateLimitResponse(rateLimit.retryAfterSeconds);

  const gate = await enforceFeatureMax(session.user.id);
  if (!gate.allowed) return createTierLimitResponse(gate.reason);

  const body = (await req.json()) as unknown;
  const parsed = createFeatureSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const record = await createFeature(session.user.id, parsed.data);
  return NextResponse.json({ feature: record }, { status: 201 });
}
```

---

## 4. LLM Tools — `lib/tools/`

Three components — never add feature logic to `executor.ts`.

### `registry.ts` — tool definitions

One entry per action. Include `minTier` and `group` on every entry.

```ts
{
  minTier: "free",        // "free" | "pro" | "premium" | "enterprise"
  group: "feature",
  type: "function",
  function: {
    name: "create_feature",
    description: "Create a new feature record. Use when the user asks to add or create one.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Required short title." },
      },
      required: ["title"],
    },
  },
}
```

Every CRUD feature exposes **four tools minimum**: `create_<feature>`, `list_<feature>s`, `update_<feature>`, `delete_<feature>`.

`getToolsForTier(tier, disabledToolNames)` strips `minTier`/`group` before passing the list to the LLM. `getActiveToolsForUser(userId)` fetches tier + preferences and delegates to `getToolsForTier`. Both functions already exist in `registry.ts` — do not duplicate this logic.

Tool description quality matters: the LLM reads them to decide which tool to call. Be specific about when to use vs. not use each tool.

### `handlers/<feature>.handler.ts`

```ts
import "server-only";
import { createFeature } from "@/lib/feature/create.logic";
// …other logic imports
import { createFeatureSchema, updateFeatureSchema } from "@/lib/feature/schemas";
import { enforce<Feature>Max } from "@/lib/tiers";
import type { ActionResult, ToolHandler } from "@/lib/tools/types";

async function handleCreateFeature(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  const parsed = createFeatureSchema.safeParse(args);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const gate = await enforce<Feature>Max(userId);
  if (!gate.allowed) return { ok: false, error: gate.reason ?? "Limit reached." };

  const record = await createFeature(userId, parsed.data);
  return { ok: true, data: record };
}

async function handleDeleteFeature(
  userId: string,
  args: Record<string, unknown>,
): Promise<ActionResult> {
  if (typeof args.featureId !== "string")
    return { ok: false, error: "delete_feature requires featureId." };

  const result = await deleteFeature(args.featureId, userId);
  if (!result.ok) return { ok: false, error: "Feature not found." };
  return { ok: true, data: { deleted: true } };
}

export const featureHandlers: Record<string, ToolHandler> = {
  create_feature: handleCreateFeature,
  list_features: handleListFeatures,
  update_feature: handleUpdateFeature,
  delete_feature: handleDeleteFeature,
};
```

### `executor.ts` — adding a new feature

Only one line ever changes in `executor.ts`:

```ts
const HANDLERS = {
  ...taskHandlers,
  ...labelHandlers,
  ...contactHandlers,
  ...meetingHandlers,
  ...decisionHandlers,
  ...featureHandlers, // ← add this line
};
```

Nothing else in `executor.ts` changes.

---

## 5. LLM Context Slot — `lib/context/<feature>.slot.ts`

Makes the LLM aware of the user's live data in every conversation.

```ts
import "server-only";
import { listFeatures } from "@/lib/feature/list.logic";
import type { ContextSlot } from "@/lib/context";

export const featureSlot: ContextSlot = {
  key: "feature",
  label: "Features", // becomes a ## heading in the system prompt
  async fetch(userId: string, query: string) {
    const records = await listFeatures(userId, {});
    if (records.length === 0) return null; // null = omit section entirely
    return records.map((r) => `- [${r.id}] ${r.title}`).join("\n");
  },
};
```

**Interface (exact signature):**

```ts
export interface ContextSlot {
  key: string;
  label: string;
  fetch: (userId: string, query: string) => Promise<string | null>;
}
```

The `query` parameter is passed from the incoming user message so RAG-style slots (like knowledge) can use it for semantic search. Non-RAG slots can ignore it.

Register in `lib/context/index.ts`:

```ts
export const SLOT_REGISTRY: ContextSlot[] = [
  tasksSlot,
  labelsSlot,
  knowledgeSlot,
  contactsSlot,
  meetingsSlot,
  decisionsSlot,
  featureSlot, // ← append here
];
```

`buildSystemPrompt()` in `lib/context/build.ts` runs all slots in parallel and injects each non-null result. No other changes required.

---

## 6. UI Components — `components/<feature>/`

### File layout

```
components/<feature>/
  index.ts                        barrel exports only
  <Feature>Shell.tsx              page-level: list + filters + empty state
  <Feature>Card.tsx               single-item display
  Create<Feature>Dialog.tsx       create form in a Dialog
  Edit<Feature>Dialog.tsx         edit form in a Dialog (key-remount pattern)
  logic/
    use<Feature>Mutations.ts      all API calls + loading state + toasts
```

### `Create<Feature>Dialog` vs `Edit<Feature>Dialog`

Always use two separate named components — one for create, one for edit. The unified single-dialog pattern is the standard and should not be used in new work, UNLESS editing add new entity fields that do not exist at creation (e.g. a "summary" field that is only settable after creation).

`Edit<Feature>Dialog` initialises state from props directly — no `useEffect`:

```tsx
// Shell call site — key forces remount when target item changes
<EditFeatureDialog key={editItem?.id ?? "edit"} item={editItem} ... />

// In the dialog — initialise directly from props
const [title, setTitle] = useState(item?.title ?? "");  // ✅ no useEffect
```

### `use<Feature>Mutations` hook

State (`items`, `setItems`) lives in the shell, not the hook. Translations are passed as a plain object — no `useTranslations` inside the hook.

```ts
export function useFeatureMutations(
  setItems: React.Dispatch<React.SetStateAction<FeatureRecord[]>>,
  t: {
    createSuccess: string;
    createError: string;
    updateSuccess: string;
    updateError: string;
    deleteSuccess: string;
    deleteError: string;
  },
) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  // ...
}
```

### Interactive element rules

- Every button: `cursor-pointer`
- Every icon-only button: `aria-label` (localized) + `Tooltip`
- Destructive confirmation: use `AlertDialog` or `ConfirmDialog`, never a bare click handler
- Status/priority indicators: colored badges

### Form label conventions (from Zod schema, not UI assumption)

Required field — red asterisk:

```tsx
<Label htmlFor="field-id">
  {t("fields.title")}
  <span aria-hidden="true" className="ml-0.5 text-destructive">
    *
  </span>
</Label>
```

Optional field — muted hint:

```tsx
<Label htmlFor="field-id">
  {t("fields.notes")}
  <span className="ml-1 text-xs font-normal text-muted-foreground">
    ({t("fields.optional")})
  </span>
</Label>
```

### Base UI trigger rule

Base UI triggers (`DialogTrigger`, `TooltipTrigger`, etc.) render a `<button>` themselves. Never nest a `<Button>` component as a direct child — that creates `<button>` inside `<button>` (invalid HTML, hydration error). Use the `render` prop:

```tsx
// ✅ correct
<DialogTrigger render={<Button variant="outline">Open</Button>} />

// ❌ wrong — nested button
<DialogTrigger><Button>Open</Button></DialogTrigger>
```

---

## 7. Server Page — `app/(app)/<feature>/page.tsx`

Server component only. Auth → metadata → data fetch → render client shell.

```tsx
import "server-only";

export async function generateMetadata() {
  const t = await getTranslations("<feature>");
  return defineSEO({
    title: t("metadata.title"),
    description: t("metadata.description"),
  });
}

export default async function FeaturePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [records, labels] = await Promise.all([
    listFeatures(session.user.id, {}),
    listLabels(session.user.id),
  ]);

  return <FeatureShell initialRecords={records} availableLabels={labels} />;
}
```

---

## 8. Navigation

Add a nav entry to `components/navigation/Navbar.tsx`:

```ts
{ href: "/feature", icon: SomeIcon, label: t("nav.feature") }
```

Add the key to both `messages/en.json` and `messages/de.json` under `shell.nav`.

---

## 9. i18n

Namespace: `<feature>.<section>.<key>`

```json
{
  "feature": {
    "metadata": { "title": "Feature", "description": "..." },
    "pageTitle": "Feature",
    "newFeature": "New Feature",
    "empty": "No records yet.",
    "fields": {
      "title": "Title",
      "titlePlaceholder": "e.g. My record",
      "notes": "Notes",
      "noteePlaceholder": "Additional context…",
      "optional": "Optional"
    },
    "createDialog": {
      "heading": "New Feature",
      "description": "Fill in the details below to create a new record.",
      "submit": "Create",
      "success": "Feature created",
      "error": "Failed to create feature"
    },
    "editDialog": {
      "heading": "Edit Feature",
      "description": "Update the details below.",
      "submit": "Save",
      "success": "Feature updated",
      "error": "Failed to update feature"
    },
    "deleteDialog": {
      "heading": "Delete Feature?",
      "body": "This action cannot be undone.",
      "confirm": "Delete",
      "cancel": "Cancel",
      "success": "Feature deleted",
      "error": "Failed to delete feature"
    }
  }
}
```

`DialogDescription` must use a **dedicated description key** — never reuse the heading key.

---

## 10. Tier Enforcement

For new quota-gated features:

1. Add a limit field to `PlanLimits` in `types/billing.ts` for each of the four tiers.
2. Add a counter field to `UsageCounter` in `prisma/schema.prisma`.
3. Run `npx prisma db push && npx prisma generate`.
4. Add `enforce<Feature>Max` to `lib/tiers/enforce.ts` (get tier → compare counter → increment on pass).
5. Export it from `lib/tiers/index.ts`.
6. Call it in `app/api/<feature>/route.ts` POST **before** any DB writes.
7. Call it in `lib/tools/handlers/<feature>.handler.ts` create handler.
8. Add `used` + `limit` to `UsageSummary` in `types/billing.ts`.
9. Read the counter in `lib/settings/usage.logic.ts`.
10. Add a `QuotaRow` to `components/settings/UsageTab.tsx` and i18n keys to both message files.

---

## 11. Copyright Headers

Every file in the server and tool layers must have this header:

```ts
/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */
```

Required on: `app/api/<feature>/route.ts`, `app/api/<feature>/[id]/route.ts`, `app/(app)/<feature>/page.tsx`, `lib/tools/handlers/<feature>.handler.ts`, `lib/context/<feature>.slot.ts`, and all `lib/<feature>/*.ts` files.

---

## 12. Known Pattern Exceptions

### Knowledge

Knowledge diverges from the standard CRUD pattern — this is intentional:

- `lib/knowledge/` has `search.logic.ts` instead of `update.logic.ts`
- No create, update, or delete LLM tools — the context slot is read-only by design
- API sub-routes: `upload/` and `personal/` instead of the standard `route.ts` + `[id]/route.ts`
- Components use `KnowledgePageClient` (not a `*Shell`) and `UploadForm` (not `Create*Dialog`)
- Context slot uses `query` parameter for pgvector semantic search

Do not force Knowledge-like features into the standard CRUD template. Upload-indexed, RAG-backed features follow this variant.

---

## 13. Checklist for a New Feature

- [ ] Prisma model added; `db push` + `generate` run; dev server restarted
- [ ] `lib/<feature>/schemas.ts` — Zod validators + inferred types
- [ ] `lib/<feature>/shared.logic.ts` — `SELECT` const + `toXxxRecord()` mapper
- [ ] `lib/<feature>/create.logic.ts`, `list.logic.ts`, `update.logic.ts`, `delete.logic.ts`
- [ ] `app/api/<feature>/route.ts` (GET + POST) + `[id]/route.ts` (PATCH + DELETE)
- [ ] `lib/tools/registry.ts` — 4 tool entries (create, list, update, delete) with `minTier` + `group`
- [ ] `lib/tools/handlers/<feature>.handler.ts` — 4 handlers; spread into `HANDLERS` in `executor.ts`
- [ ] `lib/context/<feature>.slot.ts` — created and appended to `SLOT_REGISTRY`
- [ ] `components/<feature>/` — Shell, Card, `Create<Feature>Dialog`, `Edit<Feature>Dialog`, mutations hook, `index.ts`
- [ ] `app/(app)/<feature>/page.tsx` — server page with auth + data fetch
- [ ] Nav link in `Navbar.tsx` with icon + i18n key
- [ ] i18n strings in both `messages/en.json` and `messages/de.json` (all sections, dedicated description keys)
- [ ] Tier enforcement added if quota-gated (billing type, schema field, enforce fn, usage logic, UsageTab, i18n)
- [ ] Copyright headers on all server/tool/context/page files
- [ ] `npm run lint && npm run typecheck && npm run build` — all pass
