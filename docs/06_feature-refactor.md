# Feature Implementation Reference

> **Status:** Verified — April 2026  
> **Reference feature:** Tasks  
> This document captures the exact pattern used to build the Tasks feature end-to-end. It passed full manual testing including CRUD, LLM tool-calling, LLM-awareness, UI/UX, and tier enforcement. Use it as the template for every future feature.

---

## Overview of the Full Stack

A complete feature in C-Sweet spans six layers:

```
prisma/schema.prisma          ← 1. Data model
lib/<feature>/                ← 2. Server logic (Zod + DB)
app/api/<feature>/            ← 3. REST API routes
lib/tools/                    ← 4. LLM tool definitions + handler + executor
  registry.ts                 ←    tool schemas
  types.ts                    ←    ActionResult + ToolHandler types
  handlers/<feature>.handler.ts ←  feature-specific tool logic (one file per feature)
  executor.ts                 ←    thin dispatcher — never edited for new features
lib/context/<feature>.slot.ts ← 5. LLM system prompt context slot
components/<feature>/         ← 6. UI components + client hook
app/(app)/<feature>/page.tsx  ← 7. Server page (auth + data)
messages/{en,de}.json         ← 8. i18n strings (both locales)
types/billing.ts + enforce.ts ← 9. Tier limits (if quota-gated)
```

Every layer has a clear contract. Nothing bleeds into the wrong layer.

---

## 1. Prisma Schema

Add a model to `prisma/schema.prisma`. Follow the existing conventions:

- Use `cuid()` for IDs, `@default(now())` for timestamps.
- Add `@@index` on any `userId` or foreign-key column that will be queried in lists.
- Use `@@map("snake_case")` and `@map("snake_case")` on all models and fields.
- If the feature has status/priority fields with a fixed set of values, define them as Prisma enums.
- Join tables for many-to-many relations (`LabelOn<Feature>`) should have composite `@@id`.

After editing the schema, push to the dev database and regenerate the client:

```bash
npx prisma db push
npx prisma generate
```

> **Note:** This project uses `db push` for development (no migration baseline). Always regenerate the client after a schema change — the running dev server must be restarted to pick up the new client.

---

## 2. Server Logic — `lib/<feature>/`

Five files per feature. All are `"server-only"`.

### `schemas.ts`

Zod validators only. No DB imports.

```ts
import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  notes: z.string().max(4000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  // ...all fields optional for PATCH
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
```

### `shared.logic.ts`

Prisma `select` object + DB row → client type mapper. Imported by every other logic file.

```ts
import "server-only";
import type { TaskRecord } from "@/types/api";

export const TASK_SELECT = {
  id: true,
  title: true,
  notes: true,
  status: true,
  priority: true,
  dueDate: true,
  meetingId: true,
  createdAt: true,
  updatedAt: true,
  labelLinks: {
    select: { label: { select: { id: true, name: true, color: true } } },
  },
} as const;

type TaskRow = {
  /* mirrors TASK_SELECT shape with proper TS types */
};

export function toTaskRecord(row: TaskRow): TaskRecord {
  return {
    ...row,
    dueDate: row.dueDate?.toISOString() ?? null,
    labels: row.labelLinks.map((l) => l.label),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
```

### `create.logic.ts` / `list.logic.ts` / `update.logic.ts` / `delete.logic.ts`

Each does one thing. All accept `userId` as the first argument (auth is handled by the caller before calling these).

**Single round-trip for `update` and `delete`** — never do a `findFirst` ownership check followed by a separate `update`/`delete`. That's 2 DB round trips when 1 is enough.

```ts
// ✅ update — include userId in where; .catch(() => null) handles not-found
const row = await db.task.update({ where: { id: taskId, userId }, data: {...}, select: TASK_SELECT }).catch(() => null);
if (!row) return { ok: false, notFound: true };

// ✅ delete — deleteMany returns a count; 0 means not found
const { count } = await db.task.deleteMany({ where: { id: taskId, userId } });
return { ok: count > 0 };

// ❌ wrong — 2 round trips
const existing = await db.task.findFirst({ where: { id: taskId, userId } });
if (!existing) return { ok: false, notFound: true };
await db.task.delete({ where: { id: taskId } });
```

**`exactOptionalPropertyTypes` pattern** — never pass a potentially-`undefined` value into an optional slot directly:

```ts
// ✅ correct
const filter = status ? { status } : {};
await listTasks(userId, filter);

// ❌ wrong — TS strict mode rejects this
await listTasks(userId, { status }); // status could be undefined
```

