## [0.1.28] - 2026-04-03

- feat: document major updates and refactor i18n, LLM provider, and auth systems in new markdown files
- feat: add theme and language toggles to AppSidebar with collapsed state support and update documentation
- feat: enhance AppSidebar with disabled state for empty chats and update documentation for major changes
- feat: add theme and language toggles to AppSidebar and update tier system documentation
- feat: update UsageTab component to replace ProgressLabel with a styled paragraph and adjust monthlyResetDate logic in usage retrieval
- feat: implement usage tracking in settings with new UsageTab component and update tier system limits
- feat: enhance tier system with new "Enterprise" tier and implement monthly message/token limits
- feat: add theme and language toggles to Navbar and update Toaster icon colors
- feat: add PlanBadge component and integrate tier display in Navbar and Sidebar
- feat: add chat settings management with temperature and timeout options, update provider status logic, and enhance chat functionality
- feat(groq): implement Groq provider with chat and embedding functionalities, add health check, and update documentation
- feat(chat): implement chat functionality with create, delete, and rename features
- feat: refactor App-Settings and update documentation in major updates

## [0.1.27] - 2026-04-03

- feat: improve code readability in ProviderTab and SettingsShell components with consistent formatting
- feat: enhance SettingsPage and ProviderTab with cookie management and improved provider status handling
- feat: update SettingsPage layout to ensure full-width display
- feat: refactor AppearanceTab and ProviderTab for improved layout and structure
- feat: enhance language management by adding preferred language support and refining cookie handling
- feat: refine OpenAI health check to filter and display only accessible chat and embedding models
- feat: implement user preferences management with theme and language support
- feat: simplify button labels in theme selector and clean up Navbar imports
- feat: enhance AppLayout with session management and improved structure
- feat: add settings page with appearance and provider management, including provider status API
- feat: add LLM provider dispatcher and update major updates documentation
- feat: refactor LLM provider structure, consolidate health checks, and add OpenAI support
- feat: implement Ollama provider with chat, embedding, and health check functionalities

## [0.1.26] - 2026-04-03

- refactor: enhance Auth routes with ZOD validations and improve enforcement handling in lib/tiers
- refactor: add copyright headers to new and existing files, and update plan limits export in billing types
- refactor: restructure authentication logic and components, implement ZOD validations, and enhance user experience with password confirmation
- feat: implement desktop and mobile navigation components with internationalization support
- refactor: simplify footer component by removing message dictionary and using translations for labels
- refactor: remove unused chat API routes, update theme toggle for new translation system, and enhance loading messages with internationalization
- refactor: streamline legal page metadata generation and enhance global error handling with new translations
- refactor: update layout and authentication pages for improved responsiveness and session handling
- refactor: remove databaseHooks from auth configuration
- refactor: replace getMessage with getMsg in error handling components
- Refactor authentication components to use new translation system
- refactor: remove NoticeProvider and FloatingNotices component
- refactor: remove ShareLinkPanel and related components
- refactor: optimize message module import in request configuration
- feat: integrate next-intl for language management and simplify LanguageHydrator logic
- feat: remove deprecated cron jobs and notification logic
- chore: add next-intl dependency to package.json
- fix: remove redundant line in security policy section of README
- refactor: remove deprecated admin pages, user management logic, and related schemas
- refactor: remove notification, report, share, and task logic files

## [0.1.25] - 2026-04-02
## MAJOR REFACTORE
- Remove localization strings and delete seed preload script
- feat: remove outdated database seed files and related scripts for improved clarity
- feat: update .gitignore and refactor prisma schema to improve organization and add new enums
- fix: update stdin reading method in guard-shadcn hook for improved compatibility
- feat: refactor documentation structure and remove outdated files; add new agents and hooks
- feat: remove outdated Google Calendar setup and hardening documentation
- fix: clean up formatting in Node.js CI workflow
- feat: add agents for exploring, feature implementation, and code reviewing; implement guard for Shadcn source files
- feat: remove postinstall script for prisma generate
- feat: update documentation for workspace instructions, frontend i18n, main repo overview, and server data handling

## [0.1.24] - 2026-04-02

- feat: add meeting creation details to README and remove upgrade link from Navbar
- feat: enhance tool handling and label management in chat components

## [0.1.23] - 2026-04-01

- feat: update Node.js version matrix to only include 22.x
- feat: improve error handling and user feedback for rate limits in chat components
- feat: add Chat link to Navbar for improved navigation
- feat: enhance Navbar component with improved button styling and layout adjustments
- feat: enhance GlobalSearch component with Command dialog for improved user experience
- feat: update NotificationPanel button styling for improved accessibility and visual consistency
- feat: improve button styling and accessibility in Navbar and ThemeToggle components
- feat: add global search functionality with API integration

## [0.1.22] - 2026-04-01

- Add Node.js CI workflow for testing and building

## [0.1.21] - 2026-04-01

