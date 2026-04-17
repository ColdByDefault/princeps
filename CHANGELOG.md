## [0.3.0] - 2026-04-17

- feat: remove LICENSE file as part of project restructuring

## [0.2.9] - 2026-04-17

- feat(voice-input): update README for clarity on environment variables and billing integration.
- feat(voice-input): update dark mode card color for improved accessibility
- feat(voice-input): remove unused tier color definitions from colors.ts
- feat(voice-input): implement tier-based styling and user tier management across components
- feat(voice-input): update UsageTab component to use QuotaCard and enhance layout; add new sections in translations
- feat(voice-input): remove radial chart component and related configurations
- feat: add voice request limits and monthly tracking to billing and usage models
- feat(voice-input): add voice request usage tracking and update UI components
- feat(voice-input): implement daily voice request limits and update transcription model
- feat(voice-input): enhance voice input handling with auto-send feature and silence detection
- feat(voice-input): enhance voice input functionality with error handling and dynamic MIME type support
- style: format code for better readability in audio file handling
- feat(voice-input): implement voice input functionality with transcription support

## [0.2.8] - 2026-04-14

- feat: remove tasks documentation as part of project restructuring
- feat: add .vscode to .gitignore for local settings exclusion
- feat(calendar): disable buttons and pointer dismissal when child dialogs are open
- feat(calendar): add create task and meeting dialogs with open state management
- feat(calendar): integrate Google Calendar sync option in meeting management
- feat: enhance notification system with refresh event and improve daily greeting query
- feat: implement multi-round tool calling in chat API and enhance datetime handling in schemas

## [0.2.7] - 2026-04-13

- feat(calendar): update CalendarDayButton to conditionally pass locale prop
- feat(calendar): update CalendarDrawer styling with shadow and border enhancements
- feat(calendar): enhance CalendarDrawer with task and meeting detail dialogs, manage dialog states, and update translations
- feat(calendar): add calendar drawer context and provider, task detail dialog, and trigger component
- feat: refactor import path for Threads component and remove BackgroundThread export from landing index
- feat: enhance ContactDetailDialog layout and improve email display in SettingsShell
- feat: replace CalendarDays icon with Google icon SVG and update link to use Next.js Link component
- feat: standardize code formatting in calendar component and add Google icon SVG
- feat: update CalendarDayButton styles to enhance user interaction
- feat: implement date and datetime pickers for goal and meeting dialogs
- feat: integrate Google Calendar with Princeps meetings
- feat: update task descriptions for Google Calendar and Calendar View implementation
- feat: implement cron worker to auto-expire stale upcoming meetings and send follow-up reminders
- feat: add 'kind' field to meetings and update related logic for improved event categorization
- feat: add tooltips to action buttons in MeetingCard for improved accessibility
- feat: enhance EditMeetingDialog with participant name fallback and improve display logic
- feat: implement MeetingDetailDialog and enhance meeting source handling
- feat: enhance Google Calendar callback with state logging and error handling
- feat: integrate Google Calendar API for event synchronization
- feat: add integrations documentation for external tools

## [0.2.6] - 2026-04-11

- feat: update tasks documentation and add Stripe payments guide
- feat: implement subscription management and onboarding flow
- feat: integrate Stripe for user billing and add related environment variables

## [0.2.5] - 2026-04-11

- feat: add spacing in tasks documentation for better readability
- feat: restructure tasks documentation and add new backlog items
- chore: add Upstash rate limiting and Redis dependencies
- feat: implement token accumulation for LLM calls in knowledge document creation and search

## [0.2.4] - 2026-04-11

- feat: add personality and automation sections to AssistantTab and update localization strings
- feat: add task for system prompt distinction and user customization
- feat: enhance error handling in chat stream responses for Ollama and OpenAI providers

## [0.2.3] - 2026-04-09

- feat: add daily briefing feature with generation and retrieval capabilities
- feat: integrate Langfuse for LLM observability and add configuration documentation
- feat: add contact, decision, goal, knowledge, label, meeting, memory, profile, and task tools to the registry

