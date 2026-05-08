---
name: princeps-i18n-audit
description: Princeps localization audit workflow. Use when checking or fixing next-intl message parity, hardcoded user-facing strings, missing German or English keys, placeholders, aria labels, tooltips, metadata, navigation labels, notices, dialogs, or German copy quality.
---

# Princeps I18n Audit

Use this skill to audit or repair localization coverage in Princeps.

## Required Reads

Read only what applies:

- `.github/instructions/i18n/i18n.instructions.md` for localization rules.
- `CONTEXT/04_FRONTEND_&_i18n_STRUC.md` for frontend and i18n patterns.
- The relevant components/pages/routes being audited.
- `messages/de.json` and `messages/en.json`.

## Audit Workflow

1. Identify the namespace:
   - Use the feature name as the namespace where possible.
   - Navigation keys usually live under `shell.nav`.
   - Metadata keys usually live under `<feature>.metadata`.

2. Check key parity:
   - Every new or used key exists in both `messages/de.json` and `messages/en.json`.
   - Object shapes match between locales.
   - Dialog headings and descriptions use dedicated keys.

3. Search for hardcoded user-facing text:
   - Pages, components, dialogs, buttons, labels, placeholders, empty states, notices, toasts, tooltips, metadata, and aria labels must be localized.
   - Logs, validation details, route error strings, and developer diagnostics stay in English.

4. Check required UI text:
   - Inputs have localized placeholders.
   - Non-text controls have localized `aria-label`.
   - Icon-only or unclear controls have localized tooltips.
   - User actions have localized success, error, and loading feedback.
   - Destructive dialogs have localized title/body/confirm/cancel copy.

5. Review German quality:
   - Use `ü`, `ä`, `ö`, and `ß` instead of `ue`, `ae`, `oe`, and `ss`.
   - Keep terminology consistent with nearby existing German messages.
   - Avoid translating technical identifiers, schema names, or API details.

## Fix Workflow

- Add missing keys to both locale files in the same namespace.
- Keep key names flat and namespaced, such as `tasks.createDialog.success`.
- Pass localized strings into shared components from the caller.
- Do not call `useTranslations()` inside mutation hooks; pass translated strings from the shell.

## Verification

- Search the edited UI for visible English strings outside translation calls.
- Compare the changed locale object shapes.
- Confirm no technical logs or route error strings were unnecessarily localized.
