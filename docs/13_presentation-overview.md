# See-Sweet Presentation Overview

## Purpose

This document is a slide-ready product brief for PowerPoint use. It summarizes what See-Sweet is, why it exists, what is already built, how it is powered, and where the product is heading next.

## Executive Summary

See-Sweet is a private AI workspace designed to function as a personal executive secretariat. Instead of acting like a generic chatbot, it helps one user stay prepared, organized, and context-aware across conversations, meetings, contacts, decisions, documents, and follow-through.

The product combines an authenticated user workspace, retrieval-backed AI assistance, structured workflow data, and proactive notifications. Its goal is to give an individual the kind of operational leverage usually created by a chief of staff, executive assistant, and disciplined operating cadence.

## Product Vision

### Positioning

See-Sweet should be understood as a private executive operating desk, not a general AI chat app.

### Core promise

- Reduce cognitive load.
- Preserve continuity across work.
- Turn fragmented information into structured support.
- Help the user prepare, decide, coordinate, and follow through with less friction.

### Target users

- Founders managing strategy, hiring, fundraising, and stakeholder communication.
- Senior executives who need preparation, memory, and decision continuity.
- Consultants, advisors, and solo operators handling multiple streams of work.
- Small companies with up to 50 employees that want each worker to benefit from a private AI secretariat inside one shared product environment.

## The Problem It Solves

Most AI products are session-based and generic. They answer prompts, but they do not maintain a reliable operating context around the user's actual work.

See-Sweet solves that by combining:

- Persistent user-scoped memory.
- Structured records for meetings, contacts, tasks, decisions, and knowledge.
- Retrieval-backed chat grounded in user data.
- Proactive briefings and notification workflows.
- Multilingual support for real professional usage.

This allows one customizable product to replace a fragmented stack of separate tools for chat, notes, meeting prep, task follow-up, contact memory, decision logging, and operational briefings.

## Product Pillars

### 1. Private workspace

Every user operates inside an authenticated, user-scoped environment. Data is isolated per user and intended to remain private.

### 2. Grounded AI assistance

The assistant is not answering from the prompt alone. It is informed by stored chats, knowledge chunks, personal info, meetings, contacts, tasks, decisions, and settings.

### 3. Structured executive workflow

The app moves beyond chat by giving the user dedicated systems for relationship management, meeting preparation, action tracking, and decision logging.

### 4. Proactive support

The product surfaces what matters through daily briefings, follow-up prompts, overdue alerts, weekly digests, and contextual notifications.

## Current Feature Set

### Core workspace

- Authenticated private workspace with session-based access.
- Onboarding flow for first-time users.
- Admin panel for internal user management.
- English and German UI.

### AI assistant

- Persistent AI chat backed by a local Ollama model.
- Retrieval-aware system prompt assembled from live user context.
- Thinking mode with hidden reasoning flow.
- Floating chat widget available across the app.
- Assistant settings for tone, name, prompt behavior, and model parameters.

### Knowledge and memory

- Knowledge base for `.txt` and `.md` uploads.
- Chunking, embeddings, and pgvector retrieval.
- Personal info profile injected into assistant context.
- Context slot architecture for scaling new data sources.

### Executive workflow modules

- Contacts with notes, tags, and shareable contact card links.
- Meetings with agenda, participants, summaries, and prep support.
- Tasks with status, priority, due dates, and meeting linkage.
- Decisions with rationale, status, and outcome tracking.
- Reports and briefing views for operational visibility.

### Notifications and automation

- Persistent in-app notification inbox.
- Real-time delivery with Server-Sent Events.
- LLM-generated greetings and briefings.
- Scheduled notifications for overdue tasks, meeting follow-up, and weekly digest.
- Proactive nudges driven by user data patterns.

### Integrations

- Google Calendar read-only OAuth integration.
- Manual and scheduled sync of upcoming events into Meetings.

## What Makes See-Sweet Different

- It is built around a single user's operating context, not a generic team chat room.
- It combines structured workflow data with AI instead of treating AI as a disconnected prompt box.
- It emphasizes continuity, preparation, and follow-through, not just answer generation.
- It runs on a local LLM and local embeddings through Ollama, which supports privacy-oriented deployments.

## Technology Stack

### Application stack

- Next.js 16 with App Router.
- React 19.
- TypeScript 5.
- Tailwind CSS 4.
- shadcn/ui.

### Data and backend

- PostgreSQL 18.
- pgvector for semantic retrieval.
- Prisma 7 as the ORM.
- Better Auth for session-based authentication.
- Zod 4 for request validation.

