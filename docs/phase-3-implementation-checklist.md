# See-Sweet Phase 3 Implementation Checklist

## Plan

This checklist turns the approved Phase 3 scope into an implementation sequence. The focus stays narrow: knowledge base ingestion, personal info context, tier-limited usage, a stateless home chat widget, and a persistent `/chat` experience backed by Ollama and retrieval.

### Recommended Build Order

1. Data model updates for chat persistence and knowledge usage enforcement.
2. Knowledge ingestion pipeline for `.txt`, `.pdf`, and `.md`.
3. Knowledge base UI for uploads, personal info, and document management.
4. Chat API and retrieval orchestration using Ollama.
5. `/home` chat widget and `/chat` page.
6. Quota feedback, source visibility, and polish.

### Implementation Checklist

1. Add the minimum Prisma changes for Phase 3.
   - Add `Conversation`.
   - Add `ConversationMessage`.
   - Extend knowledge usage tracking only where current `User` counters are insufficient for quota enforcement.
   - Add document ingestion status fields if needed for `processing`, `ready`, and `failed`.

2. Define the tier-quota rules in server logic.
   - `free`: `20` files max, `2 MB` per file max, embedding limit pending.
   - `pro`: `50` files max, `5 MB` per file max, `1,000,000` embedding characters max.
   - `premium`: `100` files max, `10 MB` per file max, embedding limit pending.
   - Enforce cumulative embedding usage so delete and re-upload cannot bypass limits.

3. Build knowledge ingestion helpers in `lib/knowledge/`.
   - Parse `.txt`, `.md`, and `.pdf`.
   - Normalize extracted text.
   - Chunk text deterministically.
   - Generate embeddings with the configured Ollama setup.
   - Store only processed text, chunk metadata, and embeddings.
   - Do not retain raw uploaded files.

4. Add knowledge base API routes in `app/api/knowledge/`.
   - Upload and ingest a document.
   - List documents.
   - Delete a document.
   - Re-index a document.
   - Read and update `PersonalInfo`.
   - Return clear English error responses and tier-limit failures.

5. Build the knowledge base page.
   - Add a documents tab for uploads and document management.
   - Add a personal info tab using the existing `PersonalInfo` shape and `customFields`.
   - Show document ingestion states.
   - Show tier usage and remaining limits.
   - Make delete and re-index actions explicit.

6. Build chat logic in `lib/chat/`.
   - Assemble prompts from default behavior, `PersonalInfo`, knowledge retrieval, meetings, and recent chat history.
   - Call the Ollama model defined in environment configuration.
   - Persist `/chat` messages.
   - Keep `/home` widget messages stateless.
   - Render source visibility from request-time retrieval results rather than persisting it.

7. Add chat API routes in `app/api/chat/`.
   - Send a message from `/chat` with persistence.
   - Send a stateless message from `/home`.
   - Load the single persistent conversation for the authenticated user.
   - Return relevant retrieval sources with each response.

8. Build the `/chat` page.
   - One persistent conversation per user in Phase 3.
   - Message list and composer.
   - Source visibility per assistant answer.
   - Empty state for first use.

9. Add the `/home` widget.
   - Keep it clearly labeled as stateless.
   - Support a quick question and answer flow.
   - Offer a clear path into `/chat` for longer exchanges.

10. Connect meetings into assistant context.

- Retrieve relevant meetings, decisions, and action items when helpful.
- Keep meeting access strictly user-scoped.
- Prevent meeting context from drowning out higher-signal document retrieval.

11. Add operational safeguards.

- Reuse rate limiting for knowledge and chat endpoints.
- Handle parser failures and embedding failures cleanly.
- Avoid partial document states that leave orphaned chunks.
- Keep Prisma and parsing code server-only.

12. Finish UX and verification.

- Add localized user-facing strings for new screens and controls.
- Keep technical and error text in English.
- Verify unauthenticated users cannot access knowledge or chat pages.
- Run targeted validation when implementation work starts landing.

## Done

This checklist defines the intended implementation order for Phase 3 and reflects the current product decisions:

- `/home` chat is stateless.
- `/chat` has one persistent conversation per user.
- knowledge base supports upload, delete, and re-index.
- chat uses knowledge base, personal info, and meetings.
- assistant configuration stays out of scope.
- Prisma schema now includes Phase 3 conversation persistence and document ingestion metadata.
- `lib/knowledge/` now has the initial shared, quota, extraction, chunking, and embedding helpers needed for the next API-layer step.
- `lib/knowledge/` now includes list, upload, delete, re-index, and personal-info server logic.
- `app/api/knowledge/` now includes thin handlers for list/upload, delete, re-index, and personal-info flows.
- `types/chat.ts` now exists for conversation, message, source, and reply contracts.
- `lib/chat/` now includes conversation loading, prompt assembly, Ollama provider calls, persistent send logic, and stateless widget send logic.
- `app/api/chat/` now includes handlers for persistent chat and stateless widget chat.
- `/knowledge` now has an authenticated UI for uploads, document management, quota visibility, and personal info editing.
- `/chat` now has an authenticated persistent conversation UI with request-time source visibility.
- `/chat` now supports progressive answer rendering, with non-stream fallback when the local model does not yield a usable streamed final answer.
- `/home` now includes a clearly labeled stateless chat widget that routes longer usage into `/chat`.
- the navbar now exposes `/knowledge` and `/chat` for authenticated users.
- Phase 3 MVP is now functionally ship-ready for an internal or controlled release: auth, upload, retrieval, delete, re-index, stateless home chat, persistent chat, source visibility, and model fallback behavior are all implemented and validated.

## Later

Open details that still need refinement after the first Phase 3 pass:

1. Set the cumulative embedding usage limits for `free` and `premium`.
2. Decide whether to add a total stored-character cap in addition to upload count and embedding usage.
3. Decide how rich the quota UI should be in the knowledge base page.
4. Optional polish: broader `.md` and `.pdf` runtime smoke coverage, richer quota visuals, and stronger source presentation.
5. Phase 4 can start once the remaining quota-policy decisions are accepted as follow-up polish rather than Phase 3 blockers.
