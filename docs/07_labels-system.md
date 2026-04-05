# Labels System

> **Status:** Implemented — April 2026
> **Branch:** `feat/major-update-6`

Labels are global, user-scoped tags that can be attached to any record in C-Sweet (tasks, contacts, meetings, decisions, knowledge documents). They are created and managed in **Settings → Labels** and are available in every feature that supports them.

---

## Overview

- Labels are **global per user** — created once in settings, reused everywhere.
- Each label has a `name` and a `color` (hex string).
- The schema enforces uniqueness by a `normalizedName` (lowercased), so "Work" and "work" are the same label.
- Default color is `#6366f1` (indigo).
- The LLM is aware of all labels and can create + attach them automatically in a single tool call.

---

## Data Model — `prisma/schema.prisma`

```prisma
model Label {
  id             String   @id @default(cuid())
  userId         String
  name           String
  color          String   @default("#6366f1")
  normalizedName String   // lowercase(name), enforced by create/update logic
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user      User                       @relation(fields: [userId], references: [id], onDelete: Cascade)
  contacts  LabelOnContact[]
  meetings  LabelOnMeeting[]
  tasks     LabelOnTask[]
  decisions LabelOnDecision[]
  knowledge LabelOnKnowledgeDocument[]

  @@unique([userId, normalizedName])
  @@index([userId])
  @@map("label")
}

// One join table per feature — composite PK, cascade delete on both sides
model LabelOnTask {
  labelId String
  taskId  String
  label   Label  @relation(fields: [labelId], references: [id], onDelete: Cascade)
  task    Task   @relation(fields: [taskId], references: [id], onDelete: Cascade)
  @@id([labelId, taskId])
  @@map("label_on_task")
}
// LabelOnContact, LabelOnMeeting, LabelOnDecision, LabelOnKnowledgeDocument follow the same shape
```

> **Pattern for new features:** add a `labelLinks <LabelOn<Feature>>[]` relation to the feature model and a corresponding `LabelOn<Feature>` join table — no changes to the Label model itself.

---

## Server Logic — `lib/labels/`

All files use `import "server-only"`.

### `schemas.ts`

```ts
export const createLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .default("#6366f1"),
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});
```

### `shared.logic.ts`

Contains `LABEL_SELECT` and `toLabelRecord()`. Both are imported by every other logic file and by feature logic that needs to include label data (e.g. `TASK_SELECT` includes `labelLinks`).

### `create.logic.ts`

Returns a union `CreateLabelResult`:

```ts
type CreateLabelResult =
  | { ok: true; label: LabelRecord }
  | { ok: false; duplicate: true }
  | { ok: false; duplicate: false; error: string };
```

- Sets `normalizedName = name.trim().toLowerCase()` before insert.
- Catches Prisma `P2002` (unique constraint) and returns `{ ok: false, duplicate: true }` — no throw.

### `list.logic.ts`

```ts
export async function listLabels(userId: string): Promise<LabelRecord[]>;
```

Ordered by `createdAt asc`. Used by: Settings page, task page (to populate pickers), context slot, and resolvers.

### `update.logic.ts`

Applies name + normalizedName + color in one `db.label.update`. Handles:

- `P2025` → `{ ok: false, notFound: true }`
- `P2002` → `{ ok: false, duplicate: true }`

### `delete.logic.ts`

```ts
const { count } = await db.label.deleteMany({ where: { id, userId } });
```

Single round-trip. Cascades to all join tables via the DB `onDelete: Cascade` constraint.

---

## API Routes — `app/api/labels/`

### `route.ts` — collection

| Method | Auth     | Action                                                                        |
| ------ | -------- | ----------------------------------------------------------------------------- |
| `GET`  | required | Returns `listLabels(userId)` → `200 LabelRecord[]`                            |
| `POST` | required | Validates body, calls `createLabel()` → `201 { label }` or `409` on duplicate |

### `[id]/route.ts` — item

| Method   | Auth     | Action                                                                   |
| -------- | -------- | ------------------------------------------------------------------------ |
| `PATCH`  | required | Validates body, calls `updateLabel()` → `200 { label }` or `404` / `409` |
| `DELETE` | required | Calls `deleteLabel()` → `204` no body                                    |

---

## Types — `types/api.ts`

```ts
/** Lightweight shape — used in feature records (tasks, contacts, etc.) */
export interface LabelOptionRecord {
  id: string;
  name: string;
  color: string;
}

/** Full shape — used in Settings → Labels */
export interface LabelRecord extends LabelOptionRecord {
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}
```

`LabelOptionRecord` is the embedded type on all feature records (`TaskRecord.labels`, `ContactRecord.labels`, etc.). `LabelRecord` is only needed in the Settings management UI.

---

## LLM Integration

### Context Slot — `lib/context/labels.slot.ts`

Registered in `SLOT_REGISTRY` in `lib/context/index.ts`. Returns `null` when the user has no labels (slot is omitted from the system prompt).

```ts
export const labelsSlot: ContextSlot = {
  key: "labels",
  label: "Available Labels",
  async fetch(userId) {
    const labels = await listLabels(userId);
    if (labels.length === 0) return null;
    return labels
      .map((l) => `- [${l.id}] ${l.name} (color: ${l.color})`)
      .join("\n");
  },
};
```

The LLM sees every label ID, name, and color in the system prompt on every conversation.

### Tools — `lib/tools/registry.ts`

Three tools interact with labels:

