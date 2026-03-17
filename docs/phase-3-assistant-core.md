# See-Sweet Phase 3 Knowledge Base And Chat

## Plan

Phase 3 should establish the first usable knowledge and chat layer inside the authenticated workspace. The goal is to let a user add personal context and source material, then ask retrieval-backed questions through the in-product assistant.

### Main Core Features

1. Knowledge base.
2. Chat assistant.

This should be the next phase because the product already has the authenticated shell, meeting records, user-scoped data model, and knowledge-related schema groundwork. What is still missing is the user flow that brings personal context, uploaded documents, retrieval, and chat together in one working experience.

### Phase Goal

By the end of Phase 3, an authenticated user should be able to upload supported documents, maintain assistant-facing personal info, ask questions from the home widget or the full chat page, and receive answers grounded in the stored knowledge base, user information, and meeting records.

### MVP User Flow

1. The user signs in and lands in the authenticated workspace.
2. The user opens the knowledge base area and sees two tabs: document uploads and personal info.
3. The user uploads `.txt`, `.pdf`, or `.md` files, or updates the personal info that the assistant should use as context.
4. The server extracts text, chunks it, generates embeddings through the configured Ollama setup, and stores only processed text chunks and related metadata in the database.
5. The system enforces user-tier limits for file uploads and total embedding usage so upload-delete cycles cannot bypass knowledge limits.
6. The user asks a quick question from the `/home` widget or opens `/chat` for the full conversation experience.
7. The assistant retrieves relevant knowledge base, user-info, and meeting context, then responds using the Ollama model defined in environment configuration.

### MVP Screens

1. Knowledge base page with a document upload tab.
2. Knowledge base page with a personal info tab.
3. Simple chat widget inside `/home` with no history, clearly labeled in the UI as stateless.
4. Full `/chat` page with persistent conversation history and message composer.
5. Lightweight source visibility surface for retrieval-backed answers.

### MVP Data Shape

Phase 3 should reuse existing user-scoped models wherever possible and add only the minimum new structures required for document ingestion and chat persistence.

Already available in the schema:

- `Document` and `DocumentChunk` for retrieval-backed knowledge.
- `PersonalInfo` for user profile context.
- `Meeting`, `MeetingActionItem`, and `Decision` for structured operational context.
- `User.tier`, `User.knowledgeCharsUsed`, and `User.knowledgeUploadsUsed` as the starting point for tier-based usage control.

Recommended additions for Phase 3:

- `Conversation` as the parent record for the single persistent `/chat` history per user in Phase 3.
- `ConversationMessage` for stored user and assistant messages, ordered per conversation.
- Optional document-ingestion status fields if the current `Document` model is not enough to represent `processing`, `ready`, and `failed` states.

Recommended minimum fields:

- `Conversation`: `id`, `userId`, `title`, `lastMessageAt`, `createdAt`, `updatedAt`.
- `ConversationMessage`: `id`, `conversationId`, `role`, `content`, `createdAt`.

The stored chat model should remain intentionally small in Phase 3. It should not attempt to persist provider payloads, tool traces, or chain-of-thought data. Source visibility can be rendered from request-time retrieval results rather than being stored.

The document pipeline should store extracted text, chunk text, chunk order, and embeddings in the database. It should not store the uploaded source files themselves.

Knowledge limits should be enforced both by current stored documents and by cumulative embedding usage so users cannot upload, delete, and re-upload to bypass quotas. The quota unit should be based on processed content volume, not only current file count.

Initial tier targets for planning:

- `free`: `20` uploaded files max, `2 MB` per file max, cumulative embedding usage limit still to be finalized.
- `pro`: `50` uploaded files max, `5 MB` per file max, `1,000,000` embedding characters max.
- `premium`: `100` uploaded files max, `10 MB` per file max, cumulative embedding usage limit still to be finalized.

Phase 3 should reuse the existing `PersonalInfo` model and `customFields` support rather than introducing a separate assistant-profile schema.

