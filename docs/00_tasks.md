# UI/UX

- [ ] Improve Sidebar-Footer
- [ ] Add missing navigations to sidebar.
- [ ] Empty Chats cant be renamed, deleted
- [ ] Add refresh buttons to settings pages to reflect changes immediately without needing a full page refresh.
- [ ] Add UI errors when try to navigate to protected routes (e.g. chat) while not authenticated, or when hitting rate limits, etc.
- [ ] TasksList UI needs improvment.
- [ ] Add dynamic loading.tsx messages, or generalize it a bit. (currently it shows "Preparing Workspace..." on every loading state, but it could be more dynamic, e.g. "Loading chats...", etc.), use `components\shared\LoadingRing.tsx`
- [ ] Add Markdown support for system prompts in chat settings.
- [ ] Re-order App-Settings Tabs.

# Priority

- [ ] Tasks Filter exist but the task missing the category field, so the filter does not work, add category to task and wire it up to filter.
- [ ] What happen if i keep creating new chats and delete them? What if i do so, and then kept only 5 Chats saved but no monthly tokens left? check all these scenarios and make sure the UX is good and the user is properly informed about limits, etc.
- [ ] Update Token Usages to show usages of calling tools, not only the count of the calls.
- [ ] Add rules for Username (no spaces, unique, etc.) and enforce in Auth routes

# Plan

- [ ] Refactor Chat-Widget to use new architecture and patterns (chat steam, tools, awareness of LLM provider, etc.)
- [ ] LLM system prompt and general behavior.
- [ ] Add Notifications System (Basic system notifications "tokens usage limit readched", "new features available", "new updates", etc. Secondly, real-time LLM-generated notifications, e.g. login, signup, reports of tool usage, or important events in the app, etc.)

# Other

- [ ] is LLM aware of time-zone and date?
- [ ] Add `index.ts` files where missing for better import paths and encapsulation.
- [ ] Adjust the imports in `providers.ts`
