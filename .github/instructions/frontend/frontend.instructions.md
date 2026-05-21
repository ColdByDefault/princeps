---
description: "Frontend rules for Princeps pages, components, layout, navigation, UX, hydration, Base UI, shadcn usage, and user feedback."
name: "Princeps Frontend"
applyTo: "app/**/*.tsx,components/**,hooks/**"
---

# Princeps Frontend

Read `CONTEXT/04_FRONTEND_&_i18n_STRUC.md` when frontend behavior is non-trivial. Verify live code before editing.

## Page And Component Structure

- Server pages handle auth, metadata, and initial data assembly. Pass serialized props such as ISO strings and plain objects to client components.
- Client components handle interactivity, local state, and browser APIs.
- Component `.tsx` files should focus on JSX rendering. Extract hooks, state, API calls, and transforms into `components/<feature>/logic/`.
- Move business rules into `lib/features/<feature>/`, not into page or component files.
- Use `@/*` path imports.

## Hydration

- Never use `typeof window !== "undefined"` checks or `useEffect` + `useState` mounted flags for hydration guards.
- Use `useSyncExternalStore(() => () => {}, () => true, () => false)` for client-only rendering gates.
- Ensure server-rendered HTML matches client initial render.
- If a value depends on the browser, defer it to a client component or read it from a prop passed by the server.
- Do not use `suppressHydrationWarning` unless it is on a leaf element displaying a truly volatile value, such as a live timestamp.

## UI Direction

- Visual language: layered cards, rounded surfaces, subtle gradients, and feature-specific layouts. Do not flatten into generic dashboard scaffolding.
- Use existing `components/ui` primitives first.
- Add missing shadcn/ui components via `npx shadcn@latest add <component>`.
- Never edit shadcn source files in `components/ui/` unless the user explicitly approves styling a primitive.
- Use colored icons, badges, and tags for status indicators. Do not add new indicator types if the existing set covers the use case.

## Interactive Elements

- Every button, link, and clickable element must have `cursor-pointer`.
- Every non-text interactive control, such as icon buttons, toggles, and close buttons, must have a localized `aria-label`.
- Every input field must have a localized `placeholder`.
- Use the shadcn `Tooltip` component on icon-only buttons, abbreviated labels, and controls whose purpose is not obvious from text alone.

## Feedback And Notices

Every user-facing action, including create, update, delete, upload, and generate, must show feedback:

- Success: toast or floating notice confirming the action.
- Error: toast, floating notice, or inline `NoticePanel` with the error message.
- Loading/progress: loading spinner, skeleton, or loading notice while the action is in progress.

Toast and notice backgrounds follow the app theme. No colorful backgrounds. Only the icon inside the notice carries the status color.

Import shared components from `@/components/shared`:

- `NoticePanel` for inline static form feedback, error states, and empty states.
- `FloatingNotices` and `useNotice` for imperative app-level floating notices.
- `ConfirmDialog` for destructive or irreversible actions.
- Sonner `toast` for lightweight transient feedback.

All text passed into shared feedback components must already be localized by the caller.

## Base UI Conventions

- Base UI composition uses the `render` prop, not Radix `asChild`, on dialog triggers, close controls, and similar primitives.
- Never nest a `<Button>` or any element that renders a `<button>` as a direct child of a Base UI trigger.
- Base UI triggers such as `DropdownMenuTrigger`, `DialogTrigger`, and `TooltipTrigger` already render a `<button>` by default. Wrapping them around a `<Button>` child creates invalid nested buttons and causes hydration errors.

Correct:

```tsx
<DropdownMenuTrigger
  render={<Button variant="ghost" size="icon" aria-label={t("actionsLabel")} />}
>
  <MoreHorizontal className="size-4" />
</DropdownMenuTrigger>
```

Wrong:

```tsx
<DropdownMenuTrigger>
  <Button variant="ghost" size="icon">
    <MoreHorizontal />
  </Button>
</DropdownMenuTrigger>
```

- `DialogTrigger`, `TooltipTrigger`, and similar primitives with `nativeButton={true}` must receive a native `<button>`-producing element via `render`.
- Never use `render={<span />}` for button-like triggers because it removes native button semantics and can cause runtime warnings.
- Guard `Select` value handlers because they can receive `null`.
