# 04 - Frontend & i18n Structure

Last updated: 2026-05-07

Read this when working on pages, components, layouts, navigation, client hooks, UI feedback, hydration safety, or localized copy.

Reference features:

- `tasks` is the best full frontend reference: server page, shell, card, create/edit dialogs, mutation hook, filters, refresh, delete confirmation.
- `labels` is a compact UI reference, but it keeps more behavior inside one shell than new full features should.

## Frontend Principle

Server pages prepare data. Client components render and handle interaction. Business rules stay in `lib/`. User-facing text is always localized.

Normal frontend flow:

```text
app/(app)/<feature>/page.tsx
  -> authenticate
  -> load initial data from lib/features/<feature>/
  -> pass plain serialized props to components/<feature>/<Feature>Shell

components/<feature>/<Feature>Shell.tsx
  -> own list/filter/dialog state
  -> render cards, dialogs, empty states, refresh button
  -> call hooks from components/<feature>/logic/

components/<feature>/logic/use<Feature>Mutations.ts
  -> call app/api/<feature>/
  -> update shell state
  -> show localized success/error feedback
```

## Server Pages

Feature pages live at `app/(app)/<feature>/page.tsx`.

They should:

- Generate localized metadata with `getTranslations()`.
- Authenticate with Better Auth server helpers.
- Redirect unauthenticated users to `/login`.
- Fetch initial user-scoped data from `lib/features/<feature>/`.
- Pass plain props to the client shell.
- Avoid client state, browser APIs, and business logic.

Example reference: `app/(app)/tasks/page.tsx`.

```tsx
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/login");

const [tasks, labels, goals] = await Promise.all([
  listTasks(session.user.id),
  listLabels(session.user.id),
  listGoals(session.user.id),
]);

return <TasksShell initialTasks={tasks} availableLabels={labels} />;
```

## Component Folder Shape

Full features should prefer this shape:

```text
components/<feature>/
  index.ts
  <Feature>Shell.tsx
  <Feature>Card.tsx
  Create<Feature>Dialog.tsx
  Edit<Feature>Dialog.tsx
  logic/
    use<Feature>Mutations.ts
```

Responsibilities:

- `index.ts` exports public components only.
- `Shell` owns page-level state: records, filters, selected edit/delete target, refresh state.
- `Card` renders one record and raises events to the shell.
- `Create*Dialog` and `Edit*Dialog` own form state and submit through props.
- `logic/use*Mutations.ts` owns API calls, loading flags, optimistic/local state updates, and toasts.

Keep `.tsx` files focused on JSX and composition. Move repeated behavior, fetch calls, and mutation orchestration into `logic/`.

## Shell Pattern

Use `components/tasks/TasksShell.tsx` as the reference.

A shell usually includes:

- A constrained page wrapper.
- Header with localized page title.
- Refresh button using `useTransition`.
- Create dialog trigger.
- Optional filter tabs.
- Empty state.
- List of cards.
- Edit dialog.
- Delete confirmation dialog at shell level.

Card components should not own destructive confirmation state. They call `onDelete(id)`, and the shell opens the confirmation dialog.

Refresh pattern:

```tsx
const [isPendingRefresh, startRefresh] = useTransition();

function handleRefresh() {
  startRefresh(async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) {
      const { tasks: updated } = (await res.json()) as { tasks: TaskRecord[] };
      setTasks(updated);
    }
  });
}
```

## Dialog And Form Pattern

Create and edit dialogs should usually be separate components.

- Create dialogs initialize blank state.
- Edit dialogs initialize from props and are key-remounted by the shell when the target item changes.
- Forms submit through `onSubmit` props and close only after success.
- Required fields show a visible required marker.
- Optional fields show a muted optional hint.
- Every input has a localized placeholder.
- Submit buttons show pending text or are disabled while work is in progress.

Use the Zod schema as the source for required vs optional fields, not a UI guess.

## Mutation Hooks

Use `components/tasks/logic/useTaskMutations.ts` as the reference.

Mutation hooks should:

