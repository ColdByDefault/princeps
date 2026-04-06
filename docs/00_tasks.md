# features

- [ ] Tools:
  - [ ] Meetings — schema complete (participants, agenda, summary, prepPack, linked to Tasks/Decisions/Contacts)
  - [ ] Decisions — schema complete, linked to meetings
  - [ ] Briefings — BriefingCache model exists; daily LLM brief over tasks/meetings/decisions
  - [ ] Tools-usage Reports — AssistantReport model exists
  - [ ] Goals — needs schema design (structure, milestones, link to tasks)
  - [ ] Notes — needs schema; lightweight freeform records, simpler than knowledge docs
  - [ ] Calendar (Google integration) — Integration model exists with `google_calendar`; depends on Meetings done first
  - [ ] Generate Contact Card Link for user to share with non-authenticated Users, Link is valid for 24h. User can generate manually from their profile page, or LLM can generate when user calls the tool in chat (e.g. "Generate a contact card link for John Doe"). User chooses what info to include. ShareToken model exists.
  - [ ] Rich Document Support (PDF, Word, Excel, etc.)
- [ ] User Profile Settings: Allow users to change their name, username, timezone. Email/password changes need careful handling with Better Auth. ProfileShell is currently read-only.
- [ ] Slash Commands in Chat: Allow power users to bypass conversational pleasantries. Typing /task Buy plane tickets or /decision Go with the standard tier
- [ ] Extend the LLM-awareness => LLM isn't just able to call tools or see contexts, but also can link stuff together, e.g. link a contact to a meeting, or link a note to a decision. Depends on Meetings + Decisions being live.
- [ ] Change the availability of tools based on tier.
- [ ] Admin Dashboard: User management, content moderation, system health monitoring, usage analytics, etc. Depends on having a user base and some content to moderate.


# UI/UX

- [ ] TasksList UI needs improvment.
- [ ] Add Markdown support for system prompts in chat settings.
- [ ] Global UI/UX checks.
- [ ] 

# Priority

- [ ]


# Other

- [ ] Add `index.ts` everywhere in components, libs, etc. for better imports.
- [ ] Add 4 seed users with different tiers and some pre-filled data for testing and demo purposes.


# Open Questions

- [ ] do I need these packages, why or why not, and if yes where to apply them:
  - [ ] `framer-motion` because AI responses are streamed and can feel jittery.
  - [ ] `nuqs`
  - [ ] `date-fns` for date handling, formatting, and timezone conversions.
  - [ ] `next-safe-action`
  - [ ] `langfuse` for LLM observability and debugging.
  - [ ] `react-hook-form` for form handling in React
  - [ ] `react-markdown` for rendering Markdown content in React components