- feat: remove tags from Contact model and related migration; streamline label management integration
- feat: remove tags from contacts and update related logic; enhance localization for counts in contacts, meetings, and tasks
- feat: add label management features including CRUD operations, UI components, and API endpoints
- feat: replace freeform tags with structured labels in ContactForm and ContactList; update context and logic for label management
- feat: implement label management for knowledge documents, including fetching, updating, and UI integration
- feat: integrate label selection support across decisions, meetings, and tasks
- feat: add label display in ContactList and update localization for labels
- feat: add label fetching to ContactsPage and pass availableLabels to ContactsView
- feat: add availableLabels prop to ContactsView and ContactList components for label selection support
- feat: add label management functionality across contacts, meetings, tasks, and decisions
- feat: add tooltips and pointer affordances for labels card action controls in App Settings
- feat: integrate Tooltip component for enhanced user interaction in LabelsSection
- refactor: rename initialPreferences prop for clarity in AppSettingsForm component fix: improve error handling in LabelsSection for create and update operations docs: update Phase 9 documentation with new Label model and CRUD logic details
- feat: add LabelsSection component with CRUD functionality for labels and integrate into AppSettingsPage
- feat: add CRUD functionality for labels with create, update, delete, and list operations
- feat: implement CRUD operations for labels with PATCH and DELETE endpoints
- feat: implement user-defined labels with CRUD functionality and update schema
- feat: add tier enforcement documentation for plan limits and enforcement status

## [0.1.20] - 2026-03-31

- feat: enhance AppSettingsForm and AppSidebar with language support, update navigation labels for consistency
- feat: implement onboarding completion notification and update user preferences handling
- feat: add tier-based user information and upgrade prompts in Navbar, update localization for tier labels
- feat: implement tier-based limits for chat and document usage, including daily quotas and history limits
- feat: implement tier-based limits for chat and widget usage, including daily quotas and history limits

## [0.1.19] - 2026-03-31

- feat: update package versions and remove unnecessary eslint directive
- feat: add presentation overview documents in English and German
- feat: enhance system prompt with platform capabilities and user interaction guidelines
- feat: unify chat provider implementation and add Groq support

## [0.1.18] - 2026-03-31

- chore: remove sensitive environment variable examples from README

## [0.1.17] - 2026-03-31

- feat: add environment variables for Docker, Better Auth, and OAuth providers in README

## [0.1.16] - 2026-03-31

- feat: refactor version bump workflow and update README with project details
- feat: add validation schemas for user tier and preferences updates
- feat: Add UI/UX polish and 24-hour shareable Contact Card link
- feat: add warning for unset CRON_SECRET environment variable in cron routes
- feat: refine meeting follow-up logic to accurately filter candidates based on effective end time
- feat: refactor briefing and digest jobs to use timezone-aware date calculations
- feat: add confirmation dialog for Google Calendar disconnection and update related messages
- feat: add skeleton loading state and update sync success message to include event counts
- feat: enhance Google integration with OAuth success/error handling and update UI messages
- feat: implement Zod validation schemas for CRUD routes

## [0.1.15] - 2026-03-30

- docs: add Phase 8 hardening plan for production readiness

## [0.1.14] - 2026-03-30

- feat: add Google Calendar integration setup guide
- feat: add Google Calendar integration with sync and notification features
- feat: update SaaS launch layer details and add Phase 7 documentation for Calendar integration and scheduled agent behaviors
- feat: add Phase 6 documentation for SaaS launch and refactor UI/UX with Contact Card share link
- chore: remove outdated CI and audit workflows

## [0.1.13] - 2026-03-30

- fix: correct option for Prisma migrate diff command in workflow
- feat: enhance Prisma schema check with detailed formatting validation
- feat: add CI and Dependency Audit workflows with changelog generation
- feat: add UI/UX polish and 24-hour Contact Card share link functionality
- feat: add token synchronization on mount and tab visibility change in ShareLinkPanel
- feat: Add core application pages and components
- feat: implement share link functionality with token generation and management
- fix: remove min-h-screen class from multiple page components to ensure consistent footer positioning
- feat: add pricing section to landing page with corresponding translations
- style: format version-bump.yml for improved readability and consistency
- feat: implement GitHub Actions workflow for automatic version bumping and update package version
- feat: add app settings tab and improve language handling
- feat: add detail view functionality to MeetingList with corresponding translations
- feat: update navbar admin label and enhance meeting list UI with improved accessibility and translations
- feat: refactor onboarding process by moving OnboardingWizard to components and updating imports
- feat: update UI elements with cursor-pointer styles and enhance notification handling
- feat: enhance admin functionality with user seeding and role management
- feat: implement admin panel with user management and onboarding flow
- feat(nudges): implement proactive nudges feature with evaluation and notifications
- feat(contacts): implement contact interaction history with logging and retrieval
- feat(meetings): add meeting prep pack functionality with generation and retrieval
- feat(briefing): implement LLM-powered daily briefing feature with caching and regeneration
- feat(decisions): implement decision log feature with CRUD operations
- feat(workflow): complete executive workflow layer with assistant-driven creation and reports
- feat(home): add briefing card component and snapshot data retrieval
- feat(chat): add deduplication checks for contacts, meetings, and tasks
- feat: add assistant reports feature
- feat(tools): implement tool definitions for creating contacts, meetings, and tasks
- feat(settings): add App Settings page and update navigation structure
- feat(assistant): implement assistant settings page and preferences management

# Changelog