---

## 3. API Routes — `app/api/<feature>/`

Two files: `route.ts` (collection) and `[id]/route.ts` (item).

**Pattern:**

- Auth via `auth.api.getSession({ headers: await headers() })` — return 401 if no session.
- Validate body with `schema.safeParse(await req.json())` — return 400 on failure.
- Delegate to `lib/<feature>/` logic — never put business logic in routes.
- Return 201 on create, 200 on read/update, 204 (no body) on delete, 404 if not found.

```ts
// app/api/tasks/route.ts
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const tasks = await listTasks(session.user.id, status ? { status } : {});
  return NextResponse.json(tasks);
}
```

---

## 4. LLM Tools — `lib/tools/`

Three files. Feature-agnostic. Any surface (chat, cron, webhook, agent) can call this.

### `registry.ts`

Exports `TOOL_REGISTRY: LLMTool[]`. One entry per action, in OpenAI function-calling schema format:

```ts
{
  type: "function",
  function: {
    name: "create_task",
    description: "Create a new task. Use when the user asks to add or schedule a task.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short, clear title (required)." },
        priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
      },
      required: ["title"],
    },
  },
}
```

Good tool descriptions are critical — the LLM reads them to decide which tool to call.

### `executor.ts`

Thin dispatcher — **never add feature logic here**. Exports `executeToolCall(userId, toolCall): Promise<ActionResult>`.

```
lib/tools/
  types.ts                      ← ActionResult + ToolHandler types
  registry.ts                   ← tool schemas (OpenAI format)
  resolvers.ts                  ← shared name→ID helpers
  executor.ts                   ← ≤50 lines: parses args, looks up handler, calls it
  handlers/
    tasks.handler.ts            ← all task tool cases
    labels.handler.ts           ← all label tool cases
    <feature>.handler.ts        ← add one file per new feature
```

**To add a new feature's tools:**

1. Create `lib/tools/handlers/<feature>.handler.ts` — export a `featureHandlers` record mapping tool names to handler functions.
2. Spread it into `HANDLERS` in `executor.ts` — that's the only change needed there.

```ts
// types.ts
export type ActionResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };
export type ToolHandler = (
  userId: string,
  args: Record<string, unknown>,
) => Promise<ActionResult>;

// executor.ts — stays ≤50 lines forever
const HANDLERS = {
  ...taskHandlers,
  ...labelHandlers,
  // ...meetingHandlers  ← just add this line for a new feature
};

export async function executeToolCall(userId, toolCall): Promise<ActionResult> {
  const args = JSON.parse(toolCall.function.arguments);
  const handler = HANDLERS[toolCall.function.name];
  if (!handler)
    return { ok: false, error: `Unknown tool: ${toolCall.function.name}` };
  return handler(userId, args);
}
```

Each `*.handler.ts`:

- Is `"server-only"`.
- Imports only from its own `lib/<feature>/` layer.
- Validates with matching Zod schema via `safeParse`.
- Returns `{ ok: true, data }` or `{ ok: false, error }`.

### How tools flow through the LLM stream

The OpenAI tool-calling protocol is a **3-step round trip**:

```
1. User message → LLM
2. LLM → "I want to call create_task({...})"  [no text content yet]
3. Server executes the tool
4. Server → LLM: "here is the result"
5. LLM → text response to the user
```

In `app/api/chat/[chatId]/stream/route.ts`:

- First pass: stream the LLM, collect `LLMToolCall` objects yielded when `finish_reason === "tool_calls"`.
- Enforce tier tool quota: `enforceToolCallsMonthly(userId, count)`.
- Execute each tool via `executeToolCall()`, emit `{ type: "action", name, record }` SSE event.
- Append `{ role: "assistant", content: null, tool_calls: [...] }` and `{ role: "tool", tool_call_id, content }` messages to the conversation.
- Second pass: stream again **without tools** (to avoid loops) to get the text response.

> **Critical:** Omitting the second LLM pass means the assistant produces no text response when it calls a tool. The chat will appear to hang or show nothing.

---

## 5. LLM Context Slot — `lib/context/<feature>.slot.ts`

Makes the LLM aware of the user's data in every conversation, without any chat-specific code.

