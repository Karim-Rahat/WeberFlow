# WeberFlow — Implementation Plan

## 1. Product vision

Build a polished, office-focused project management platform inspired by the workflows users expect from Asana: teams, projects, tasks, multiple views, collaboration, notifications, reporting, goals, portfolios, workload, automation, and administration.

The product should reproduce the useful interaction patterns of modern work-management software without copying Asana's protected branding, illustrations, exact visual assets, or proprietary text. The UI will use an original forest-green and sage design system.

### Primary outcome

Employees can organize work, assign responsibility, collaborate around tasks, and understand what is late, blocked, or at risk. Managers can track delivery and workload without relying on spreadsheets or status meetings.

### Delivery strategy

1. Ship a reliable task-management MVP.
2. Validate it with one internal team.
3. Improve workflow speed and notifications from real usage.
4. Add advanced planning, automation, reporting, and enterprise controls.

---

## 2. Product principles

- **Task-first:** Every major workflow should lead back to clear, actionable work.
- **Fast navigation:** Common actions should take one or two clicks and support keyboard shortcuts.
- **Flexible views:** The same project data can appear as list, board, calendar, or timeline.
- **Clear ownership:** Every task can have an assignee, owner, due date, status, and priority.
- **Useful notifications:** Notify users about meaningful changes without producing noise.
- **Progressive complexity:** Simple for a new team, powerful when advanced features are enabled.
- **Auditability:** Important changes are recorded and traceable.
- **Accessible and responsive:** WCAG 2.1 AA targets, keyboard navigation, and usable mobile layouts.
- **Original identity:** Match the quality and usability of Asana-like products, not their exact brand expression.

---

## 3. Recommended technical architecture

### Application stack

- **Backend:** Laravel 13 REST API
- **Frontend:** React, TypeScript, Vite, React Router
- **UI:** shadcn/ui, Tailwind CSS, Radix primitives
- **Font:** Manrope
- **Client data:** TanStack Query
- **Complex local state:** Zustand only where URL state and component state are insufficient
- **Forms and validation:** React Hook Form, Zod, and matching Laravel Form Requests
- **Database:** MySQL 8+
- **Authentication:** Laravel Sanctum with secure HTTP-only cookie sessions
- **Authorization:** Laravel Policies plus a role/permission layer
- **Real-time events:** Laravel Reverb and Laravel Echo
- **Queues/cache:** Redis in production; database queue allowed for local MVP setup
- **Mail:** Laravel Notifications through company SMTP
- **Scheduling:** Laravel Scheduler for reminders, summaries, and recurring work
- **Files:** Laravel Storage; local disk in development, private S3-compatible storage in production
- **Search:** MySQL full-text initially; Laravel Scout with Meilisearch later
- **Testing:** Pest/PHPUnit, Vitest, React Testing Library, Playwright
- **API documentation:** OpenAPI specification generated or maintained with the backend

### Application shape

Use a Laravel API and a React single-page application in one repository. Keep business rules in backend services/actions rather than controllers. Treat the API as the source of truth for authorization, validation, task ordering, activity logging, and notification dispatch.

Suggested top-level structure:

```text
app/
  Actions/
  Events/
  Http/Controllers/Api/
  Http/Requests/
  Jobs/
  Models/
  Notifications/
  Policies/
  Services/
  Support/
database/
  factories/
  migrations/
  seeders/
resources/js/
  api/
  components/
  features/
  hooks/
  layouts/
  lib/
  pages/
  routes/
  stores/
  types/
routes/
tests/
  Feature/
  Unit/
  Browser/
```

### Multi-tenancy model

Every business record belongs to a `workspace`. A user may belong to multiple workspaces. All workspace-scoped API queries must enforce membership and workspace boundaries on the server. Use route model binding scoped through the current workspace and cover cross-workspace access with automated tests.

---

## 4. Information architecture

### Global navigation

- Home
- My tasks
- Inbox
- Projects
- Portfolios
- Goals
- Reporting
- People / Teams
- Favorites
- Recent items
- Workspace administration

### Project navigation

- Overview
- List
- Board
- Calendar
- Timeline
- Dashboard
- Messages
- Files
- Workflow settings

### Task detail

- Task title and completion state
- Assignee(s), followers, creator
- Project and section membership
- Status, priority, dates, estimated effort
- Description with rich text
- Subtasks and dependencies
- Custom fields and tags
- Attachments
- Comments and @mentions
- Activity history
- Related tasks

