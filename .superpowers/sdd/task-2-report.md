# Task 2 Report: Sales CRM

## Status

`DONE_WITH_CONCERNS`

The coherent Sales CRM scope is implemented, verified, and committed. Core server, repository, transaction, UI, validation, audit, i18n, RBAC, migration, and deterministic seed work is complete. The concerns are environment/test-surface limitations listed below rather than known failures in the verified checks.

## Commits

- `cf9a122` — `feat: implement sales CRM workflows`
- `b466523` — `docs: record sales CRM verification`
- The review-fix commit is recorded in the parent handoff because this report is part of that commit.

## Delivered Features

- Repository-backed, role-scoped dashboard with sales/operational KPI selection, sales funnel, monthly order trend, lead sources, upcoming follow-ups, recent leads/orders, and risk reminders.
- Leads:
  - Scoped pagination, fuzzy search, country/source/status/owner/date filters.
  - Create, edit, detail, duplicate detection, follow-up timeline, and loading/success/failure UI feedback.
  - Confirmed batch status API/UI and scoped batch owner-assignment API.
  - Transactional conversion to Customer, primary Contact, and Opportunity with audit.
  - CSV parse, preview, row validation, explicit commit, and scoped/filtered export.
- Customers:
  - Scoped list/create/edit/detail with status, level, risk rating, and risk notes.
  - Detail navigation for overview, contacts, follow-ups, opportunities, quotations, orders, payments, shipments, after-sales, files, and activity.
  - Empty tabs render accurate empty states; no synthetic later-domain rows are shown.
- Contacts:
  - Customer-scoped create/update/archive APIs and create UI.
  - Database-backed one-active-primary constraint.
  - Decision role, language, timezone, preferred channel, WhatsApp, and WeChat fields.
- Follow-ups:
  - Scoped list/create/update/archive APIs and timeline UI.
  - Channel, outcome, next action/date, completion, attachment metadata, and Customer/Contact/Lead/Opportunity relationships.
  - Overdue repository query and dashboard reminders.
- Opportunities:
  - Scoped list/create APIs, six-stage Kanban board, drag/drop mutation feedback, audited stage changes, required loss reason, won/lost timestamps, and weighted forecast.
- Persistence:
  - Prisma schema and SQL migration for CRM fields, indexes, foreign keys, primary-contact partial unique index, related-record check, and loss-reason check.
  - Deterministic seed extended to 20 customers, 30 contacts, 40 leads, 20 opportunities, and 24 follow-ups.
- Tests:
  - Ownership and owner-filter override, duplicates, conversion delegation/transaction boundary, primary-contact rule, overdue logic, stage transitions, weighted forecast, CSV behavior, schema module evaluation, and dashboard KPI scoping.

## Exact Verification Results

Red/green evidence:

- Initial `pnpm test src/modules/crm/crm-domain.test.ts src/modules/crm/crm-service.test.ts src/modules/crm/csv.test.ts`
  - RED: 3 suites failed because the three production modules did not exist.
  - GREEN: 3 files passed, 18 tests passed.
- `pnpm test src/modules/dashboard/dashboard-service.test.ts`
  - RED: 2 failures, `dashboardKpis is not a function`.
  - GREEN: dashboard service tests passed after the minimal implementation.
- `pnpm test src/modules/crm/crm-schemas.test.ts`
  - RED: module import failed with `.omit() cannot be used on object schemas containing refinements`.
  - GREEN: 1 file passed, 1 test passed after deriving update fields from the unrefined base schema.
- `pnpm test src/modules/crm/crm-domain.test.ts`
  - RED: 2 failures, `crmOwnerWhere is not a function`.
  - GREEN: 1 file passed, 14 tests passed after enforcing representative scope over requested owner filters.

Final fresh gate:

- `pnpm test`
  - Exit `0`; 17 test files passed; 77 tests passed; 0 failed.
- `pnpm typecheck`
  - Exit `0`; `tsc --noEmit` reported no errors.
- `pnpm lint`
  - Exit `0`; ESLint reported no errors or warnings.
- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm prisma:generate`
  - Exit `0`; Prisma Client 7.8.0 generated successfully.
- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm build`
  - Exit `0`; Next.js 16.2.10 production build compiled, typechecked, collected page data, generated 29 routes/pages, and finalized successfully.
- `git diff --cached --check`
  - Exit `0` before the implementation commit.