## [0.2.2] - 2026-04-09

- feat: update task list for meeting prep pack implementation and fix typos
- feat: implement meeting prep pack management with generation, deletion, and quota enforcement
- feat: add meeting prep pack generation functionality and UI components

## [0.2.1] - 2026-04-09

- feat: improve Navbar state management for menu open handling
- feat: simplify loading state management in GlobalSearch and refactor Navbar state handling
- feat: refine CommandDialog and CommandItem styles for improved UI consistency
- feat: enhance GlobalSearch with loading state and fetch multiple data types
- feat: implement GlobalSearch component with keyboard shortcut and navigation links
- feat: add auto-close functionality for mobile navbar after route redirect
- feat: organize types into separate files for weather and settings, update imports accordingly
- feat: update imports in multiple components for improved organization and clarity
- fix: remove duplicate locale initialization in ContactDetailDialog
- feat: refactor AppearanceTab to use Popover for location and timezone selection, update translations for search placeholders
- feat: implement locale-aware date formatting across multiple components and add Popover component
- Refactor imports to use barrel exports for cleaner code organization
- feat: add new index files for various components and libraries, exporting necessary modules
- feat(version-bump): implement custom version bump logic and update package.json to 0.2.0
- feat(meeting): add "work" label instruction for slide deck preparation in meeting notes
- feat(meeting): add meeting title display to DecisionCard and TaskCard, and update data models to include meeting title
- feat(tasks): update task list by removing obsolete user profile settings and clarifying meeting prep pack implementation
- feat(profile): expand user data retrieval to include username, email, tier, and role
- feat(profile): ensure username is stored in lowercase and added displayUsername field
- feat(profile): implement profile editing functionality with validation and dialog
- feat(tasks): remove obsolete tasks and clean up task list for clarity
- feat(contacts): enhance fetch to include meeting details for each contact
- feat(chat-widget): keep focus on input after sending a message for improved UX
- fix(HomeShell): change greeting title font weight from semibold to bold
- feat(navigation): redirect logout to landing page instead of login page
- feat(hydrators): update LanguageHydrator and ThemeHydrator to re-run on language and theme changes
- feat(auth): update login to accept username or email and enhance localization

## [0.1.46] - 2026-04-08

- feat(memory): add memory usage tracking and localization for memory facts in English and German
- feat(memory): update MemoryEntryCard interaction and enhance memory limits localization in English and German
- feat(memory): enhance MemoryShell UI and add refreshing state translations
- feat: add delete functionality to ContactDetailDialog and update ContactCard to handle onDelete prop
- feat: update Navbar to include memory link and enhance system prompt behavior for long-term memory retention
- feat: update ToolsTab to have collapsible sections closed by default and enhance memory localization in English and German
- feat(memory): implement memory feature with CRUD operations and LLM integration
- feat: add MemoryEntry model and MemorySource enum to schema
- feat: update docker-compose configuration for consistent database naming and health checks

## [0.1.45] - 2026-04-08

- feat: update sign-up prompts and add free account hints in localization files
- feat: update copyright information in localization files for consistency
- feat: enhance pricing structure with plan prices and update PricingShell for better display of pricing and limits
- feat: adjust ChatWidget position and refactor Footer component for improved layout and styling
- feat: update color definitions for tier badges, cards, and rings for consistent styling
- feat: update Navbar components for improved styling and layout adjustments
- feat: add BackgroundThread component for enhanced visual effects and update LandingHero to integrate it
- feat: enhance RotatingText component with array support for rotation intervals and add motion effects to LandingHero
- feat: remove LandingHero component and its associated functionality
- feat: update branding references from C-Sweet to Princeps in chat widget, documentation, and settings
- feat: update branding references from C-Sweet to Princeps in localization files
- feat: rename project references from C-Sweet to Princeps across documentation and codebase
- feat: implement theme toggle functionality with view transitions and API integration
- feat: add custom system prompt functionality with localization support and Markdown rendering
- feat: integrate react-markdown and remark-gfm for enhanced Markdown rendering in chat messages
- feat: add knowledge search functionality with handlers and localization support