- Receive the shell state setter.
- Receive already-localized strings as a plain object.
- Track `creating`, `updating`, and `deleting` state.
- Call `fetch()` against API routes.
- Update local state from the API response.
- Show success/error feedback.
- Return booleans so dialogs know whether to close.

Do not call `useTranslations()` inside mutation hooks. The shell translates and passes the strings in.

## Cards And Actions

Cards render one record and expose callbacks.

Rules:

- Use semantic status/priority indicators such as `Badge`, labels, icons, and muted metadata.
- Every clickable element has `cursor-pointer`.
- Icon-only controls have localized `aria-label`.
- Icon-only or unclear controls have tooltips.
- Dropdown triggers use the Base UI `render` prop with a `Button`.
- Do not nest a `<Button>` inside a trigger that already renders a button.

Example reference: `components/tasks/TaskCard.tsx` uses localized action labels, `Tooltip`, `DropdownMenu`, `Badge`, and callback props.

## Shared UI

Use existing UI before custom markup.

- `components/ui/` contains shadcn primitives. Add missing primitives through shadcn tooling; do not casually edit these files.
- `components/shared/` contains project-level components such as notice panels and confirmation helpers.
- Use `sonner` toast for lightweight transient feedback.
- Use inline notices for form-level or page-level states.
- Use confirmation dialogs for destructive actions.

Toast and notice backgrounds follow the app theme. Status color belongs on the icon or indicator, not a full bright notice background.

## i18n Rules

Princeps uses `next-intl`.

- German is the default locale.
- English is the second locale.
- Add every user-facing string to both `messages/de.json` and `messages/en.json`.
- Use flat, namespaced keys under the feature name.
- Use `useTranslations("<namespace>")` in client components.
- Use `getTranslations("<namespace>")` in server pages or server code.
- Use proper German characters: `ä`, `ö`, `ü`, `ß`, not `ae`, `oe`, `ue`, `ss`.
- Logs, route error strings, and validation details can stay English.
- Buttons, labels, placeholders, empty states, dialogs, toasts, tooltips, metadata, and aria labels are user-facing and must be localized.

Example namespace from `messages/en.json` and `messages/de.json`:

```json
"tasks": {
  "metadata": { "title": "Tasks", "description": "Manage your tasks." },
  "pageTitle": "Tasks",
  "newTask": "New task",
  "empty": "No tasks yet.",
  "fields": {
    "title": "Title",
    "titlePlaceholder": "Task title",
    "optional": "Optional"
  },
  "createDialog": {
    "heading": "New task",
    "submit": "Create",
    "submitting": "Creating...",
    "success": "Task created.",
    "error": "Failed to create task."
  }
}
```

German file must contain the same keys with German text.

## Hydration Safety

Avoid server/client render mismatches.

- Do not use `typeof window !== "undefined"` checks as hydration guards.
- Do not use `useEffect` + mounted state just to hide mismatches.
- Use `useSyncExternalStore(() => () => {}, () => true, () => false)` for true client-only gates.
- Browser-dependent values should be read in client components or passed from the server.
- `suppressHydrationWarning` is only for truly volatile leaf values.
- Guard Base UI select value handlers because they can receive `null`.

## Navigation

Navigation lives in `components/navigation/`.

When adding a page:

- Add the page route under `app/(app)/<feature>/page.tsx`.
- Add the nav item with an icon.
- Add the nav label to both message files.
- Make sure active route behavior and mobile navigation still work.

## Frontend Checklist

Before finishing frontend work, verify:

- Server page authenticates and passes serialized props.
- Client components do not import server-only modules or `@/lib/core/db`.
- Business rules are not embedded in JSX components.
- Feature has a barrel `index.ts`.
- API calls and mutation state live in `components/<feature>/logic/` for full features.
- Create/edit/delete actions show localized feedback.
- Destructive actions require confirmation.
- Every user-facing string exists in both locale files.
- Inputs have localized placeholders.
- Icon-only controls have localized `aria-label` and tooltips where needed.
- Buttons and clickables have `cursor-pointer`.
- Hydration-sensitive code follows the project pattern.
