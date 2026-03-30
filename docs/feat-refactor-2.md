# See-Sweet feat/refactor-2 — UI/UX Polish & Contact Card Share Link

## Plan

### Scope

This branch delivered two categories of work on top of the chief-of-staff layer (feat/core-5):

1. A cross-cutting UI/UX and quality polish pass across the full product.
2. A net-new feature: a 24-hour shareable Contact Card link, usable from the app and the LLM.

---

## Done

### UI / UX

- Removed background color from greeting message pop-ups.
- Added `cursor-pointer` and consistent icon colors to Contact, Task, and Meeting pop-ups.
- Added eye icon to Meeting list rows for a clearer view/detail action.
- Fixed `MeetingList` layout and visual consistency.
- Fixed footer behavior: standardized `min-h-screen` usage across pages so the footer renders consistently and without large gaps when content is short.
- Added pricing and tier information to the landing page (`/`) for unauthenticated visitors.

### i18n

- Added translations for new navbar items.
- AI briefing now supports both English and German based on the user's language setting.

### Settings

- Separated App Settings from Assistant Settings into distinct tabs under `/settings`.
- User language preference is now persisted in `AppSettings` and the database.

### AI / Tool Behavior

- Tool calls now validate entity state: the assistant argues back when referenced entities are missing or already exist (e.g. duplicate contact, meeting with no time).
- Fixed: LLM was unable to link contacts to meetings when creating or editing meeting records.

### Chat Widget

- Fixed double progress bar rendering.
- Verified and stabilized "thinking" indicator behavior.

### DevOps

- Added a GitHub Actions script that automatically bumps the version in `package.json` on each merge to `main`.

### Code Organization

- Moved `OnboardingWizard.tsx` into the `components/` tree.

---

### Feature — 24-Hour Contact Card Share Link

Allows authenticated users (or the LLM on their behalf) to generate a temporary public URL that renders a minimal contact card. The link is valid for 24 hours and requires no authentication to view, making it safe to send to people who do not have a See-Sweet account.

#### How it works

1. The user (or LLM via the `generate_share_link` tool) selects which personal fields to expose: `name`, `email`, `jobTitle`, `company`, `location`, `bio`, `phone`.
2. A `ShareToken` record is created in the database with a 24-hour `expiresAt` timestamp. Any previous active token for the same user is revoked first — only one active link per user at a time.
3. The public URL is `/share/<tokenId>`. It is served by a standalone Next.js page outside the authenticated app shell, marked `noindex, nofollow`.
4. The token can be revoked at any time by the user.

#### Data model — `ShareToken`

| Field       | Type       | Notes                                     |
| ----------- | ---------- | ----------------------------------------- |
| `id`        | `String`   | CUID, used directly as the URL token.     |
| `userId`    | `String`   | Owner; cascades on user delete.           |
| `fields`    | `Json`     | `string[]` of `ShareableFieldKey` values. |
| `expiresAt` | `DateTime` | Set to `now + 24 h` at creation.          |
| `revoked`   | `Boolean`  | Manual revocation flag. Default `false`.  |
| `createdAt` | `DateTime` | Auto.                                     |

#### Shareable field keys

`name` · `email` · `jobTitle` · `company` · `location` · `bio` · `phone`

#### API surface

| Method   | Route                  | Auth     | Description                                                           |
| -------- | ---------------------- | -------- | --------------------------------------------------------------------- |
| `GET`    | `/api/share`           | Required | Returns the current active token for the user.                        |
| `POST`   | `/api/share`           | Required | Creates a new token (revokes existing). Body: `{ fields: string[] }`. |
| `GET`    | `/api/share/[tokenId]` | None     | Resolves and returns the card data for a token.                       |
| `DELETE` | `/api/share/[tokenId]` | Required | Revokes a specific token.                                             |

#### LLM tool — `generate_share_link`

Registered in `lib/chat/tools.ts`. The LLM uses this tool when the user asks to share their contact info or generate a link. If the user does not specify fields, the assistant asks before proceeding. The tool returns the full URL and instructs the LLM to inform the user the link expires in 24 hours.

#### Public page — `/share/[tokenId]`

Resolves the token server-side. Displays a minimal card with only the selected fields. If the token is expired, revoked, or not found, the page shows a friendly "Link not found or expired" message. The page carries `noindex, nofollow` metadata.

---

## Later

- Consider adding a QR code to the public share page for easier mobile sharing.
- Allow users to customize the card appearance (avatar, accent color).
- Support multiple concurrent active tokens per user with named labels.