### Context Assembly

Each assistant answer should be assembled from these context layers:

1. Product-level default assistant behavior defined in server logic.
2. User profile context from `PersonalInfo`.
3. Retrieved knowledge from `DocumentChunk`.
4. Relevant recent conversation history for `/chat`.
5. Structured workspace context from meetings, decisions, and action items.

This keeps the assistant grounded in the user workspace instead of behaving like a generic chat box, while leaving assistant configuration UI for a later phase.

### Priorities

P0 priorities:

1. Knowledge base route with document upload and personal info tabs.
2. Support for `.txt`, `.pdf`, and `.md` ingestion.
3. Server-side text extraction and chunking without storing raw uploaded files.
4. Embedding generation and retrieval through the configured Ollama setup.
5. Tier-based usage control for `free`, `pro`, and `premium` users across upload count, per-file size, and cumulative embedding usage.
6. Simple no-history chat widget inside `/home`, explicitly labeled as stateless in the UI.
7. Authenticated `/chat` route with persistent chat history.
8. Retrieval-backed answers using knowledge base content, personal info, and meetings.
9. Document deletion and re-indexing support.

P1 priorities:

1. Inline source visibility for answers.
2. Better file metadata, status, and ingestion feedback.
3. Better chat history management on `/chat`.
4. Better tier-usage visibility inside the knowledge base UI.

P2 priorities:

1. Assistant behavior configuration pages.
2. Daily briefing generation.
3. Deeper assistant actions such as creating follow-up records from chat.

### API And Logic Shape

The Phase 3 implementation should follow the current repository structure:

- `app/knowledge/` for the knowledge base page.
- `app/chat/` for the full chat page.
- `app/api/knowledge/` for upload, indexing, and personal-info handlers.
- `app/api/chat/` for thin chat handlers.
- `lib/knowledge/` for extraction, chunking, ingestion, and retrieval logic.
- `lib/chat/` for prompt assembly, conversation persistence, and Ollama request orchestration.
- server-side tier enforcement based on authenticated user plan and knowledge usage counters
- Server-only helpers for Prisma access, file parsing, embeddings, and retrieval work.
- Client components only for upload UI, personal-info forms, and chat interactivity.

### Explicitly Out Of Scope

- assistant behavior configuration pages
- autonomous background agents acting without user initiation
- team-shared conversations or delegated assistants
- calendar and email integrations
- storing uploaded source files in the database or filesystem after ingestion
- broad document management UX beyond the minimum needed for retrieval-backed answers
- admin UI for changing user tiers if tier assignment can be handled separately for now
- production-grade distributed rate limiting if local or single-node limits remain acceptable for now

## Done

This scope defines the recommended Phase 3 product slice:

- one knowledge base feature with document upload and personal info tabs
- one chat feature split across a simple stateless `/home` widget and a full `/chat` page
- retrieval-backed answers grounded in stored document chunks, personal info, and meetings
- Ollama-backed embeddings and chat responses using environment-defined model settings
- tier-based limits for knowledge uploads and cumulative embedding usage
- no assistant settings or system configuration UI in this phase
- no raw uploaded file retention after extraction and indexing
- document deletion and re-indexing included in phase scope

## Later

Implementation decisions captured for Phase 3:

1. `/home` chat stays stateless for now and the UI should say so clearly.
2. `/chat` keeps one persistent conversation per user in Phase 3.
3. Document deletion and re-indexing are in scope.
4. Chat should be aware of meetings in addition to knowledge base content and personal info.
5. User tiers should control knowledge-base usage, including upload count, per-file size, and cumulative embedding usage.
6. Personal info should continue using the existing schema.

Open product details still worth deciding:

1. What cumulative embedding usage limits should apply for `free` and `premium` users?
2. Should uploaded-document limits be enforced by count only, or should there also be a total stored-character cap per user in addition to embedding usage?
3. How visible should quota usage be in the knowledge base UI: simple numbers only, or progress bars and warnings?
