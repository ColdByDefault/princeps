# See-Sweet Phase 3 Module Map

## Plan

This document maps the approved Phase 3 scope onto the current repository structure. The goal is to keep implementation aligned with existing feature conventions: thin routes, server-only business logic in `lib/<feature>/`, feature components grouped together, and shared contracts in `types/`.

## Route Map

### Pages

Recommended authenticated page routes:

1. `app/knowledge/page.tsx`
   - server page
   - loads localized messages
   - loads current user knowledge usage, documents, and `PersonalInfo`
   - composes the knowledge base feature UI
2. `app/chat/page.tsx`
   - server page
   - loads localized messages
   - loads the single persistent conversation for the authenticated user
   - composes the full chat UI
3. `app/home/page.tsx`
   - keep existing page
   - add a small stateless chat widget section without turning `/home` into the primary chat page

### API Routes

Recommended API route structure:

1. `app/api/knowledge/route.ts`
   - `GET` list documents and usage snapshot
   - `POST` upload and ingest a new document
2. `app/api/knowledge/[documentId]/route.ts`
   - `DELETE` remove a document
3. `app/api/knowledge/[documentId]/reindex/route.ts`
   - `POST` re-index an existing document from stored extracted text
4. `app/api/knowledge/personal-info/route.ts`
   - `GET` read assistant-facing personal info
   - `PATCH` update assistant-facing personal info using the existing schema
5. `app/api/chat/route.ts`
   - `GET` load the persistent `/chat` conversation for the authenticated user
   - `POST` send a persistent chat message and return assistant response plus sources
6. `app/api/chat/widget/route.ts`
   - `POST` send a stateless home-widget message and return assistant response plus sources

This split keeps persistent and stateless chat behavior explicit and avoids overloading one handler with two modes.

## Component Map

### Knowledge Feature

Recommended feature folder:

1. `components/knowledge/index.ts`
   - exports the main knowledge feature components
2. `components/knowledge/KnowledgePageView.tsx`
   - main knowledge page layout
3. `components/knowledge/KnowledgeTabs.tsx`
   - tab switcher between documents and personal info
4. `components/knowledge/KnowledgeUploadPanel.tsx`
   - upload form and file-limit messaging
5. `components/knowledge/KnowledgeDocumentList.tsx`
   - list of indexed documents with state, metadata, delete, and re-index actions
6. `components/knowledge/KnowledgeUsageCard.tsx`
   - tier name, document count, upload size limit, and embedding usage summary
7. `components/knowledge/PersonalInfoForm.tsx`
   - editor for existing `PersonalInfo` fields and `customFields`
8. `components/knowledge/shared.tsx`
   - formatting helpers, status badges, and small shared UI helpers for the feature

### Chat Feature

Recommended feature folder:

1. `components/chat/index.ts`
   - exports the main chat feature components
2. `components/chat/ChatPageView.tsx`
   - main `/chat` page layout
3. `components/chat/ChatThread.tsx`
   - message list renderer
4. `components/chat/ChatComposer.tsx`
   - message input and submit controls
5. `components/chat/ChatSourceList.tsx`
   - request-time source display for answers
6. `components/chat/HomeChatWidget.tsx`
   - stateless `/home` chat widget with clear UI note
7. `components/chat/shared.tsx`
   - message formatting helpers, source labels, empty-state helpers

This mirrors the `components/meetings/` pattern already used in the repo.

## Library Map

### Knowledge Logic

Recommended folder:

1. `lib/knowledge/`

Recommended files:

1. `lib/knowledge/shared.logic.ts`
   - common schemas, constants, selects, and helper types
2. `lib/knowledge/quota.logic.ts`
   - tier lookup and server-side quota assertions
3. `lib/knowledge/list.logic.ts`
   - list user documents and build usage snapshot
4. `lib/knowledge/upload.logic.ts`
   - upload validation, extraction, quota checks, document creation, chunk persistence
5. `lib/knowledge/delete.logic.ts`
   - user-scoped delete behavior
6. `lib/knowledge/reindex.logic.ts`
   - rebuild chunks and embeddings from stored extracted text
7. `lib/knowledge/personal-info.logic.ts`
   - read and update `PersonalInfo`
8. `lib/knowledge/extract.logic.ts`
   - file parsing for `.txt`, `.md`, and `.pdf`
9. `lib/knowledge/chunk.logic.ts`
   - deterministic text chunking
10. `lib/knowledge/embed.logic.ts`

- Ollama embedding calls and related normalization

11. `lib/knowledge/retrieve.logic.ts`

- document retrieval queries for chat context

All of these should remain server-only.

### Chat Logic

Recommended folder:

1. `lib/chat/`

Recommended files:

1. `lib/chat/shared.logic.ts`
   - shared schemas, selects, and helper constants
2. `lib/chat/get.logic.ts`
   - load the user's single persistent conversation
3. `lib/chat/send.logic.ts`
   - send and persist a `/chat` message
4. `lib/chat/widget.logic.ts`
   - send a stateless `/home` widget message
5. `lib/chat/prompt.logic.ts`
   - assemble prompt context from defaults, personal info, meetings, retrieval, and history
6. `lib/chat/provider.logic.ts`
   - Ollama chat request orchestration
7. `lib/chat/conversation.logic.ts`
   - ensure the user has exactly one Phase 3 persistent conversation
8. `lib/chat/sources.logic.ts`
   - normalize and format request-time source metadata returned to the client

### Meeting Context Reuse

Existing meeting logic should remain in `lib/meetings/`. Chat logic should consume meeting context through read-only helper functions rather than duplicating meeting query logic inside `lib/chat/`.

Recommended additions:

1. `lib/meetings/context.logic.ts`
   - query the most relevant user-scoped meetings, decisions, and action items for chat context

## Types Map

Recommended shared contracts:

1. `types/knowledge.ts`
   - document list items
   - upload payloads and route responses
   - usage snapshot shape
   - document status types
2. `types/chat.ts`
   - conversation type
   - message type
   - source type
   - request and response payloads

Keep these client-safe and avoid importing Prisma or server-only helpers into them.

## Environment And Provider Boundaries

Recommended environment-dependent behavior:

1. Ollama model names and connection settings should stay in environment configuration and server-only logic.
2. Parsing, embedding, and chat provider calls should never be reachable from client import chains.
3. The `/home` widget and `/chat` UI should only talk to API routes or server actions, never directly to Ollama.

## Suggested Implementation Order By Module

1. `types/knowledge.ts`
2. `types/chat.ts`
3. Prisma schema updates for documents and conversations
4. `lib/knowledge/shared.logic.ts`
5. `lib/knowledge/quota.logic.ts`
6. extraction, chunking, embedding, and upload logic
7. knowledge API routes
8. knowledge components and page
9. `lib/meetings/context.logic.ts`
10. `lib/chat/shared.logic.ts`
11. conversation, prompt, provider, and send logic
12. chat API routes
13. chat components and page
14. `/home` widget integration

## Done

This module map keeps Phase 3 aligned with current repository structure:

- page composition stays in `app/`
- feature UI stays in `components/<feature>/`
- business logic stays in `lib/<feature>/`
- shared client-safe contracts stay in `types/`
- persistent and stateless chat flows are split cleanly

## Later

Possible refinements after Phase 3:

1. Add a dedicated `lib/ollama/` folder if embedding and chat provider logic grows beyond a small surface.
2. Introduce streaming chat responses if the current UX needs it.
3. Add conversation threading only after the single-conversation model proves insufficient.