### Responsive behavior

- Desktop: collapsible sidebar, workspace content, optional task detail pane.
- Tablet: compact sidebar and slide-over task detail.
- Mobile: bottom/compact navigation, full-screen task detail, touch-friendly board columns.

---

## 5. Design system

### Visual direction

Use clean off-white surfaces, thin neutral borders, subtle shadows, comfortable spacing, and rounded cards. The interface should feel calm, professional, and dense enough for daily office use.

### Initial color tokens

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `background` | `#F7F8F4` | `#111512` | Application canvas |
| `surface` | `#FFFFFF` | `#181D1A` | Cards and panels |
| `surface-muted` | `#EEF1EA` | `#222A25` | Secondary surfaces |
| `primary` | `#245B45` | `#72B895` | Primary actions |
| `primary-hover` | `#1B4937` | `#86C7A7` | Hover state |
| `accent` | `#A8BFA8` | `#87A68D` | Highlights |
| `text` | `#17221B` | `#EEF4EF` | Primary text |
| `text-muted` | `#68736C` | `#A8B1AB` | Secondary text |
| `border` | `#DDE3DC` | `#303A33` | Dividers and controls |
| `danger` | `#C84A4A` | `#EF7777` | Errors and overdue states |
| `warning` | `#B87924` | `#E2AD5D` | Risk and warning states |

Define all colors as semantic CSS variables. Components must never depend directly on raw palette values when a semantic token exists.

### Typography and layout

- Manrope for the full interface.
- 14px base size, 1.5 line height.
- 4px spacing scale with common gaps at 8, 12, 16, 24, and 32px.
- 8–12px control/card radii.
- Minimum 44px touch targets on mobile.
- Consistent focus rings and visible keyboard states.

### Core shared components

- App shell, sidebar, header, breadcrumbs
- Command/search palette
- Button, input, select, combobox, date picker
- Avatar, badge, tooltip, popover, dropdown
- Data table and virtualized task list
- Modal, drawer, sheet, confirmation dialog
- Empty, loading, skeleton, error, and permission-denied states
- Task row, task card, task detail pane
- User picker, project picker, tag picker
- Rich-text editor and mention menu
- Theme toggle and language selector

### Localization

Prepare translation keys from the beginning. English is the default. Add Bangla after the core English copy stabilizes. Store dates in UTC and render them using the user's locale and timezone.

---

## 6. Feature scope by release

## Phase 0 — Foundation

**Status: Complete — October 10, 2026.**

### Deliverables

- Laravel and React/TypeScript setup
- MySQL, Redis/database queue, mail, storage, and Reverb configuration
- shadcn/ui, Tailwind, Manrope, theme tokens, and dark mode
- Application shell with collapsible sidebar and header
- API response/error conventions
- Authentication, email verification, password reset, session management
- Workspace creation and switching
- User profile and notification preferences
- CI pipeline, code style, static analysis, and baseline tests
- Demo data seeders

### Exit criteria

- A user can register/login, create or enter a workspace, switch themes, and navigate the shell.
- Authentication and workspace isolation tests pass.
- Queue worker, scheduler, mail preview, and real-time connection work locally.

## Phase 1 — Task-management MVP

### Teams and access

- Invite users by email
- Accept, expire, resend, and revoke invitations
- Workspace roles: owner, admin, member, guest
- Teams/departments and team membership
- Project roles: owner, editor, commenter, viewer
- Laravel policies for every protected resource

### Projects

- Create, edit, archive, restore, duplicate, and delete projects
- Project owner, members, privacy, color, icon, start date, and due date
- Sections with drag-and-drop ordering
- Project overview with description, members, milestones, and progress
- Favorite and recent projects

### Tasks

- Create, edit, complete, reopen, duplicate, archive, and delete tasks
- Single primary assignee for the MVP; followers for visibility
- Due date/time, start date, priority, status, description, tags, and estimate
- Sections and drag-and-drop ordering
- Subtasks with nested display limited to one practical level in the initial UI
- Multiple project membership supported in the data model
- Bulk select, assign, set due date, move, complete, and delete
- Attachments with private access and validation
- Saved filters for My Tasks and project lists

### Collaboration

- Task comments
- @mentions for workspace members
- Followers and automatic following rules
- Activity feed for important field changes
- Task deep links
- Optimistic UI where conflicts are low-risk

### Views

