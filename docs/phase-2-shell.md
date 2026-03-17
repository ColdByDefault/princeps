# See-Sweet Phase 2 Shell

## Plan

Phase 2 adds the first shared product shell around the authenticated workspace. The goal is to make navigation consistent across current routes, keep authentication controls visible, and establish placeholder policy destinations without expanding scope into final legal copy yet.

## Done

- Added a shared navbar with authenticated route links for workspace, meetings, and meeting creation.
- Added sign-out, language switching, theme switching, and a responsive hamburger menu for widths below 1000px.
- Mounted a shared footer with placeholder policy and security links.
- Added protected placeholder pages for privacy policy, terms of use, and security.
- Updated the proxy so landing and auth entry routes stay public while all other page routes require authentication.
- Removed phase and rollout-status wording from user-facing workspace screens so internal implementation stages do not appear in the UI.

## Later

- Replace placeholder policy content with final legal and security text.
- Expand the authenticated shell as more Phase 2 routes are added.
- Revisit public route policy if legal pages need to remain accessible without authentication.
