<!-- 
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 -->
---
description: "Use when working on pages, components, layout, navigation, frontend UX, or localization in See-Sweet. Covers App Router page patterns, UI conventions, and i18n requirements."
name: "See-Sweet Frontend And I18n"
applyTo: "app/**/*.tsx, components/**, messages/**, hooks/**, i18n/**"
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
- If any component doesnt exist inside ui/, npm add shadcn/ui <component> like `npx shadcn@latest add button`.
- Prefer the shared `Alert` component for inline success and error states.
- Use Colored Icons, Badges, Tags, and similar components for status indicators, but avoid adding new ones if the existing set is sufficient.
- Always add cursor-pointer to interactive elements and use the `aria-label` attribute for accessibility on non-text controls.

## Base UI Conventions

- In this repo, Base UI composition uses the `render` prop instead of Radix `asChild` on dialog triggers, dialog close controls, and similar primitives.
- Guard `Select` value handlers because they can receive `null`.
- For client-only hydration guards, prefer the existing `useSyncExternalStore` pattern instead of mounted flags set in effects.

## Internationalization

- Do not hardcode user-facing copy in pages, components, dialogs, form labels, placeholders, buttons, empty states, or notices.
- Add every new UI string to both `messages/en.js` and `messages/de.js`.
- Keep message keys flat and namespaced, following the existing `feature.section.item` pattern.
- German is the default locale. New features must work correctly even when no language has been selected yet.
- Use ü-ä-ö-ß characters in German messages instead of ue-ae-oe-ss.
- Use `getRequestConfig()` in server code when localized messages are needed.
- Use `getMessage()` for localized copy lookup.
- Keep logs, validation errors, and other technical text in English unless the task explicitly requires localization.

## Navigation And Metadata

- Auth pages live under `app/(auth)/`.
- The root page redirects to `/login`.
- Navbar and footer are mounted from the root layout and receive localized messages.
- Prefer `defineSEO()` and `getSeoLocale()` for page metadata instead of hand-rolled metadata objects.
