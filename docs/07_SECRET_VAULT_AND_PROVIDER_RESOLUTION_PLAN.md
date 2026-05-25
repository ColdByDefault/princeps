# Secret Vault And Provider Resolution Plan

Last updated: 2026-05-25

## Purpose

Define a scalable plan for user-managed secrets that supports:

- Generic key and value storage through UI.
- Provider-specific runtime resolution for LLMs.
- Integrations that require one or many credentials.
- Model selection rules that are independent from secret storage.

This plan is designed to avoid temporary or throwaway schema work and establish a single long-term foundation.

## Problem Statement

A provider-first implementation can become rigid when:

- Different providers need different key sets.
- Some integrations require multiple keys.
- Model selection and credential selection become tightly coupled.
- Every new provider forces structural rewrites.

The goal is to separate concerns so each concern can evolve independently.

## Guiding Principles

- Secrets are tenant data, not application configuration.
- Secret storage is generic and does not encode provider behavior.
- Runtime provider behavior is controlled by resolvers and policies.
- Model choice is a policy decision, not a secret.
- Secret values are never returned after save.
- All secret access is server-only.

## Target Architecture

### 1) Generic Secret Vault Layer

Responsibilities:

- Accept any key name and value entered by the user.
- Encrypt values at rest with reversible encryption.
- Return only metadata in list and status APIs.
- Support create, replace, delete, and list operations.

Non-responsibilities:

- No provider routing logic.
- No model selection logic.
- No integration-specific validation rules.

### 2) Credential Slot Mapping Layer

Responsibilities:

- Define logical credential slots per provider or integration.
- Map each logical slot to one vault secret key.
- Support integrations that require multiple credentials.
- Allow future validation per slot type.

Examples of logical slot names:

- Primary API key.
- Secondary API key.
- Organization identifier.
- Client identifier.
- Client secret.

### 3) Provider And Integration Runtime Resolver Layer

Responsibilities:

- Resolve effective credentials at request time.
- Apply scope priority rules.
- Return normalized runtime configuration to callers.

Recommended priority order:

1. User-scoped mapped credentials.
2. Workspace-scoped mapped credentials.
3. Environment fallback credentials.
4. Not connected.

### 4) Model Policy Layer

Responsibilities:

- Store and resolve model defaults per provider and per integration.
- Keep runtime defaults such as temperature and timeout.
- Resolve effective model independent of vault entries.

Recommended model precedence:

1. Request-level model override when allowed.
2. Integration-level default model.
3. Provider-level default model.
4. Application global fallback model.

## Why This Solves Multi-Key Integrations

Multi-key integrations are solved by slot mapping, not by special storage rules.

- The vault remains generic.
- Each integration declares required slots.
- The resolver requires all mandatory slots before marking connected.
- Optional slots can enable advanced capabilities without blocking base connectivity.

## Connectivity And Health Model

Connection status should not be based only on key existence.

Suggested states:

- Not configured.
- Configured.
- Verified.
- Invalid credentials.
- Rate limited.
- Provider unavailable.

Status should be updated from real provider responses and surfaced in settings.

## Security Model

- Encrypt at rest with a server-held encryption key.
- Decrypt only inside server-only runtime paths.
- Never return raw secret values after write.
- Redact secrets in logs, errors, and telemetry.
- Track secret metadata and audit-relevant timestamps.

## Rollout Strategy

### Phase 1: Contracts And Resolver Abstraction

- Define shared runtime contracts for resolved credentials and model policy.
- Refactor provider execution paths to consume resolver outputs.
- Keep current environment behavior as the initial resolver backend.

Outcome:

- No persistence change yet.
- Provider call sites become future-proof.

### Phase 2: Generic Vault Persistence

- Introduce durable encrypted secret storage.
- Add metadata-only API endpoints.
- Build settings UI for key and value management.

Outcome:

- User-managed secrets become available.
- Existing env fallback still works.

### Phase 3: Credential Slot Mapping

- Add mapping between runtime slots and vault keys.
- Add validation for required versus optional slots.
- Implement connected and not connected status from mappings.

Outcome:

- Supports single-key and multi-key integrations uniformly.

### Phase 4: Model Policy Management

- Add provider and integration model defaults in settings.
- Resolve effective model per request through policy precedence.
- Keep model logic independent from secret logic.

Outcome:

- Clean control over model behavior without secret coupling.

### Phase 5: Verification, Observability, And Guardrails

- Normalize provider errors into stable product states.
- Add health checks and last-success metadata.
- Add operational dashboards and redaction checks.

Outcome:

- Production-safe operations and predictable debugging.

## Product And UX Expectations

Settings should clearly separate:

- Secret value management.
- Credential mapping status.
- Provider model policy.
- Runtime connection health.

Users should always understand:

- What is configured.
- What is connected.
- Which scope is currently effective.
- Why a provider is unavailable when failures occur.

## Risks And Mitigations

Risk: Secret storage becomes provider-specific over time.
Mitigation: Keep vault schema generic and enforce provider logic in resolvers only.

Risk: Model selection logic is mixed into credential flows.
Mitigation: Keep model policy in separate settings and resolver path.

Risk: Ambiguous precedence causes unexpected runtime behavior.
Mitigation: Define one explicit precedence table and apply it in all call paths.

Risk: Hidden security regressions in logs.
Mitigation: Enforce redaction at logging boundaries and review error payloads.

## Acceptance Criteria For Implementation Start

- Contracts for credential resolution and model policy are finalized.
- Scope precedence is documented and approved.
- Provider execution paths can consume resolver outputs.
- Settings UX boundaries are approved across vault, mappings, and model policy.
- Security constraints are documented for redaction and non-return of secrets.

## Scope For First Delivery

First delivery should focus on:

- Generic resolver abstraction with environment fallback backend.
- Generic vault UI and APIs for key and value management.
- One provider enabled end-to-end through the same generic resolver path.

This keeps the first release small while preserving full scalability for all providers and integrations.