```ts
import "server-only";
import { listTasks } from "@/lib/tasks/list.logic";
import type { ContextSlot } from "@/lib/context";

export const tasksSlot: ContextSlot = {
  key: "tasks",
  label: "Open Tasks", // becomes a ## heading in the system prompt
  async fetch(userId) {
    const tasks = await listTasks(userId, { status: "open" });
    if (tasks.length === 0) return null; // null = omit section entirely
    return tasks
      .map((t) => `- [${t.id}] ${t.title} — priority: ${t.priority}`)
      .join("\n");
  },
};
```

Register it in `lib/context/index.ts`:

```ts
export const SLOT_REGISTRY: ContextSlot[] = [tasksSlot];
```

The `buildSystemPrompt()` function in `lib/context/build.ts` runs all slots in parallel and injects each non-null result under its label heading. No other code changes are required.

---

## 6. UI Components — `components/<feature>/`

### File layout

```
components/<feature>/
  index.ts                    ← barrel exports only
  <Feature>Shell.tsx          ← full page component: list + filters + empty state
  <Feature>Card.tsx           ← single item card
  Create<Feature>Dialog.tsx   ← create form in a Dialog
  Edit<Feature>Dialog.tsx     ← edit form in a Dialog
  logic/
    use<Feature>Mutations.ts  ← all API calls + loading state + toasts
```

### `use<Feature>Mutations` hook

Centralises all fetch calls and toast feedback. Returns mutation functions and loading booleans.

```ts
// State (items, setItems) lives in the shell, not the hook.
// Pass setItems and pre-resolved translation strings — no useTranslations inside the hook.
export function useFeatureMutations(
  setItems: React.Dispatch<React.SetStateAction<FeatureRecord[]>>,
  t: Translations,
) {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null); // id being updated
  const [deleting, setDeleting] = useState<string | null>(null);

  async function createItem(input: CreateInput): Promise<boolean> {
    setCreating(true);
    try {
      const res = await fetch("/api/feature", {
        method: "POST",
        body: JSON.stringify(input),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { item: FeatureRecord };
      setItems((prev) => [data.item, ...prev]);
      toast.success(t.createSuccess);
      return true;
    } catch {
      toast.error(t.createError);
      return false;
    } finally {
      setCreating(false);
    }
  }

  // Specialised mutations (e.g. toggleDone) call the generic updateItem
  // with silent=true and show their own specific toast instead.
  async function toggleDone(item: FeatureRecord) {
    const newStatus = item.status === "done" ? "open" : "done";
    const ok = await updateItem(item.id, { status: newStatus }, true);
    if (ok)
      toast.success(newStatus === "done" ? t.completeSuccess : t.reopenSuccess);
  }

  return {
    creating,
    updating,
    deleting,
    createItem,
    updateItem,
    toggleDone,
    deleteItem,
  };
}
```

### Dialog triggers — Base UI rule

`DialogTrigger`, `TooltipTrigger`, and similar Base UI primitives default to `nativeButton={true}`. The `render` prop **must** receive an element that renders a native `<button>`. Never use `render={<span />}` — it strips button semantics and causes a console warning.

```tsx
// ✅ Correct — pass children (a <Button>) as the render target
<DialogTrigger render={children as React.ReactElement} />

// ✅ Correct — inline Button as render prop
<DialogTrigger render={<Button variant="outline">Open</Button>} />

// ❌ Wrong — span removes native button semantics
<DialogTrigger render={<span />}>{children}</DialogTrigger>
```

### `EditDialog` — no `useEffect` for state init

Initialize state directly from props with `useState(task?.title ?? "")`. Use `key={item?.id ?? "edit"}` on the component at the call site to force remount when the target item changes. This avoids the `setState inside useEffect` lint error.

```tsx
// In the shell:
<EditTaskDialog key={editTask?.id ?? "edit-task"} task={editTask} ... />

// In the dialog:
const [title, setTitle] = useState(task?.title ?? "");  // ✅ no useEffect
```

### Interactive element rules

- Every button must have `cursor-pointer`.
- Every icon-only button must have `aria-label` (localized) and a `Tooltip`.
- Destructive actions (delete) must use `AlertDialog` for confirmation, not a plain click handler.
- All status/priority indicators use colored badges, not text alone.

### Form input conventions

The Zod schema (`lib/<feature>/schemas.ts`) is the source of truth for required vs. optional fields. The UI must reflect this visually.

**Required field** — add a red asterisk after the label text, hidden from screen readers:

```tsx
<Label htmlFor="task-title">
  {t("fields.title")}
  <span aria-hidden="true" className="ml-0.5 text-destructive">
    *
  </span>
</Label>
```

**Optional field** — add a muted `(Optional)` hint after the label text:

