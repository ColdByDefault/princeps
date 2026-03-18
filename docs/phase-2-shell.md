# See-Sweet Phase 2 Shell

## Plan

Phase 2 adds the first shared product shell around the authenticated workspace. The goal is to make navigation consistent across current routes, keep authentication controls visible, and establish placeholder policy destinations without expanding scope into final legal copy yet.

## Done

- Added a shared navbar with authenticated route links for workspace, meetings, and meeting creation.
- Added sign-out, language switching, theme switching, and a responsive hamburger menu for widths below 1000px.
- Mounted a shared footer with placeholder policy and security links.
- Added public placeholder pages for privacy policy, terms of use, and security.
- Updated the proxy so landing, auth entry, and policy routes stay public while the authenticated workspace routes require authentication.
- Removed phase and rollout-status wording from user-facing workspace screens so internal implementation stages do not appear in the UI.
- Kept policy and security content intentionally as placeholders for a later project stage instead of expanding scope inside Phase 2.
- Confirmed the login and sign-up messaging still matches the current See-Sweet positioning; the real auth mismatch was disabled social OAuth in the environment, so those providers are now commented out until credentials are supplied.

## Later

- Replace placeholder policy content with final legal and security text.
- Expand the authenticated shell as more Phase 2 routes are added.