## [0.1.44] - 2026-04-07

- feat: update task management documentation with completed tasks and new brainstorming ideas
- feat: refine tool handling in chat widget to optimize LLM response logic
- feat: enforce character limits on decision, goal, meeting, and task fields with updated schemas
- feat: remove loading component from chat
- feat: enhance task and goal management features with linked goals support
- feat: add goals management feature with CRUD operations
- feat: add goals management features including CRUD operations, status handling, and milestone support
- feat: add goal management features including create, update, delete, and list functionalities with tier limits
- feat: implement CRUD operations for goals and milestones with rate limiting and validation
- feat: implement goal management features including create, update, delete, and list functionalities
- feat: limit displayed labels to three and show count of additional labels for DecisionCard, MeetingCard, and TaskCard
- feat: add shell layout conventions and interactive element rules to feature instructions
- feat: enhance contact management with delete confirmation and refresh functionality
- chore: remove obsolete feature audit document
- feat: implement contacts management feature

## [0.1.43] - 2026-04-07

- feat: implement tier color constants for badges, cards, and rings
- feat: update chat-widget to reflect online status with green indicator
- feat: remove LabelsTab component and related references from settings
- feat: add icon selection to labels system
- feat: update tier colors and styles for consistency across components

## [0.1.42] - 2026-04-07

- feat(tools): adjust CustomToggle dimensions for consistency
- feat(tools): replace Switch with CustomToggle and add delete_task translations
- feat(tasks): add delete_task functionality and update tool registry
- feat(tools): implement tools management in settings with user preferences
- feat(usage): add task, meeting, and decision tracking to usage summary
- feat(tiers): implement tier limits for tasks, meetings, and decisions

## [0.1.41] - 2026-04-07

- feat(decisions): add refresh functionality and update UI with loading state
- feat(decisions): implement decision management UI and logic

## [0.1.40] - 2026-04-06

- feat: add pgvector DB health check script and integrate it into the dev start process
- feat: implement password reset flow with forgot and reset password pages, including email validation and link storage
- feat: implement rate limiting for mutation routes across tasks, meetings, contacts, and labels

## [0.1.39] - 2026-04-06

- feat: restructure tasks documentation with enhanced organization and clarity

## [0.1.38] - 2026-04-06

- feat: integrate task management into meetings with linked tasks functionality
- feat: implement summary dialog for meetings with CRUD functionality
- feat: add agenda and summary fields to meeting creation and management
- feat: enhance meeting management with participant handling and quick contact creation
- feat: add agenda and summary fields to meeting management components and schemas
- feat: add comment to clarify sidebar menu item rendering
- feat: implement meeting handlers for create, list, update, and delete operations
- feat: update navigation to include meetings link and enhance meetings feature description in documentation
- feat: add meetings management features including create, list, update, and delete operations
- feat: add meetings management functionality with create, edit, delete, and list features
- feat: add API endpoints for creating and listing meetings
- feat: implement meeting management functionality with create, delete, list, and update operations
- fix: remove completed Contacts task from features list

## [0.1.37] - 2026-04-05

- fix: update tasks documentation with detailed tool features and improve UI/UX items
- feat: enhance AppSidebar with new navigation items and tooltips; localize sidebar labels in English and German
- feat: integrate tooltips for Navbar components and enhance avatar icon with tier indication
- fix: remove eslint-disable comment for improved code quality in ChatWidget component
- feat: add ContactDetailDialog component for enhanced contact view; update ContactCard to integrate detail dialog and improve UI/UX; limit notes input to 250 characters in ContactForm with character count display; localize view label in English and German
- feat: enhance ContactCard and ContactList components with improved UI/UX; add avatar initials and color, update loading skeletons, and localize contact count messages
- feat: implement user preferences fetching and update assistant name in chat widget; add re-login notice in settings
- feat: enhance TabsContent component with keepMounted prop for improved performance and visibility