```tsx
<Label htmlFor="task-notes">
  {t("fields.notes")}
  <span className="ml-1 text-xs font-normal text-muted-foreground">
    ({t("fields.optional")})
  </span>
</Label>
```

Add `"optional": "Optional"` (EN) / `"optional": "Optional"` (DE) under the `fields` key in both message files. No i18n key is needed for the asterisk itself.

Fields with a guaranteed non-empty default (e.g. a `<select>` with a pre-selected value at all times) do not need an optional hint.

---

## 7. Server Page — `app/(app)/<feature>/page.tsx`

Server component only. Handles auth, metadata, initial data fetch, and renders the client shell.

```tsx
export async function generateMetadata() {
  const t = await getTranslations("<feature>");
  return defineSEO({ title: t("metadata.title"), ... });
}

export default async function TasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const tasks = await listTasks(session.user.id, {});

  return <TasksShell initialTasks={tasks} />;
}
```

---

## 8. Navigation

Add the nav link to `components/navigation/Navbar.tsx`. Import an icon from `lucide-react` and add an entry to the nav array:

```ts
import { CheckSquare } from "lucide-react";
{ href: "/tasks", icon: CheckSquare, label: t("nav.tasks") }
```

Add the translation key to both `messages/en.json` and `messages/de.json` under `shell.nav`.

---

## 9. i18n

Every user-visible string goes in both message files. Never hardcode copy.

**Namespace convention:** `<feature>.<section>.<key>`

```json
{
  "tasks": {
    "metadata": { "title": "Tasks", "description": "..." },
    "pageTitle": "Tasks",
    "newTask": "New task",
    "empty": "No tasks yet.",
    "filter": { "all": "All", "open": "Open", "done": "Done" },
    "priority": { "low": "Low", "normal": "Normal", "high": "High", "urgent": "Urgent" },
    "fields": { "title": "Title", "titlePlaceholder": "e.g. Prepare agenda", ... },
    "createDialog": { "heading": "New task", "submit": "Create", "success": "Task created", "error": "Failed to create task" },
    "editDialog": { ... },
    "deleteDialog": { "heading": "Delete task?", "body": "...", "confirm": "Delete", "cancel": "Cancel" }
  }
}
```

Use `useTranslations("tasks")` in client components and `getTranslations("tasks")` in server code.

---

## 10. Tier Enforcement

If the feature has a quota limit (e.g. tool calls per month, items stored):

1. Add the limit field to `PlanLimits` in `types/billing.ts` and fill in a value for each of the four tiers.
2. Add a counter field to the `UsageCounter` model in `prisma/schema.prisma`.
3. Run `npx prisma db push && npx prisma generate`.
4. Add an `enforce<X>` function to `lib/tiers/enforce.ts` following the existing patterns (get tier, compare counter, increment on pass).
5. Export it from `lib/tiers/index.ts`.
6. Call it in the API route or stream route **before** touching the LLM or DB.
7. Add `used` and `limit` fields to `UsageSummary` in `types/billing.ts`.
8. Read the counter in `lib/settings/usage.logic.ts` and populate the new fields.
9. Add a `QuotaRow` entry in `components/settings/UsageTab.tsx`.
10. Add the label string to both message files.

---

## Checklist for a New Feature

- [ ] Prisma model added, `db push` run, client regenerated, dev server restarted
- [ ] `lib/<feature>/schemas.ts` — Zod validators + inferred types
- [ ] `lib/<feature>/shared.logic.ts` — `TASK_SELECT` + `toXRecord()` mapper
- [ ] `lib/<feature>/create.logic.ts`, `list.logic.ts`, `update.logic.ts`, `delete.logic.ts`
- [ ] `app/api/<feature>/route.ts` + `app/api/<feature>/[id]/route.ts`
- [ ] `lib/tools/registry.ts` — new tool definitions added
- [ ] `lib/tools/executor.ts` — new tool names dispatched
- [ ] `lib/context/<feature>.slot.ts` — created and registered in `SLOT_REGISTRY`
- [ ] `components/<feature>/` — Shell, Card, Create/EditDialog, mutations hook, `index.ts`
- [ ] `app/(app)/<feature>/page.tsx` — server page
- [ ] Nav link added to `Navbar.tsx` with icon + i18n key
- [ ] i18n strings in both `messages/en.json` and `messages/de.json`
- [ ] Tier limit added (if applicable) — billing type, schema, enforce fn, usage logic, UsageTab, i18n
- [ ] `npm run lint && npm run typecheck && npm run build` — all pass