## Review Fix Pass

The review findings were addressed with surgical changes:

- Dashboard access now requires `dashboard.read` and an explicit role/domain scope. Sales managers and administrators receive global sales scope, sales representatives receive owner-only sales scope, and operations roles receive operational metrics without CRM aggregates.
- Converted leads are immutable across edit, batch, and reconversion paths. Conversion atomically claims an unconverted lead, and unique database indexes protect converted Customer and Opportunity identities.
- Customer timelines include direct, Contact-linked, and Opportunity-linked follow-ups. Follow-up audit metadata records all related entity IDs.
- Opportunity ownership is inherited from the Customer. Stage updates use the Opportunity version and current stage in a conditional write to reject stale concurrent moves.
- The CRM UI now exposes Contact and follow-up edit/archive controls, batch owner assignment, converted-lead safeguards, and localized Task 2 forms, dialogs, feedback, pagination, CSV, and board text in English and Chinese.
- The invalid converted-lead select default was removed.

Review red/green evidence:

- Focused dashboard/CRM tests initially failed 11 tests for the missing access-scope, immutability, relation, ownership, and concurrency behavior; after the fixes, the focused suite passed 34/34 tests.
- A new KPI permission regression test first failed because `dashboardKpis` did not require `dashboard.read`; after adding the guard it passed.

Final fresh review gate:

- Focused suite: 5 files passed, 40 tests passed, 0 failed.
- `pnpm test`: 17 files passed, 90 tests passed, 0 failed.
- `pnpm typecheck`: exit `0`.
- `pnpm lint`: exit `0`.
- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm prisma:generate`: exit `0`; Prisma Client 7.8.0 generated.
- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm pnpm build`: exit `0`; Next.js 16.2.10 generated 29 routes/pages.

## Final Customer Follow-up Fix

- Customer detail now includes a working follow-up creation form that always relates the record to the current Customer and optionally adds one of that Customer's Contacts or Opportunities.
- The form reuses the validated `POST /api/follow-ups` API and existing mutation component. It supports type, channel, summary, occurred time, outcome, next action, and next-action time with localized loading, success, and error feedback.
- Customer Activity now includes FollowUp audit entries whose metadata relates through `contactId` or `opportunityId`, in addition to direct `customerId` entries.
- English and Chinese relation labels were added.

Focused red/green evidence:

- Activity test RED: 1 failure, `customerActivityWhere is not a function`.
- Activity test GREEN: 20/20 CRM domain tests passed.
- Localization test RED: 1 failure because `relatedContact` was missing.
- Combined focused GREEN: 2 files passed, 26 tests passed.

Fresh final gate:

- `npm test`: exit `0`; 17 files passed, 92 tests passed.
- `npm run typecheck`: exit `0`.
- `npm run lint`: exit `0`.
- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm npm run prisma:generate`: exit `0`; Prisma Client 7.8.0 generated.
- `DATABASE_URL=postgresql://crm:crm@localhost:5432/crm npm run build`: exit `0`; Next.js 16.2.10 generated 29 routes/pages.

## Self-Review

- Ownership is enforced twice: API permissions gate entry and repository predicates restrict identities/aggregates. Representative-supplied `ownerId` filters cannot replace the authenticated owner scope.
- Foreign lead/opportunity/customer/contact identities return not found at repository boundaries; mutations re-read scoped records before writes.
- Lead conversion uses one interactive Prisma transaction for Customer, primary Contact, Opportunity, Lead conversion fields, and audit.
- Opportunity movement checks the current stage again before updating, records audit, and applies terminal probability/timestamps consistently.
- Follow-ups reject missing relationships, foreign-owned relationships, and mixed-owner relationships.
- Audit writes occur in the same transaction as their corresponding CRM mutation.
- Detail tabs use real repository relations and accurate empty states.
- All Task 2 files were staged explicitly; existing untracked task briefs, progress ledger, review packages, and the pre-existing master plan were not modified or committed.

## Concerns

- Playwright is not installed or configured in the foundation, and no browser runtime is available through the package scripts; representative E2E coverage was therefore not added or run.
- A live PostgreSQL service was not available in this workspace. Prisma schema generation and production build were verified, but the new migration and deterministic seed were not applied against a running database.
- The foundation has no shared Excel export service, so Task 2 delivers CSV import/export only.