- My Tasks: assigned, upcoming, overdue, recently completed
- Project list view with sort, group, filter, columns, and bulk actions
- Kanban board grouped by section or status
- Basic calendar for tasks with dates
- Persistent per-user view preferences

### Notifications

- In-app inbox with read/unread state
- Email notifications for assignments, mentions, comments, invitations, and approaching deadlines
- Per-event channel preferences
- Queued delivery with retries and failed-job visibility
- Daily deadline reminder scheduled job

### MVP exit criteria

- A manager can invite a colleague, create a project, assign a task, discuss it, attach a file, and track completion.
- The assignee receives both an in-app notification and a queued email according to preferences.
- List, board, and calendar show consistent task data and enforce permissions.
- Critical workflows pass feature and browser tests.

## Phase 2 — Planning and visibility

- Timeline/Gantt view with task date ranges
- Milestones
- Task dependencies and blocked indicators
- Project status updates: on track, at risk, off track, complete
- Project dashboard charts
- Workload by person and estimated effort
- Advanced search across tasks, projects, comments, and people
- Saved searches and reusable report filters
- Project templates
- CSV import/export
- Recurring tasks
- Custom fields: text, number, date, enum, multi-select, people, checkbox
- Forms that create tasks in a configured project
- Project messages/announcements

## Phase 3 — Advanced Asana-style workflows

- Portfolios containing multiple projects
- Portfolio health, owner, dates, progress, and custom fields
- Company, team, and individual goals
- Goal progress linked to projects and portfolios
- Rules/automation builder with triggers, conditions, and actions
- Approval tasks
- Request intake workflows
- Time tracking and timesheets
- Capacity planning and workload limits
- Project/task templates with relative dates and default assignees
- Dependencies across projects
- Custom dashboards and chart builder
- Personal home widgets
- Notification digests and quiet hours
- Public read-only project sharing where explicitly enabled

## Phase 4 — Enterprise readiness and integrations

- SSO through SAML/OIDC
- SCIM user provisioning
- Granular custom roles and permission sets
- Audit-log export and retention policies
- Data export, workspace backup, and restore procedures
- IP/session controls and forced logout
- Domain capture and approved email domains
- Microsoft 365/Google Workspace calendar integration
- Slack/Microsoft Teams notifications
- Cloud-drive attachment providers
- Webhooks and personal access tokens
- Public API with scoped tokens and rate limits
- Mobile/PWA enhancements
- Data residency and compliance work if the business requires it

---

## 7. Roles and permission model

### Workspace roles

| Role | Typical permissions |
| --- | --- |
| Owner | Full access, billing/settings ownership, transfer ownership, delete workspace |
| Admin | Manage members, teams, projects, settings, and reports |
| Member | Create projects/tasks and collaborate according to project access |
| Guest | Access only explicitly shared projects/tasks |

### Project access levels

| Level | Typical permissions |
| --- | --- |
| Owner | Manage project, access, workflow, and deletion |
| Editor | Create and edit project content |
| Commenter | View and comment without editing task fields |
| Viewer | Read-only access |

Authorization must be checked on the server. Hiding a button in React is only a user-experience improvement and is not a security boundary.

---

## 8. Core data model

All tables use timestamps. Workspace-owned tables include `workspace_id`; frequently filtered foreign keys require indexes. Prefer ULIDs for externally exposed identifiers and integer/optimized keys internally only if performance testing justifies the difference.

### Identity and organization

- `users`: identity, profile, locale, timezone, status
- `workspaces`: name, slug, owner, settings
- `workspace_members`: user, workspace, role, state, joined date
- `workspace_invitations`: email, role, token hash, inviter, expiry
- `teams`: workspace, name, description, visibility
- `team_members`: team, user, role
- `user_preferences`: theme, locale, timezone, notification settings
- `sessions`: active session records managed by Laravel

### Projects and tasks

- `projects`: workspace, team, owner, name, description, privacy, status, dates, archived state
- `project_members`: project, user, access level
- `project_sections`: project, name, position
- `tasks`: workspace, creator, primary assignee, parent task, title, description, status, priority, dates, estimate, completed metadata
- `project_tasks`: task, project, section, position; enables a task to belong to multiple projects
- `task_followers`: task, user
- `task_dependencies`: predecessor task, dependent task, dependency type
- `tags`: workspace, name, color
- `task_tags`: task, tag
- `task_relations`: source task, target task, relation type

### Collaboration and content

