# Management Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development and superpowers:verification-before-completion. Do not commit because the shared worktree contains prior uncommitted work.

**Goal:** Deliver the final support, productivity, reporting, settings, notification, operations, and documentation slice with functional RBAC-aware APIs and pages.

**Architecture:** Extend the existing Prisma management records, then add one focused `management` module whose domain helpers stay database-independent and whose service owns transactional persistence, auditing, scoping, and presentation. Route Handlers and locale pages remain thin adapters. Graphile Worker calls an idempotent reminder task implemented behind a repository boundary.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Zod, Decimal.js, Graphile Worker, Vitest.

## Global Constraints

- Preserve unrelated uncommitted changes.
- Follow existing `currentAuthorizationContext`, `requirePermission`, `failure`/`success`, Prisma transaction, audit, and page styles.
- Write and run failing tests before production implementation.
- Keep sensitive settings and audit values redacted.
- Do not create a git commit.

---

### Task 1: Domain contracts and regression tests

**Files:**
- Create: `src/modules/management/management-domain.test.ts`
- Create: `src/modules/management/management-domain.ts`
- Create: `src/modules/management/management-schemas.test.ts`
- Create: `src/modules/management/management-schemas.ts`
- Create: `src/modules/management/reporting.test.ts`
- Create: `src/modules/management/reporting.ts`
- Create: `src/modules/management/reminders.test.ts`
- Create: `src/modules/management/reminders.ts`

**Interfaces:**
- Produces ticket/task transition guards, overdue derivation, sensitive-value redaction, report scope/calculation/export, settings schemas, and idempotent reminder processing.

- [ ] Write failing tests for every required core behavior.
- [ ] Run focused tests and confirm missing-module failures.
- [ ] Implement the minimal pure functions and schemas.
- [ ] Run focused tests and confirm they pass.

### Task 2: Persistence and HTTP surface

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260720030000_management_closeout/migration.sql`
- Create: `src/modules/management/management-service.ts`
- Create: `src/app/api/tickets/route.ts`
- Create: `src/app/api/tickets/[id]/route.ts`
- Create: `src/app/api/tasks/route.ts`
- Create: `src/app/api/tasks/[id]/route.ts`
- Create: `src/app/api/notifications/route.ts`
- Create: `src/app/api/notifications/read/route.ts`
- Create: `src/app/api/reports/route.ts`
- Create: `src/app/api/settings/route.ts`
- Create: `src/app/api/activity-logs/route.ts`

**Interfaces:**
- Consumes the Task 1 domain/schemas.
- Produces authenticated RBAC-aware list, create, update/transition, read, export, settings, and audit endpoints.

- [ ] Extend ticket/task/notification relations and dedupe metadata.
- [ ] Implement transactional audited ticket, task, and settings mutations.
- [ ] Implement ownership-aware reads and permission-aware reporting.
- [ ] Implement read-only redacted activity-log filtering.

### Task 3: Functional locale pages and navigation

**Files:**
- Create: `src/components/management/management-forms.tsx`
- Create: `src/app/[locale]/(app)/tickets/page.tsx`
- Create: `src/app/[locale]/(app)/tasks/page.tsx`
- Create: `src/app/[locale]/(app)/notifications/page.tsx`
- Create: `src/app/[locale]/(app)/reports/page.tsx`
- Create: `src/app/[locale]/(app)/settings/page.tsx`
- Create: `src/app/[locale]/(app)/activity-logs/page.tsx`
- Modify: `src/components/app-shell.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes management service reads and API endpoints.
- Produces list/Kanban/calendar task views, ticket workflow, notification actions, report exports, settings editor, and audit detail.

- [ ] Add pages with real database data and accurate empty states.
- [ ] Add permission-aware mutation forms and real links.
- [ ] Add navigation entries and notification unread count.

### Task 4: Worker, operations, seed, and documentation

**Files:**
- Modify: `src/worker.ts`
- Create: `scripts/backup.ps1`
- Create: `scripts/restore.ps1`
- Create: `docs/operations/backup-restore.md`
- Modify: `.env.example`
- Modify: `prisma/seed.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes idempotent reminder processing.
- Produces scheduled/retryable reminders, PostgreSQL/MinIO backup and restore operations, deterministic ticket/task samples, and operator documentation.

- [ ] Register reminder generation and a recurring schedule.
- [ ] Add retention-aware backups and explicit restore confirmation.
- [ ] Seed requested management records/settings.
- [ ] Complete setup, deployment, accounts, backup, and troubleshooting documentation.

### Task 5: Verification and report

**Files:**
- Create: `.superpowers/sdd/task-5-report.md`

- [ ] Run focused management tests.
- [ ] Run full Vitest suite.
- [ ] Run Prisma generation, TypeScript, ESLint, build, and Compose validation.
- [ ] Review changed files against every requirement and record gaps/concerns.
