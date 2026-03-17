# See-Sweet Phase 3 Tier And Quota Model

## Plan

This document defines the recommended quota model for Phase 3 knowledge-base usage. The design is intentionally pragmatic: enforce limits server-side, keep the quota units understandable, and block upload-delete cycles from bypassing embedding costs.

## Quota Goals

Phase 3 quotas should control three different things:

1. Current active document count.
2. Maximum raw upload size per file.
3. Cumulative embedding usage over the lifetime of the user account.

These three limits solve different problems:

- document count controls ongoing storage and retrieval clutter
- per-file size controls parser and ingestion cost spikes
- cumulative embedding usage prevents users from uploading, deleting, and re-uploading to bypass limits

## Recommended Tier Limits

Recommended starting values:

1. `free`
   - `20` active documents max
   - `2 MB` max upload size per file
   - `250,000` cumulative embedding characters max
2. `pro`
   - `50` active documents max
   - `5 MB` max upload size per file
   - `1,000,000` cumulative embedding characters max
3. `premium`
   - `100` active documents max
   - `10 MB` max upload size per file
   - `3,000,000` cumulative embedding characters max

These embedding-character numbers are recommendations, not technical requirements. They are sized to make the tiers visibly different while still keeping costs bounded.

## Quota Unit Definitions

Use these quota units consistently in code and UI:

1. `activeDocuments`
   - Count of currently stored `Document` rows for the user.
   - Deleting a document reduces this count.
2. `maxUploadBytes`
   - Maximum allowed uploaded file size before parsing.
   - Enforced directly from the uploaded file metadata.
3. `embeddingCharsUsed`
   - Lifetime total of characters that were accepted for embedding generation.
   - Deleting a document does not refund this usage.
4. `embeddingCharsLimit`
   - Maximum cumulative character volume allowed for the user tier.

For Phase 3, base cumulative usage on extracted text character count, not token count. Character counting is simpler, deterministic, and easy to explain in the UI.

## Schema Recommendation

The current schema already has a good start on the `User` model:

- `tier`
- `knowledgeCharsUsed`
- `knowledgeUploadsUsed`

Recommended interpretation and extension:

1. Reuse `User.tier` as the source of truth for quota lookup.
2. Reuse `User.knowledgeCharsUsed` as the cumulative lifetime embedding-character counter.
3. Reuse `User.knowledgeUploadsUsed` as the cumulative count of successful document ingestions.
4. Do not use `knowledgeUploadWindowStartedAt` for Phase 3 quota enforcement if quotas are lifetime-based rather than rolling-window based.
5. Add document-level metadata needed for quota, deletion, and re-indexing behavior.

Recommended `Document` additions:

- `fileName String?`
- `mimeType String?`
- `fileSizeBytes Int?`
- `status String @default("processing")` with values such as `processing`, `ready`, `failed`
- `embeddingChars Int @default(0)`
- `indexedAt DateTime?`
- `lastError String?`
- optional `contentHash String?` if deduplication or upload-replacement detection becomes useful

Recommended chat additions remain separate from the quota model:

- `Conversation`
- `ConversationMessage`

## Enforcement Rules

### Upload

On upload, the server should enforce limits in this order:

1. Authenticate the user.
2. Read the user tier.
3. Check current active document count against the tier max.
4. Check uploaded file size against the tier per-file max.
5. Parse and extract text.
6. Normalize extracted text.
7. Compute extracted character count.
8. Check whether `knowledgeCharsUsed + extractedCharCount` would exceed the tier cumulative limit.
9. If allowed, create the document in `processing` state.
10. Chunk, embed, store chunks, then mark the document `ready`.
11. Increment `knowledgeCharsUsed` by the accepted extracted character count.
12. Increment `knowledgeUploadsUsed` by `1` only after successful ingestion.

If parsing or embedding fails after acceptance, the document should end in `failed` state and the implementation should decide whether cumulative usage is charged only after success. For Phase 3, the simpler rule is: only increment cumulative usage after successful indexing.

### Delete

On delete, the server should:

1. Verify user ownership.
2. Delete chunks and the document.
3. Reduce active document count naturally through the remaining `Document` rows.
4. Keep `knowledgeCharsUsed` unchanged.
5. Keep `knowledgeUploadsUsed` unchanged.

Delete should never refund cumulative embedding usage.

### Re-index

Phase 3 re-index should mean re-generating chunks and embeddings from the already stored extracted text for an existing document.

Recommended rule:

1. Re-index does not count as a new upload.
2. Re-index does not increment `knowledgeUploadsUsed`.
3. Re-index does not increment `knowledgeCharsUsed` if the text content is unchanged.
4. If future product behavior allows replacing document content, treat that as a new ingestion, not a simple re-index.

This keeps re-indexing useful for bug fixes or chunking improvements without punishing users twice.

## Server Logic Recommendation

Define quota values in one server-only module, for example `lib/knowledge/quota.logic.ts`.

Recommended exports:

1. `KNOWLEDGE_TIER_LIMITS`
2. `getKnowledgeTierLimits(tier)`
3. `getUserKnowledgeUsage(userId)`
4. `assertUploadAllowed(user, fileSizeBytes, activeDocumentCount)`
5. `assertEmbeddingAllowed(user, extractedCharCount)`
6. `buildKnowledgeUsageSnapshot(user, activeDocumentCount)`

Keep all final enforcement inside server logic even if the client shows limits proactively.

## UI Recommendation

The knowledge-base UI should show:

1. current active document count versus max
2. max upload size for the user tier
3. cumulative embedding usage versus limit
4. whether the user is `free`, `pro`, or `premium`
5. a clear note that deleting a document does not refund embedding usage

For Phase 3, simple numeric summaries are enough. Progress bars are optional polish, not a requirement.

## Error Model

Tier-limit failures should return clear English errors such as:

- `Document limit reached for your plan.`
- `File exceeds the upload size limit for your plan.`
- `Embedding usage limit reached for your plan.`
- `Document re-index failed.`

These errors can later be wrapped in localized UI copy if needed, but the server response format should stay simple.

## Meeting Context And Quotas

Meeting data should be available to chat as retrieval context, but meeting records should not count against knowledge-base upload quotas. They are part of the product's structured workspace context, not uploaded knowledge.

## Recommendations

1. Use one persistent `/chat` conversation per user in Phase 3.
2. Keep quota enforcement entirely server-side.
3. Treat cumulative embedding usage as lifetime usage, not a rolling window, for Phase 3.
4. Reuse the existing `PersonalInfo` model rather than creating a parallel assistant-profile schema.
5. Do not add a total stored-character cap yet unless document volume becomes a retrieval-quality problem in practice.

## Done

This design defines a concrete quota approach for Phase 3:

- tier-based limits are enforced by active document count, per-file size, and cumulative embedding usage
- cumulative embedding usage is the anti-bypass control
- re-index is supported without double-charging when content does not change
- meetings remain available to chat without consuming upload quota

## Later

Potential later improvements:

1. Replace character-based usage with token-based accounting if cost modeling needs more precision.
2. Add deduplication or replacement detection via `contentHash`.
3. Introduce rolling windows only if business policy later requires renewable monthly quotas.
4. Add admin tooling for tier assignment and quota inspection.