| Tool           | Purpose                                                         |
| -------------- | --------------------------------------------------------------- |
| `create_label` | Create a brand-new global label                                 |
| `create_task`  | Accepts `labelNames: string[]` to attach labels on creation     |
| `update_task`  | Accepts `labelNames: string[]` to replace all labels atomically |

#### Design decision: `labelNames` not `labelIds`

Early versions used `labelIds` in the task tools. The LLM had no ID for a non-existent label, so it would call `create_label` separately first, and then fail to pass the new ID to `create_task` — two round trips, zero connection.

The fix: tools accept **names**, not IDs. The executor resolves names to IDs atomically before any task logic runs.

```ts
// registry.ts — create_task / update_task
labelNames: {
  type: "array",
  items: { type: "string" },
  description: 'Labels to attach. Missing labels are created automatically. Use exact names (e.g. "work", "private").',
}
```

### Resolver — `lib/tools/resolvers.ts`

```ts
export async function resolveOrCreateLabelIdsByNames(
  userId: string,
  names: string[],
): Promise<string[]>;
```

1. Fetches all existing labels with `listLabels(userId)`.
2. For each name: match by `toLowerCase()` → return ID, or call `createLabel()` with color `#6366f1`.
3. Returns a deduplicated `string[]` of IDs.

Used in `executor.ts` before delegating to `createTask()` / `updateTask()`. Creates labels as a side effect when needed.

### Executor wiring — `lib/tools/executor.ts`

```ts
// create_task branch
const { labelNames, ...rest } = args;
const labelIds = labelNames?.length
  ? await resolveOrCreateLabelIdsByNames(userId, labelNames)
  : undefined;
const parsed = createTaskSchema.safeParse({
  ...rest,
  ...(labelIds && { labelIds }),
});

// update_task branch — same pattern; only injects labelIds if labelNames was present
```

---

## UI

### Settings — `components/settings/LabelsTab.tsx`

- Manages `LabelRecord[]` state with `useOptimistic`-style `useTransition`.
- **ColorPicker**: 12 preset colors displayed as clickable swatches, plus a free hex input.
- **Create dialog**: name + color picker → POST `/api/labels`.
- **Edit dialog**: same fields, pre-populated → PATCH `/api/labels/:id`.
- **Delete**: `AlertDialog` confirm → DELETE `/api/labels/:id`.
- All actions show `toast.success` / `toast.error`.

Wired into `SettingsShell` as the 4th tab (`VALID_TABS = ["appearance", "provider", "usage", "labels"]`). `app/(app)/settings/page.tsx` fetches labels in `Promise.all` alongside other settings data.

### Task dialogs — `CreateTaskDialog` / `EditTaskDialog`

Both accept `availableLabels: LabelOptionRecord[]` prop. When labels exist, a chip toggle section appears beneath the other fields:

```tsx
// Each label renders as a toggleable chip
<button
  type="button"
  aria-pressed={selectedLabelIds.includes(label.id)}
  onClick={() => toggleLabel(label.id)}
  style={{ backgroundColor: isSelected ? label.color : undefined }}
  className={cn("rounded-full border px-2 py-0.5 text-xs cursor-pointer transition-colors", ...)}
>
  {label.name}
</button>
```

`EditTaskDialog` pre-selects labels from `task.labels` using a `useEffect` that runs when the `task` prop changes.

Passed down from `TasksShell` → both dialogs. `tasks/page.tsx` fetches labels in `Promise.all` with tasks.

### TaskCard — `components/tasks/TaskCard.tsx`

Label pills are rendered in the badge row after the priority badge and due date:

```tsx
{
  task.labels.map((label) => (
    <span
      key={label.id}
      style={{ backgroundColor: label.color }}
      className="inline-flex h-5 items-center rounded-full px-2 text-[10px] font-medium text-white"
    >
      {label.name}
    </span>
  ));
}
```

---

## i18n

Both `messages/de.json` and `messages/en.json` contain a `labels` namespace and a `settings.tabs.labels` key.

Key paths:

```
labels.title
labels.description
labels.newLabel
labels.empty
labels.fields.name
labels.fields.namePlaceholder
labels.fields.color
labels.createDialog.title / description / submit
labels.editDialog.title / description / submit
labels.deleteDialog.title / description / confirm / cancel
labels.editLabel      ← aria-label / tooltip
labels.deleteLabel    ← aria-label / tooltip
tasks.fields.labels   ← section heading in task dialogs
settings.tabs.labels  ← tab trigger
```

---

## Extending Labels to a New Feature

When adding labels to a new feature (e.g. `Contact`):

1. **Schema**: add `labelLinks LabelOn<Feature>[]` to the feature model. Add the `LabelOn<Feature>` join table (see pattern above).
2. **`shared.logic.ts`**: extend `<FEATURE>_SELECT` to include `labelLinks: { select: { label: { select: { id: true, name: true, color: true } } } }`.
3. **`toFeatureRecord()`**: map `row.labelLinks.map(l => l.label)` → `record.labels`.
4. **Schemas**: add `labelIds?: z.array(z.string()).optional()` to create/update schemas.
5. **`create.logic.ts`**: pass `labelLinks: { create: labelIds.map(id => ({ labelId: id })) }` in the `data` object.
6. **`update.logic.ts`**: use `labelLinks: { deleteMany: {}, create: [...] }` for atomic replacement.
7. **Tools**: add `labelNames: string[]` to the create/update tools for that feature; call `resolveOrCreateLabelIdsByNames()` in the executor before parsing.
8. **UI**: add `availableLabels` prop and chip toggle section to the create/edit dialogs. Render pills in the card.
9. **i18n**: add `<feature>.fields.labels` key to both locale files.
