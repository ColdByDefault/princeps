# Contributing to Princeps

Thank you for your interest in contributing. This document covers the essentials for working on this codebase.

## Project Structure

Princeps follows a strict feature-based architecture. Before making changes, read the workspace instructions:

- `.github/instructions/main.instructions.md` — architecture and layer boundaries
- `.github/instructions/feature.instructions.md` — canonical template for every feature
- `.github/instructions/server-data.instructions.md` — API routes, Prisma, auth, tools
- `.github/instructions/frontend-i18n.instructions.md` — pages, components, i18n

## Development Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start the database
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Start the dev server
npm run dev
```

## Before You Submit

Run all three checks and make sure they pass:

```bash
npm run lint
npm run typecheck
npm run build
```

## Pull Request Guidelines

- One feature or fix per PR — keep scope tight
- Reference the related issue in the PR description (e.g. `Closes #77`)
- Every new feature needs translations in both `messages/de.json` and `messages/en.json`
- No hardcoded user-facing strings — all copy goes through `next-intl`
- Server-only modules must include `import "server-only"` at the top
- Do not let client imports reach `@/lib/db`

## Branching

```
main          — stable, always deployable
feature/<name> — new features
fix/<name>     — bug fixes
```

## Commit Style

Use conventional commits:

```
feat: add briefings context slot
fix: widget tier enforcement bypass
chore: update dependencies
```

## Reporting Issues

Use GitHub Issues. Check existing issues before opening a new one.
Bug reports should include steps to reproduce, expected behavior, and actual behavior.