- `comments`: workspace, task, author, rich-text body, edited metadata
- `comment_mentions`: comment, mentioned user
- `attachments`: workspace, attachable polymorphic relation, uploader, disk, path, name, MIME type, size
- `activity_logs`: workspace, actor, subject, event, before/after metadata, request context
- `notifications`: Laravel database notification table
- `notification_preferences`: user, event key, in-app/email enablement, digest mode

### Advanced planning

- `custom_field_definitions`: workspace/project, name, type, configuration
- `custom_field_options`: definition, label, color, position
- `custom_field_values`: definition, task/project, typed value
- `project_status_updates`: project, author, health, summary, published date
- `portfolios` and `portfolio_projects`
- `goals`, `goal_relations`, and `goal_updates`
- `automation_rules`, `automation_conditions`, `automation_actions`, `automation_runs`
- `recurrence_rules` and `recurring_task_runs`
- `time_entries`
- `forms`, `form_fields`, and `form_submissions`

### Data integrity rules

- Enforce workspace consistency between related records.
- Prevent dependency cycles.
- Preserve immutable audit events for security-sensitive changes.
- Soft-delete recoverable business records; permanently purge through a scheduled retention process.
- Store attachment objects under non-public paths and authorize every download.
- Use fractional or lexicographic position keys to avoid rewriting every row during drag-and-drop.

---

## 9. REST API outline

Version endpoints under `/api/v1` and return predictable JSON envelopes, validation errors, pagination metadata, and machine-readable error codes.

### Authentication and account

```text
POST   /auth/login
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /user
PATCH  /user/profile
GET    /user/preferences
PATCH  /user/preferences
```

### Workspaces and members

```text
GET    /workspaces
POST   /workspaces
GET    /workspaces/{workspace}
PATCH  /workspaces/{workspace}
GET    /workspaces/{workspace}/members
PATCH  /workspaces/{workspace}/members/{member}
DELETE /workspaces/{workspace}/members/{member}
POST   /workspaces/{workspace}/invitations
POST   /invitations/{token}/accept
```

### Projects

```text
GET    /workspaces/{workspace}/projects
POST   /workspaces/{workspace}/projects
GET    /projects/{project}
PATCH  /projects/{project}
DELETE /projects/{project}
POST   /projects/{project}/archive
POST   /projects/{project}/duplicate
GET    /projects/{project}/members
POST   /projects/{project}/members
POST   /projects/{project}/sections
PATCH  /sections/{section}
POST   /projects/{project}/sections/reorder
```

### Tasks and collaboration

```text
GET    /projects/{project}/tasks
POST   /projects/{project}/tasks
GET    /tasks/{task}
PATCH  /tasks/{task}
DELETE /tasks/{task}
POST   /tasks/{task}/complete
POST   /tasks/{task}/duplicate
POST   /tasks/bulk
POST   /tasks/{task}/subtasks
POST   /tasks/{task}/followers
DELETE /tasks/{task}/followers/{user}
GET    /tasks/{task}/comments
POST   /tasks/{task}/comments
PATCH  /comments/{comment}
DELETE /comments/{comment}
POST   /tasks/{task}/attachments
DELETE /attachments/{attachment}
GET    /tasks/{task}/activity
```

### Views and notifications

```text
GET    /my-tasks
GET    /search
GET    /notifications
POST   /notifications/{notification}/read
POST   /notifications/read-all
GET    /projects/{project}/calendar
GET    /projects/{project}/board
GET    /projects/{project}/timeline
```

Use sparse field selection or purpose-built list resources so project views do not download full task details. Use cursor pagination for long activity, notification, and search feeds.

---

## 10. Notification and email design

### Event flow

```text
User action
  -> database transaction
  -> domain event after commit
  -> activity record
  -> notification resolver
  -> in-app notification + queued email/realtime broadcast
  -> retry/failure tracking
```

### Initial notification events

- Workspace invitation
- Task assigned or reassigned
- User mentioned in a comment or description
- New comment on a followed task
- Task due soon or overdue
- Task completed or reopened
- Dependency completed or blocked
- Project status published
- Request for approval and approval result

### Rules

- Dispatch notifications only after the database transaction commits.
- Never send SMTP mail in the web request.
- Deduplicate rapid updates and avoid notifying the actor about their own action.
- Bundle noisy events into digests where appropriate.
- Include a secure deep link, human-readable context, and email preference link.
- Record delivery attempts without storing sensitive email content unnecessarily.

---

## 11. Real-time behavior

Broadcast workspace-authorized events for:

