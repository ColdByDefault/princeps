<!--
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 -->

---

description: "Use when working on pages, components, layout, navigation, frontend UX, or localization in See-Sweet. Covers App Router page patterns, UI conventions, and i18n requirements."
name: "See-Sweet Frontend And I18n"
applyTo: "app/**/\*.tsx, components/**, messages/**, hooks/**, i18n/\*\*"

---

# See-Sweet Frontend And I18n

## Page And Component Structure

- Use server pages for session checks, metadata, and initial data assembly.
- Use client components for interactivity, local state, and browser APIs.
- Keep page components focused on composition and data flow; move business rules into `lib/<feature>/`.
- Prefer `@/*` imports and keep new files aligned with the repo's existing header comment style.

## UI Direction

- Preserve the current visual language: layered cards, rounded surfaces, subtle gradients, and feature-specific layouts.
- Do not flatten the app into generic dashboard scaffolding.
- Prefer existing `components/ui` primitives before creating new low-level controls, but keep the established custom feature layouts where they already exist.
- Use `npx shadcn@latest add...` to add missing Shadcn UI components instead of writing them, also NEVER EVER touch the shadcn/ui source code, if you need to adjust the styling of a shadcn/ui component, ask for approvment first.
- If any component doesnt exist inside ui/, npm add shadcn/ui <component> like `npx shadcn@latest add button`.
- Use Colored Icons, Badges, Tags, and similar components for status indicators, but avoid adding new ones if the existing set is sufficient.
- Always add cursor-pointer to interactive elements and use the `aria-label` attribute for accessibility on non-text controls.

## Shared Components (`components/shared/`)

These are project-level UI primitives shared across features. Import from `@/components/shared`.

- **`NoticePanel`** — inline static notice for forms, error states, and empty states. No context required. All text props must be localized by the caller.
  - `title` (required), `message` (optional), `onDismiss` (optional), `dismissLabel` (optional — accessible label for the dismiss button, pass a translated string).

  ```tsx
  <NoticePanel
    type="error"
    title={getMessage(messages, "feature.save.errorTitle", "Save failed")}
    message={error}
    dismissLabel={getMessage(messages, "shared.dismiss", "Dismiss")}
    onDismiss={() => setError(null)}
  />
  ```

  Types: `"success" | "error" | "warning" | "info" | "neutral" | "loading"`

- **`FloatingNotices`** + **`useNotice`** — imperative floating notices (bottom-right). Provider is already mounted globally in the root layout. All text passed to `addNotice` must be localized by the caller.
  - `dismissLabel` is optional — pass a translated string if screen-reader accessibility in the active locale matters.

  ```tsx
  const { addNotice, removeNotice } = useNotice();
  addNotice({
    type: "success",
    title: getMessage(messages, "feature.save.success", "Saved"),
    message: getMessage(messages, "feature.save.successBody", ""),
    dismissLabel: getMessage(messages, "shared.dismiss", "Dismiss"),
  });
  // Loading pattern: const id = addNotice({ type: "loading", title: "..." }); then removeNotice(id)
  ```

- **`ConfirmDialog`** — reusable confirm/destructive dialog. `confirmLabel` and `cancelLabel` are required — always pass localized strings. Pass `confirmClassName` for destructive button styling.

  ```tsx
  <ConfirmDialog
    open={open}
    onOpenChange={setOpen}
    title={getMessage(messages, "feature.delete.title", "Delete")}
    description={getMessage(messages, "feature.delete.description", "")}
    confirmLabel={getMessage(messages, "shared.confirm.delete", "Delete")}
    cancelLabel={getMessage(messages, "shared.cancel", "Cancel")}
    confirmClassName="bg-destructive text-white hover:bg-destructive/90"
    onConfirm={handleDelete}
  />
  ```

- **Sonner `toast`** — for lightweight transient feedback (toaster is already globally mounted).
  ```tsx
  import { toast } from "sonner";
  toast.success("Done") /
    toast.error("Failed") /
    toast.promise(promise, { loading, success, error });
  ```

**Guideline**: use `NoticePanel` for form-level feedback, `useNotice` / `toast` for app-level transient feedback, `ConfirmDialog` for all destructive or irreversible confirmation flows.

## Base UI Conventions

- In this repo, Base UI composition uses the `render` prop instead of Radix `asChild` on dialog triggers, dialog close controls, and similar primitives.
- Guard `Select` value handlers because they can receive `null`.
- For client-only hydration guards, prefer the existing `useSyncExternalStore` pattern instead of mounted flags set in effects.

## Internationalization

- Do not hardcode user-facing copy in pages, components, dialogs, form labels, placeholders, buttons, empty states, or notices.
- Add every new UI string to both `messages/en.json` and `messages/de.json`.
- Keep message keys flat and namespaced, following the existing `feature.section.item` pattern.
- German is the default locale. New features must work correctly even when no language has been selected yet.
- Use ü-ä-ö-ß characters in German messages instead of ue-ae-oe-ss.
- Use `getRequestConfig()` in server code when localized messages are needed.
- Use `getMessage()` for localized copy lookup.
- Keep logs, validation errors, and other technical text in English unless they appear in Frontend or the task explicitly requires localization.