### AI and real-time systems

- Ollama for local LLM inference.
- Ollama embedding model for knowledge retrieval.
- Server-Sent Events for real-time notifications and streaming behaviors.

### Platform and operations

- Docker Compose for local infrastructure.
- Vercel-compatible cron routes for scheduled jobs.
- Google OAuth 2.0 for Calendar integration.

## Architecture Summary

### Frontend

- Next.js App Router pages and feature-based React components.
- Multilingual UI with flat-key message dictionaries.
- Dedicated feature routes for chat, contacts, meetings, tasks, decisions, reports, knowledge, onboarding, settings, and admin.

### Backend

- Thin API route handlers.
- Business logic organized in `lib/<feature>/` modules.
- User-scoped data access as a core rule.
- Prisma-backed persistence with server-only boundaries.

### AI architecture

- Server-built system prompt.
- Slot-based context assembly for modular prompt enrichment.
- Retrieval from knowledge chunks via embeddings and vector search.
- Shared assistant context across chat, widget, briefings, and notification generation.

## Business and Product Narrative

See-Sweet is not trying to replace enterprise collaboration suites. Its value is personal and small-team leverage.

The product fits users who need a private operational layer that helps them remember context, prepare for conversations, track commitments, and stay ahead of what matters. That makes it especially relevant for executives, founders, high-agency solo professionals, and small companies that want each employee to operate with the support of a personalized digital secretariat.

## Roadmap Summary

### Shipped foundation

1. Foundation: app shell, auth, localization, landing and workspace structure.
2. Chat: persistent retrieval-aware assistant and global widget.
3. Notifications: real-time inbox and LLM-generated messages.
4. Knowledge: document ingestion, vector retrieval, and personal info.
5. Executive workflow: contacts, meetings, tasks, reports, and home briefing.
6. Chief-of-staff layer: decisions, prep packs, post-meeting capture, interaction history, proactive nudges.
7. SaaS launch layer: onboarding, admin tooling, and partial rate limiting.
8. UI/UX polish: contact share links, settings separation, product polish.
9. Integrations and scheduled agent layer: Google Calendar sync, cron-based briefings and follow-ups.
10. Hardening: key production reliability gaps addressed, including calendar sync batching, pagination, token revocation handling, and Zod-backed CRUD validation.

### Next priorities

1. Finish production hardening across remaining UX, timezone, and environment validation gaps.
2. Expand integrations beyond Google Calendar.
3. Add billing and subscription lifecycle support.
4. Add transactional email infrastructure.
5. Continue improving automation quality, trust, and notification hygiene.

### Longer-term opportunity

- Turn See-Sweet into a mature personal chief-of-staff platform.
- Deepen assistant-driven workflow execution while preserving user confirmation on critical writes.
- Potentially expand from strictly personal use into delegated or team-assisted workflows later.

## Suggested PowerPoint Slide Structure

### Slide 1: Title

See-Sweet: A Private AI Executive Secretariat

### Slide 2: The vision

An AI workspace that helps one user operate with the leverage of a chief of staff.

### Slide 3: The problem

Most AI tools answer prompts but do not preserve continuity across meetings, contacts, tasks, decisions, and documents.

### Slide 4: The solution

See-Sweet combines chat, retrieval, structured workflow data, integrations, and proactive support inside one private, customizable workspace that can replace multiple disconnected tools.

### Slide 5: Core capabilities

Chat, knowledge base, contacts, meetings, tasks, decisions, reports, notifications, briefings, and integrations in one customizable system instead of a patchwork of separate apps.

### Slide 6: Why it is different

Private, grounded, workflow-aware, multilingual, and built for operational leverage rather than novelty.

### Slide 7: Tech stack

Next.js, React, TypeScript, PostgreSQL, pgvector, Prisma, Better Auth, Zod, Ollama, SSE, Docker.

### Slide 8: Architecture

Authenticated user-scoped workspace, modular server logic, retrieval-backed AI, and scheduled automation.

### Slide 9: Current maturity

Core product is already functional across executive workflow, knowledge retrieval, notifications, integrations, and onboarding.

### Slide 10: Roadmap

Production hardening, billing, email, more integrations, and deeper chief-of-staff automation.

### Slide 11: Closing message

See-Sweet is designed to become a dependable private operating layer for high-value individual work.

## Presenter Notes

- Emphasize that the product is not another chatbot.
- Use the phrase private executive secretariat consistently.
- Separate what is already built from what is planned.
- Highlight privacy, grounded context, and operational leverage as the core story.
