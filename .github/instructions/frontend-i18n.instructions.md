---
description: "Use when working on pages, components, layout, navigation, frontend UX, or localization in C-Sweet. Covers App Router page patterns, UI conventions, and i18n requirements."
name: "C-Sweet Frontend And I18n"
applyTo: "app/**/\*.tsx, components/**, messages/**, hooks/**, i18n/\*\*"
---

# C-Sweet Frontend And I18n

## Page And Component Structure

- Server pages handle auth, metadata, and initial data assembly. Pass serialized props (ISO strings, plain objects) to client components.
- Client components handle interactivity, local state, and browser APIs. Keep them focused on JSX rendering — extract hooks, state, and API calls into `components/<feature>/logic/`.
- Move business rules into `lib/<feature>/`, not into page or component files.
- Use `@/*` path imports.

## Hydration

- Never use `typeof window !== "undefined"` checks or `useEffect` + `useState` mounted flags for hydration guards.
- Use `useSyncExternalStore(() => () => {}, () => true, () => false)` for client-only rendering gates.
- Ensure server-rendered HTML matches client initial render. If a value depends on the browser (locale, viewport, etc.), defer it to a client component or read it from a prop passed by the server.
- Do not use `suppressHydrationWarning` unless it is on a leaf element displaying a truly volatile value (e.g., a live timestamp).

## UI Direction

- Visual language: layered cards, rounded surfaces, subtle gradients, feature-specific layouts. Do not flatten into generic dashboard scaffolding.
- Use existing `components/ui` primitives first. Add missing Shadcn UI components via `npx shadcn@latest add <component>`. Never edit Shadcn source files in `components/ui/` — ask for approval first if styling changes are needed.
- Use colored icons, badges, and tags for status indicators. Do not add new indicator types if the existing set covers the use case.

## Interactive Element Rules

- Every button, link, and clickable element must have `cursor-pointer`.
- Every non-text interactive control (icon buttons, toggles, close buttons) must have an `aria-label` with localized text.
- Every input field must have a `placeholder` with localized text.
- Apply tooltips on icon-only buttons, abbreviated labels, and any control where the purpose is not obvious from text alone. Use the Shadcn `Tooltip` component.

## Feedback & Notices

Every user-facing action (create, update, delete, upload, generate, etc.) must show feedback:

- **Success** — toast or floating notice confirming the action.
- **Error** — toast, floating notice, or inline `NoticePanel` with the error message.
- **Loading/Progress** — loading spinner, skeleton, or loading notice while the action is in progress.

**Toast & notice styling**: background follows the app theme (dark/light). No colorful backgrounds. Only the icon inside the notice carries the status color (green check, red X, yellow warning, blue info).

### Shared Components — `components/shared/`

Import from `@/components/shared`.

- **`NoticePanel`** — inline static notice for form-level feedback, error states, and empty states.
  - Types: `"success" | "error" | "warning" | "info" | "neutral" | "loading"`
  - All text props must be localized by the caller.

- **`FloatingNotices`** + **`useNotice`** — imperative floating notices (bottom-right). Provider is mounted globally.
  - Loading pattern: `const id = addNotice({ type: "loading", title: "..." }); ... removeNotice(id);`

- **`ConfirmDialog`** — for all destructive or irreversible actions. `confirmLabel` and `cancelLabel` are required, always localized.

- **Sonner `toast`** — lightweight transient feedback.
  ```tsx
  import { toast } from "sonner";
  toast.success(t("feature.saved"));
  toast.error(t("feature.saveFailed"));
  toast.promise(promise, { loading, success, error });
  ```

**When to use which**: `NoticePanel` for inline form feedback. `toast` / `useNotice` for transient app-level feedback. `ConfirmDialog` for destructive confirmation flows.

## Base UI Conventions

- Base UI composition uses the `render` prop (not Radix `asChild`) on dialog triggers, close controls, and similar primitives.
- **Never nest a `<Button>` (or any element that renders a `<button>`) as a direct child of a Base UI trigger.** Base UI triggers (`DropdownMenuTrigger`, `DialogTrigger`, `TooltipTrigger`, etc.) already render a `<button>` themselves. Wrapping them with a `<Button>` child creates a `<button>` inside a `<button>`, which is invalid HTML and causes a hydration error.
  - ✅ **Correct** — pass `<Button>` via the `render` prop so Base UI merges the props onto it:
    ```tsx
    <DropdownMenuTrigger
      render={
        <Button variant="ghost" size="icon" aria-label={t("actionsLabel")} />
      }
    >
      <MoreHorizontal className="size-4" />
    </DropdownMenuTrigger>
    ```
  - ❌ **Wrong** — `<Button>` child renders a `<button>` nested inside the trigger `<button>`:
    ```tsx
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon">
        <MoreHorizontal />
      </Button>
    </DropdownMenuTrigger>
    ```
- `DialogTrigger`, `TooltipTrigger`, and similar Base UI primitives that have `nativeButton={true}` (the default) **must** receive a native `<button>`-producing element via `render`. Never use `render={<span />}` — it removes native button semantics and causes a runtime warning.
  - To use a Shadcn `Button` as the trigger: `<DialogTrigger render={<Button ...props />}>content</DialogTrigger>`
  - To use an externally-provided element as the trigger: `<DialogTrigger render={children as React.ReactElement} />` (children already contains its own content)
  - The trigger props (onClick, aria-haspopup, aria-expanded, etc.) are merged in by Base UI via element cloning.
- Guard `Select` value handlers — they can receive `null`.

## Internationalization

- Uses `next-intl` with middleware-based locale detection. German is the default, English is the second locale.
- Do not hardcode user-facing copy anywhere — pages, components, dialogs, labels, placeholders, buttons, empty states, notices, tooltips.
- Add every new UI string to both `messages/de.json` and `messages/en.json`.
- Message keys are flat and namespaced: `feature.section.item`.
- Use ü-ä-ö-ß in German messages (not ue-ae-oe-ss).
- Use `useTranslations()` from `next-intl` in client components and `getTranslations()` in server code.
- Keep logs, validation errors, and technical text in English. In-app user-facing notices (success, error, etc.) are always localized.