## [0.1.36] - 2026-04-05

- feat: update settings tab to include assistant and improve provider label localization
- feat: add Assistant settings tab with customizable name, tone, address style, and response length
- feat: implement CustomToggle component for improved toggle functionality in settings
- feat: enhance navigation and settings with contact management features
- feat: rename project references from See-Sweet to C-Sweet across documentation and codebase
- feat(weather): enhance weather fetching with location support
- feat: add timezone selection and management features in user settings

## [0.1.35] - 2026-04-05

- feat: add task to group elements in Navbar Desktop for improved UI organization
- feat: implement contact management features including create, update, delete, and list functionalities with tier limits
- feat: update frontend i18n instructions to prevent nesting buttons within Base UI triggers
- feat: add contact management components including ContactPage, ContactCard, ContactDialog, ContactForm, ContactList, and ContactsShell with localization support
- feat: implement contact management API with create, update, delete, and list functionalities
- feat: add work-in-progress notes to documentation for i18n system, LLM provider, auth refactor, tier system, and notification design

## [0.1.34] - 2026-04-04

- feat: refactor useNotifications hook to streamline notification fetching and greeting logic
- feat: implement user preferences for notifications and add daily greeting feature
- feat: update notification design with cost implications and environment variable query
- feat: implement notification system with weather integration

## [0.1.33] - 2026-04-04

- feat: update task list and major updates documentation for clarity and organization
- feat: refactor loading components and update translations for chat loading
- feat: add knowledge search functionality with cosine similarity
- feat: implement knowledge management features
- feat: update layer boundaries section to clarify source of truth for feature development

## [0.1.32] - 2026-04-04

- feat: add missing navigation items to sidebar and refine UI/UX tasks
- feat: add tasks navigation to sidebar and update task documentation
- feat: implement pricing page and associated components with localization support
- feat: add tools catalog with descriptions and examples for available tools
- feat: add user profile handler and tool for retrieving user information
- feat: add profile page and user avatar components with initial rendering logic
- feat: update task documentation and enhance system prompt with available tools and behavior rules
- feat: integrate chat widget functionality and enhance user experience with new chat features
- feat: enhance token accounting and update usage notes in settings

## [0.1.31] - 2026-04-04

- feat: update task documentation for chat management scenarios and add new chat control use cases
- feat: refactor tool execution and add handler files for tasks and labels
- feat: implement label management functions including listing, updating, and deleting labels
- feat: enhance loading components with dynamic messages and new loading states
- feat: reorder settings tabs for improved navigation and update task documentation
- feat: enhance login functionality with callback support and UI updates
- feat: add refresh functionality to Labels and Usage tabs with corresponding UI updates
- feat: add username field to sign-up schema and update validation rules
- feat: add username field to user model and update sign-up functionality
- refactor: reorganize tasks documentation into structured sections for better clarity
- feat: add Labels System documentation and outline tasks for future improvements
- feat: add initial feature outline for Tasks with CRUD capabilities
- feat: integrate labels management into task creation and editing workflows
- feat: implement labels management system with create, update, and delete functionalities

## [0.1.30] - 2026-04-03

- feat: update task dialogs to include visual hints for required and optional fields
- feat: refactor task mutation logic for improved efficiency and error handling
- feat: implement monthly tool call limits and update usage tracking for tool calls
- feat: enhance LLM tool integration by adding support for tool calls and updating message structure
- feat: update CreateTaskDialog to ensure proper button semantics and improve DialogTrigger usage
- feat: enhance LLM tool integration and improve task management UI with tooltips
- feat: update documentation for feature agent and major updates checklist
- feat: refactor task-related components and logic for improved clarity and performance
- feat: add task management features including task creation, editing, and deletion

## [0.1.29] - 2026-04-03

- feat: add documentation for i18n system, LLM provider abstraction, auth refactor, and tier system redesign

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

