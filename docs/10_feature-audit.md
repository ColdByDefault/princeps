# Feature Audit — April 2026

> **Status:** Open  
> **Scope:** Tasks, Contacts, Meetings, Decisions, Knowledge — full-stack (server logic, API routes, LLM tools, context slots, UI components)  
> **Reference:** `06_feature-refactor.md` used as the correctness benchmark

---

## Tool Completeness Matrix

| Feature   | create | list | update | delete |        Registry        | Handler |
| --------- | :----: | :--: | :----: | :----: | :--------------------: | :-----: |
| Tasks     |   ✅   |  ✅  |   ✅   |   ✅   |           ✅           |   ✅    |
| Contacts  |   ✅   |  ✅  |   ✅   |   ✅   |           ✅           |   ✅    |
| Meetings  |   ✅   |  ✅  |   ✅   |   ✅   |           ✅           |   ✅    |
| Decisions |   ✅   |  ✅  |   ✅   |   ❌   |           ❌           |   ❌    |
| Knowledge |   —    |  —   |   —    |   —    | — (RAG-only by design) |    —    |

---

## Findings

---

### [1] FUNCTIONAL GAP — `delete_decision` tool missing

**Severity:** High  
**Files:**

- `lib/tools/registry.ts` — no `delete_decision` entry
- `lib/tools/handlers/decisions.handler.ts` — no `handleDeleteDecision` function, not in export map

**Issue:**  
`lib/decisions/delete.logic.ts` and `DELETE /api/decisions/[id]` are both fully implemented, but the LLM has no tool to trigger a deletion. Every other CRUD feature (Tasks, Contacts, Meetings) exposes a delete tool. The registry ends at `update_decision`.

**Fix:** Add a `delete_decision` registry entry (with `minTier: "pro"`) and a `handleDeleteDecision` function in `decisions.handler.ts`.

---

### [2] DOC BUG — `ContextSlot.fetch` signature in `06_feature-refactor.md`

**Severity:** Medium  
**File:** `docs/06_feature-refactor.md` — Section 5 "LLM Context Slot"

**Issue:**  
The doc shows:

```ts
fetch: (userId: string) => Promise<string | null>;
```

The actual interface in `lib/context/index.ts` is:

```ts
fetch: (userId: string, query: string) => Promise<string | null>;
```

The `query` parameter exists so the knowledge slot can run RAG. A developer copying the doc template will create an incompatible slot and get a TypeScript error.

**Fix:** Update the code snippet in Section 5 and the `tasksSlot` example to include the `query` parameter.

---

### [3] DOC BUG — Tier-per-tool system marked as TODO when it is live

**Severity:** Medium  
**Files:**

- `docs/05_tier-system.md` — Enforcement audit table
- `docs/06_feature-refactor.md` — Section 4

**Issue:**  
`05_tier-system.md` says:

> Per-tool tier gate: ⚠ TODO — task #25  
> System prompt tool list: ⚠ TODO — task #25

This is stale. The feature is fully implemented:

- Every `TOOL_REGISTRY` entry carries `minTier`.
- `getToolsForTier()` and `getActiveToolsForUser()` exist in `registry.ts`.
- `buildSystemPrompt()` in `lib/context/build.ts` and the stream route both call these.

**Fix:** Update `05_tier-system.md` enforcement audit to ✅. Update `06_feature-refactor.md` Section 4 to reflect the `minTier` field and `getToolsForTier()` as the live filtering mechanism.

---

### [4] DOC GAP — Knowledge is an undocumented exception to the standard pattern

**Severity:** Medium  
**File:** `docs/06_feature-refactor.md` — Layer diagram + Section 2

**Issue:**  
Knowledge diverges from the standard CRUD pattern in multiple ways the doc does not acknowledge:

- `lib/knowledge/` has `search.logic.ts` instead of `update.logic.ts`
- No create, update, or delete LLM tools — the context slot is read-only by design
- API has `upload/` and `personal/` sub-routes, not just `route.ts` + `[id]/route.ts`
- Components use `KnowledgePageClient` (not a `*Shell`) and `UploadForm` (not `Create*Dialog`)

A developer building a new upload-style feature may incorrectly force it into the standard CRUD template.

**Fix:** Add a "Known pattern exceptions" section to `06_feature-refactor.md` documenting Knowledge as a first-class variant (upload-indexed, RAG context slot, no LLM write tools).

---

### [5] STRUCTURE — Contacts uses a unified dialog, all other features use separate Create/Edit

**Severity:** Low  
**Files:** `components/contact/ContactDialog.tsx`, `components/contact/index.ts`

**Issue:**  
Contacts uses a single `ContactDialog` (toggled via an optional `contact` prop) for both create and edit. Every other feature (Tasks, Meetings, Decisions) uses separate `Create<Feature>Dialog` + `Edit<Feature>Dialog`. No functional bug — the Dialog unmounts on close so state re-initialises correctly — but the barrel export (`index.ts`) does not name-match the pattern relied on across the codebase. Creates confusion when navigating between features.

**Fix:** Either split into two named dialogs to match the pattern, or explicitly document the unified-dialog variant in `06_feature-refactor.md` as an accepted alternative.

---

### [6] I18N — `ContactDialog` description reuses the heading key

**Severity:** Low  
**File:** `components/contact/ContactDialog.tsx` line ~50

**Issue:**

```tsx
<DialogDescription>
  {contact ? t("editDialog.heading") : t("createDialog.heading")}
</DialogDescription>
```

`DialogDescription` renders the same string as `DialogTitle` one line above. The accessible description provides no additional context for screen readers.

**Fix:** Add `editDialog.description` and `createDialog.description` keys to both message files and reference them here.

---

### [7] STYLE — Missing copyright headers in Decisions files

**Severity:** Low  
**Files:**

- `app/api/decisions/route.ts`
- `app/api/decisions/[id]/route.ts`
- `lib/tools/handlers/decisions.handler.ts`
- `lib/context/decisions.slot.ts`

**Issue:** These four files are missing the `@author ColdByDefault / @copyright 2026` block present on every equivalent Tasks, Contacts, and Meetings file in the same layers.

**Fix:** Add the standard header block to each file.

---

## Action Items

| #   | Item                                                                  | Priority | Status |
| --- | --------------------------------------------------------------------- | -------- | ------ |
| 1   | Add `delete_decision` to registry + handler                           | High     | Open   |
| 2   | Fix `ContextSlot.fetch` signature in `06_feature-refactor.md`         | Medium   | Open   |
| 3   | Update tier enforcement audit in `05_tier-system.md` to ✅            | Medium   | Open   |
| 4   | Document Knowledge as a pattern exception in `06_feature-refactor.md` | Medium   | Open   |
| 5   | Resolve or formally document unified-dialog pattern in Contacts       | Low      | Open   |
| 6   | Fix `ContactDialog` `DialogDescription` to use a dedicated i18n key   | Low      | Open   |
| 7   | Add copyright headers to four Decisions files                         | Low      | Open   |
