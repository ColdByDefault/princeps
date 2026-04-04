# UI/UX

- [ ] Improve Sidebar-Footer
- [ ] Add missing navigations to sidebar.
- [x] Empty Chats cant be renamed, deleted
- [x] Add refresh buttons to settings pages to reflect changes immediately without needing a full page refresh.
- [x] Add UI errors when try to navigate to protected routes (e.g. chat) while not authenticated, or when hitting rate limits, etc.
- [ ] TasksList UI needs improvment.
- [x] Add dynamic loading.tsx messages, or generalize it a bit. (currently it shows "Preparing Workspace..." on every loading state, but it could be more dynamic, e.g. "Loading chats..."), use `components\shared\LoadingRing.tsx`
- [ ] Add Markdown support for system prompts in chat settings.
- [x] Re-order App-Settings Tabs.
- [ ] Show somewhere a catalog of availble tools, and how to use for users.

# Priority

- [x] What happen if i keep creating new chats and delete them? What if i do so, and then kept only 5 Chats saved but no monthly tokens left? check all these scenarios and make sure the UX is good and the user is properly informed about limits, etc. => see `docs/08_chat-control.md`
- [ ] Update Token Usages to show usages of calling tools, not only the count of the calls.
- [x] Add rules for Username (no spaces, unique, etc.) and enforce in Auth routes
- [x] can the LLM update/edit Labels or only create new ones?
- [x] LLM can call tools, but does it check duplications? for example, Task is existing, and LLM calls the tool to create the same task again, or similar task? should we check for that? if so, how? (e.g. check for similar titles, or check for similar content in the description, etc.)

# Plan

- [ ] Refactor Chat-Widget to use new architecture and patterns (chat steam, tools, awareness of LLM provider, etc.)
- [ ] LLM system prompt and general behavior.
- [ ] Add Notifications System (Basic system notifications "tokens usage limit reached", "new features available", "new updates", etc. Secondly, real-time LLM-generated notifications, e.g. login, signup, reports of tool usage, or important events in the app, etc.)

# Other

- [ ] is LLM aware of time-zone and date?
- [ ] Add `index.ts` files where missing for better import paths and encapsulation.
- [ ] Adjust the imports in `providers.ts`

# Brainstorming

- [ ] User Profile Settings: Allow Users to change their name/username, email, passowrd, etc (we discusse what to allow and what not.)
- [ ] Output Channels:
  - [ ] Read/write google calender.
  - [ ] Create JIRA tickets.
  - [ ] Send Emails.
- [ ] Allow sign-In with username/password