- New notifications and unread counts
- New/edited comments
- Task field changes
- Task creation, movement, and completion
- Presence in task detail later, if needed

The client should invalidate/refetch affected TanStack Query keys after an event. Use optimistic updates for simple changes, then reconcile with the server response. Do not attempt full collaborative rich-text editing in the MVP.

---

## 12. Security and operational requirements

- Sanctum cookie authentication with CSRF protection
- Secure, HTTP-only, same-site cookies in production
- Server-side policies for every resource action
- Workspace scoping on all queries and route bindings
- Rate limits for login, invitations, comments, uploads, and public endpoints
- File size/type validation, randomized paths, private objects, authorized downloads
- HTML sanitization for rich text and safe mention parsing
- Escaped notification/email content
- Signed, expiring invitation and file links where applicable
- Protection against mass assignment and unbounded pagination
- Audit administrator, role, member, permission, and deletion changes
- Secret management through environment/runtime configuration
- Encrypted backups and tested restoration
- Dependency, static-analysis, and security checks in CI

---

## 13. Testing and quality strategy

### Backend

- Unit tests for permission rules, ordering, recurrence, reminder calculations, and automation evaluation
- Feature tests for every endpoint's success, validation, authorization, and cross-workspace denial paths
- Queue/notification tests for recipients, channels, preferences, and deduplication
- Storage tests for upload and authorized download

### Frontend

- Component tests for shared controls and task interactions
- Integration tests for query/mutation states, errors, and optimistic updates
- Accessibility checks for dialogs, menus, boards, tables, and forms

### End-to-end critical paths

1. Register, create workspace, and invite a colleague.
2. Accept invitation and access only authorized projects.
3. Create a project, section, task, and subtask.
4. Assign, comment, mention, attach a file, and complete a task.
5. Receive and open in-app/email notification deep links.
6. Move tasks in list/board and verify consistent order.
7. Filter My Tasks and view overdue work.
8. Verify dark mode and responsive layouts.

### Quality gates

- PHP formatter and static analysis pass.
- ESLint, TypeScript, and formatting pass.
- Unit/feature/component tests pass.
- Playwright smoke suite passes against a production-like build.
- No critical accessibility violations in primary workflows.

---

## 14. Delivery roadmap

An “almost complete Asana” product is a multi-month effort, not a four-week build. The first four weeks should target an internal MVP; subsequent phases add breadth safely.

### Four-week MVP sprint

| Week | Deliverables |
| --- | --- |
| 1 | Project setup, CI, authentication, workspace membership, roles, theme, app shell, seed data |
| 2 | Projects, sections, tasks, assignments, subtasks, attachments, list view, policies |
| 3 | Comments, mentions, activity, queued email/in-app notifications, board, basic calendar, Reverb |
| 4 | My Tasks, dashboard summaries, filters, responsive/accessibility pass, browser tests, deployment runbook |

### Post-MVP roadmap

| Release | Approximate focus | Major outcomes |
| --- | --- | --- |
| R1 | 4–6 weeks | Harden MVP from pilot feedback, performance, import/export, advanced filters |
| R2 | 6–8 weeks | Timeline, dependencies, milestones, custom fields, forms, templates, recurring tasks |
| R3 | 6–8 weeks | Workload, portfolios, goals, status updates, dashboards, reporting |
| R4 | 8–12 weeks | Automations, approvals, integrations, time tracking, public API/webhooks |
| R5 | Ongoing | SSO/SCIM, custom roles, compliance, mobile/PWA, enterprise administration |

Durations are planning estimates and should be revised after team size, integration requirements, and acceptance criteria are confirmed.

---

## 15. Initial backlog

### Epic A — Engineering foundation

- Initialize Laravel/React application and environment templates.
- Add code quality, test, and CI commands.
- Configure MySQL, queue, scheduler, mail, storage, and Reverb.
- Define API errors, pagination, dates, IDs, and response resources.
- Add production health endpoints and structured logging.

### Epic B — Design system and application shell

- Configure Manrope and semantic theme tokens.
- Build light/dark modes with stored preference.
- Build responsive sidebar, header, workspace switcher, and user menu.
- Create reusable loading, empty, error, and permission states.
- Create Storybook or an internal component gallery if the team benefits from it.

### Epic C — Identity and organization

- Implement authentication and account recovery.
- Implement workspaces, memberships, invitations, teams, and roles.
- Implement policy tests and cross-workspace isolation tests.
- Build member and team administration pages.

### Epic D — Projects and tasks

