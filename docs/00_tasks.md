# UI/UX

- [ ] Improve Sidebar-Footer
- [ ] Add missing navigations to sidebar.
- [ ] TasksList UI needs improvment.
- [ ] Add Markdown support for system prompts in chat settings.
- [ ] Show somewhere a catalog of availble tools, and how to use for users.
- [ ]

# Priority

- [ ]

# Plan

- [x] Refactor Chat-Widget to use new architecture and patterns (chat steam, tools, awareness of LLM provider, etc.)
- [x] LLM system prompt and general behavior. (like dont call tools doesnt exist, dont help with general questions none-related to knowledge base or tasks etc ...)

# Other

- [x] is LLM aware of time-zone and date?
- [ ] Add `index.ts` files where missing for better import paths and encapsulation.
- [ ] Adjust the imports in `providers.ts`

# Brainstorming

- [ ] User Profile Settings: Allow Users to change their name/username, email, passowrd, etc (we discusse what to allow and what not.)
- [ ] Output Channels:
  - [ ] Read/write google calender.
  - [ ] Create JIRA tickets.
  - [ ] Send Emails.
- [ ] Allow sign-In with username/password -[ ] Add Cuurent Plan (tier) and other plans in settings (somewhere) and allow users to upgrade/downgrade their plans (but only UI for now, no actual payment integration, etc.)
- [ ] Add Notifications System (Basic system notifications "tokens usage limit reached", "new features available", "new updates", etc. Secondly, real-time LLM-generated notifications, e.g. login, signup, reports of tool usage, or important events in the app, etc.)
- [ ] Interduce new feature as feature and tool.
- [ ] Show available plans in new route /pricing. 