- Implement project CRUD, membership, privacy, and archive behavior.
- Implement sections and stable ordering.
- Implement task CRUD, assignments, dates, status, priority, and completion.
- Implement subtasks, followers, tags, attachments, and bulk actions.
- Build list view and task detail pane.

### Epic E — Collaboration and notifications

- Implement rich-text comments and @mentions.
- Implement activity logging through domain events.
- Implement in-app inbox, queued emails, and notification preferences.
- Implement deadline scheduler and reminder deduplication.
- Add Reverb updates for notifications, comments, and task changes.

### Epic F — Views and dashboard

- Build Kanban board with accessible drag-and-drop alternatives.
- Build project calendar and date interactions.
- Build My Tasks and overdue/upcoming groupings.
- Build dashboard cards for task counts, project progress, and team workload preview.

### Epic G — Release readiness

- Add demo workspace and realistic seed data.
- Complete critical end-to-end tests.
- Verify performance with realistic task/comment volumes.
- Run accessibility and security reviews.
- Document deployment, workers, scheduler, backups, recovery, and rollback.

---

## 16. Performance targets

- Primary authenticated pages become usable within 2.5 seconds on typical office broadband.
- Common API reads target p95 under 400 ms at expected pilot load.
- Mutations target p95 under 700 ms, excluding asynchronous work.
- Paginate or virtualize lists above 100 visible tasks.
- Avoid N+1 queries and cap nested resource expansion.
- Process mail, reminders, imports, exports, thumbnails, and automation asynchronously.
- Add database indexes based on actual query plans and production telemetry.

---

## 17. Deployment plan

### Environments

- Local development
- Shared staging with sanitized/demo data
- Production

### Production services

- Web application/API
- MySQL database
- Redis cache/queue
- Queue workers managed by Supervisor/Horizon
- Scheduler running every minute
- Reverb WebSocket process
- Private object storage
- SMTP provider
- Centralized logs, error tracking, uptime monitoring, and backups

### Release process

1. Run automated quality gates.
2. Build versioned frontend assets.
3. Back up before risky migrations.
4. Deploy code and run backward-compatible migrations.
5. Restart workers and verify scheduler/Reverb health.
6. Run smoke tests.
7. Monitor errors, latency, queues, and mail delivery.
8. Roll back application version if health checks fail; use forward-fix migrations for database changes.

---

## 18. Decisions to confirm before implementation

- Laravel version and supported PHP version on the deployment server
- Single company workspace or multiple customer workspaces
- Registration policy: open, company-domain only, or invitation only
- Whether a task has one assignee or multiple assignees in the initial release
- Required workspace/project roles and approval rules
- English-only MVP or English and Bangla from day one
- SMTP provider and sender domain readiness
- Maximum attachment size and allowed file types
- Local server, VPS, managed platform, or container deployment
- Backup retention and audit-log retention requirements
- Required integrations and SSO/compliance deadlines

Defaults for implementation: invitation-only workspaces, one primary task assignee plus followers, English-first translation-ready UI, local private storage in development, and S3-compatible private storage in production.

---

## 19. Definition of done for the MVP

The MVP is ready for an internal pilot when:

- Users can authenticate, join a workspace by invitation, and operate only within their permissions.
- Teams can create projects, sections, tasks, subtasks, comments, and attachments.
- Assignments, due dates, completion, sorting, filtering, and bulk actions work reliably.
- List, board, calendar, My Tasks, and task detail views stay consistent.
- Activity history captures important changes.
- In-app and queued email notifications respect user preferences.
- Queue workers, scheduler, Reverb, storage, and mail are observable in staging.
- Critical user journeys have automated browser coverage.
- Responsive behavior, keyboard navigation, dark mode, and key accessibility checks pass.
- Deployment, backup, recovery, and rollback instructions are documented and tested.

---

## 20. First implementation milestone

Start with a vertical slice rather than building isolated screens:

1. Set up Laravel, React, TypeScript, Tailwind, shadcn/ui, and Manrope.
2. Implement authentication and invitation-only workspace membership.
3. Build the application shell and theme system.
4. Create projects, sections, and tasks with server-side policies.
5. Build the project list view and task detail pane.
6. Assign a task and publish an after-commit domain event.
7. Create an in-app notification and queued assignment email.
8. Add a comment and activity record.
9. Cover the complete flow with feature and Playwright tests.

This slice proves the architecture and the core business value before board, calendar, timeline, reporting, and enterprise features expand the surface area.
