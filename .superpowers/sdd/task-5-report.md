# Task 5 Management Closeout Report

## Status

Implemented and verified in the shared worktree. The management closeout now provides functional after-sales, task, notification, reporting/export, settings, activity-log, worker reminder, backup/restore, seed, navigation, and operator-documentation surfaces.

No commit was created. The execution request explicitly prohibited committing because the worktree already contains prior uncommitted Task 3/4 work.

## Delivered features

### After-sales

- Extended `AfterSalesTicket` with issue type, priority, customer/order/product/serial relations, attachment asset IDs, assignment, solution, cost/currency, resolved/closed timestamps, and optimistic versioning.
- Added validated create/update APIs and a bilingual functional page with real relations, empty state, assignment/cost presentation, and guarded start/resolve/close actions.
- Enforced a documented lifecycle. Closed tickets are terminal, and closure requires a solution.
- Ticket mutations write same-transaction audit events.

### Tasks and notifications

- Added team code and reminder dates while retaining personal assignment, related entity, priority, due date, optimistic versioning, and completion timestamp.
- Added ownership/team-manager-aware task reads, audited create/update APIs, terminal completed/cancelled states, overdue derivation, and assignment notifications.
- Added list, Kanban, and calendar task views with real data and overdue indicators.
- Added notification list/unread count, deep links, individual/all mark-read actions, and the unread count in the application shell.

### Worker reminders

- Added six reminder categories: due follow-ups, outstanding receivables, expiring quotes, delayed purchasing, delayed shipments, and low inventory.
- Added a Prisma reminder repository with a deterministic unique dedupe key and `createMany(..., skipDuplicates: true)` idempotency.
- Registered `generate_management_reminders` in Graphile Worker with a default 15-minute crontab. Unhandled failures use Graphile Worker's retry behavior.

### Reports and exports

- Added server-side report scoping: sales representatives are restricted to owned sales orders; managers and authorized finance/procurement/operations roles receive their valid broader scope.
- Added sales, collections, receivables, customer, market, product, representative, supplier, purchasing, logistics, after-sales, profit, and conversion views.
- Added exact Decimal.js sales/collection/receivable/profit calculations. Profit is hidden from rows and blocked at the API unless `finance.profit.read` is present.
- Added JSON, escaped UTF-8 CSV, Excel-compatible `.xls`, and valid single-page PDF exports.
- The report page exposes only report types permitted for the active user.

### Settings and activity logs

- Added validated company, currency/manual-rate, tax, bank, template, catalog, and backup settings.
- Manual currency settings write an `ExchangeRate` record with source `MANUAL`.
- Bank accounts are masked and password/secret/token keys are recursively redacted. Saving a masked setting preserves the stored secret rather than replacing it with the mask.
- Existing user/role/permission pages remain the functional role-management surface; the settings navigation resolves alongside them.
- Added authorized, filterable, read-only activity-log API/page with actor, action, entity, date, before/after and metadata detail. Sensitive values are redacted recursively.

### Schema, seed, navigation, operations and docs

- Added `prisma/migrations/20260720030000_management_closeout/migration.sql`.
- Extended deterministic seed permissions, practical settings/manual exchange rates, exactly 10 after-sales tickets and 20 personal/team tasks.
- Added permission-aware navigation for every new page.
- Added retention-aware PostgreSQL/MinIO `scripts/backup.ps1` and explicit-confirmation `scripts/restore.ps1`.
- Added `docs/operations/backup-restore.md`, including a quarterly isolated restore drill.
- Expanded README with overview/stack, modules, structure, requirements, installation, database/worker operation, deterministic seed, accounts, roles, commands, Docker deployment, backup/restore and troubleshooting.

## Main files

- `src/modules/management/management-domain.ts`
- `src/modules/management/management-schemas.ts`
- `src/modules/management/reporting.ts`
- `src/modules/management/reminders.ts`
- `src/modules/management/prisma-reminder-repository.ts`
- `src/modules/management/management-service.ts`
- `src/modules/management/*.test.ts`
- `src/app/api/{tickets,tasks,notifications,reports,settings,activity-logs}/`
- `src/app/[locale]/(app)/{tickets,tasks,notifications,reports,settings,activity-logs}/`
- `src/components/management/management-forms.tsx`
- `src/components/app-shell.tsx`
- `src/app/[locale]/(app)/layout.tsx`
- `src/app/globals.css`
- `src/worker.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `prisma/migrations/20260720030000_management_closeout/migration.sql`
- `scripts/backup.ps1`
- `scripts/restore.ps1`
- `docs/operations/backup-restore.md`
- `README.md`
- `.env.example`

## Red-green TDD evidence

- Initial focused run: four management suites failed because the requested domain/schema/report/reminder modules did not exist; the rest of the pre-existing suite remained green.
- Ticket transition, overdue calculation, recursive redaction, settings validation, permission/report calculations, and reminder dedupe tests were then implemented to green.
- PDF/CSV export test failed first with `toSimplePdf is not a function`, then passed after the minimal PDF writer was added.
- Dimension aggregation test failed first with `groupReportRows is not a function`, then passed after decimal-safe grouping was added.
- Task terminal-state test failed first with `assertTaskTransition is not a function`, then passed after the transition guard was added and wired into updates.
- Masked-secret preservation test failed first with `preserveMaskedValues is not a function`, then passed after settings preservation was added.

## Final verification

- `node node_modules/vitest/vitest.mjs run src/modules/management` — passed: 4 files, 10 tests at the first complete focused gate; the final management coverage is included in the full count below.
- `pnpm test` — passed: 38 files, 201 tests; 1 integration file/5 tests skipped by its existing environment gate.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed with no errors or warnings.
- `pnpm build` — passed; Next.js compiled, type-checked, generated 75 static pages, and listed all six new locale pages plus nine new API routes.
- `node node_modules/prisma/build/index.js validate` — passed; schema valid.
- `docker compose config --quiet` — passed. Docker emitted a non-fatal warning that the sandbox could not read the user's global Docker config.
- PowerShell AST parsing of both backup/restore scripts — passed.
- `git diff --check` — passed; only existing line-ending notices were emitted.

## Self-review

- Scope remained inside the requested vertical slice; unrelated Task 3/4 edits were not reverted, reformatted, or committed.
- Every new navigation entry points to a built route and renders real database data or an explicit empty state.
- Mutating APIs authenticate, require their explicit permission, validate with Zod, and use optimistic concurrency where records are editable.
- Profit, bank-account and audit-log sensitive values are enforced server-side rather than only hidden in UI.
- Reminder creation is idempotent under repeated runs and database concurrency because the dedupe key is unique.
- Report exports use the same server-side permission scope and calculations as the page.
- Backup restore requires an explicit confirmation switch and the runbook requires an isolated restore drill.

## Concerns and limits

- A live migration/seed/backup/restore drill was not run. `docker compose ps` could not access the Docker named pipe in this sandbox (`permission denied`), although Compose configuration, Prisma schema, production build, and script syntax all validated.
- The existing PostgreSQL integration suite remains skipped behind its environment gate; no new skip was introduced.
- Ticket attachments currently reference existing `FileAsset` IDs. This slice validates those IDs and exposes the relation, but the repository still has no general-purpose upload endpoint; operators must use the existing object/file ingestion path.
- Excel export is an Excel-compatible UTF-8 tabular `.xls` response, not an OOXML `.xlsx` workbook. PDF export is intentionally simple and best suited to Latin report text.
- The app shell filters navigation by permission, but direct access remains protected independently by each page/API as required.

## Critical/Important review fixes (2026-07-20)

### Backup and restore safety

- Backup roots now reject filesystem roots, retention must be positive, each generated target is verified as a direct child of the configured root, and retention deletes only completed timestamp-named directories with a manifest.
- Backup execution is fail-safe: PostgreSQL and MinIO artifacts must both succeed before `manifest.json` is written; failures remove the incomplete timestamp directory.
- Completed manifests inventory the relative path, SHA-256, and byte length of every artifact.
- Restore parses and validates the supported manifest, rejects absolute/path-traversal entries, verifies every artifact SHA-256, and checks required database/MinIO artifacts before invoking destructive restore commands.
- Backup and restore both honor an explicit `http://`/`https://` MinIO endpoint or derive the scheme from `MINIO_USE_SSL`.
- The operator runbook documents root restrictions, incomplete cleanup, integrity validation, and endpoint/SSL behavior.

### Report authorization and exports

- Added report-type policy and seeded report-type permissions. Sales representatives now receive reporting permissions but remain constrained to their owned sales-order scope and commercial report types.
- Sales managers, finance, procurement, and operations receive only their role-relevant report types; unrelated direct report requests fail server-side with `PERMISSION_DENIED`.
- Supplier, purchasing, logistics, after-sales, and conversion reports no longer query or return unrelated sales totals. Their `totals` value is `null`, and the page omits sales metric cards.
- Specialized report queries now apply active date filters to their own data.
- Export links preserve `from` and `to`, and API tests verify the exact dates passed to the report service.
- Removed misleading fake `.xls` and unsafe single-page PDF exports. The UI/API truthfully support JSON and UTF-8 CSV only; unsupported formats return validation errors.

### Settings and audit secrets

- `Setting.isSecret` now masks every nested scalar and array leaf in settings responses, regardless of field name.
- Masked full-secret objects and arrays preserve stored values recursively when submitted unchanged.
- Setting update audit events use the same whole-value masking and record `metadata.isSecret`; activity-log reads enforce that metadata policy again.

### Tasks and reminders

- The worker repository now queries due, non-terminal task `reminderAt` values and creates deduplicated `TASK_REMINDER` notifications for assignees.
- Team codes are constrained to existing role codes. Task assignment validates that the assignee is active and belongs to the selected role/team; non-global task reads include tasks assigned to any of the caller's role teams.
- Assignee options now expose actual role/team data, the task UI offers those team values instead of unchecked free text, and seed task teams match each assignee's real role.
- Direct `COMPLETED`/`CANCELLED` task creation is rejected; completion remains a workflow transition that sets `completedAt`.

### Ticket workflow

- Resolving and closing both require a nonblank, user-supplied solution.
- Removed generic fabricated resolution text. Resolve/close actions now render a required solution form, with an existing real resolution carried into closure.
- Removed the unusable ticket attachment-ID upload control. Existing attachment relations and API validation remain intact for assets created through a real ingestion path.

### Added review regression coverage

- Service RBAC tests cover owned Sales Rep scoping, unrelated report denial, and specialized report total isolation.
- Repository tests cover real task-reminder candidate generation and database dedupe-key writes.
- Service/domain tests cover whole-setting secret responses, secret activity-log values, nested/array masked-value preservation, and valid team assignment.
- API tests cover export date propagation, UTF-8 CSV output, and rejection of fake Excel/PDF formats.
- Script tests cover incomplete cleanup, safe retention selection, manifest/checksum order, and MinIO SSL configuration.

### Review verification

- Focused: `vitest run src/modules/management src/app/api/reports/route.test.ts` — 7 files, 33 tests passed.
- Full: `vitest run` — 41 files/222 tests passed; 1 file/5 existing integration tests skipped by the environment gate.
- TypeScript: `tsc --noEmit` — passed.
- ESLint: `eslint .` — passed with zero warnings.
- Production build: `next build` — passed; 75 static pages generated and all management/API routes listed.
- Prisma: `prisma validate` — schema valid.
- PowerShell AST parsing: both backup and restore scripts passed.
- `git diff --check` — passed; only existing line-ending notices were emitted.
- No commit was created, as requested.

### Remaining operational limit

- A live PostgreSQL/MinIO backup and destructive isolated restore drill still requires an operator environment with the external tools and services. The scripts, manifest ordering, integrity checks, syntax, tests, and runbook were verified here; no production-like restore was attempted.

## Final Important rereview fixes (2026-07-20)

### Delivered

- Restore now builds a normalized manifest inventory, rejects duplicate entries, requires `postgres.dump` to be inventoried, enumerates every file in the MinIO backup tree, and requires each MinIO artifact to have a manifest entry. All listed checksums and required-entry checks complete before `pg_restore` or any bucket mutation.
- Report-type access now requires both `report.read` and the explicit `report.<type>.read` permission. Role names no longer determine report availability, so custom roles receive exactly the report types granted by their permissions. The existing seed already assigns both the broad and relevant per-type permissions to every built-in reporting role; affected test contexts were updated accordingly.
- Product report revenue now converts each `SalesOrderItem.lineTotal` through its parent order's captured `exchangeRateToUsd` snapshot before summing USD totals.
- A date-only report `to` value is normalized to midnight of the following UTC day, and all report repositories use that value as an exclusive upper bound.
- Ticket updates now preserve the solution of resolved tickets, require a solution for every resulting resolved/closed state, and reject all PATCH mutations after closure.

### Red-green TDD evidence

- Red command:
  `node node_modules/vitest/vitest.mjs run src/modules/management/operations-scripts.test.ts src/modules/management/reporting.test.ts src/modules/management/management-schemas.test.ts src/modules/management/management-service.test.ts src/app/api/reports/route.test.ts`
  - Result before implementation: 5 files failed; 8 tests failed and 21 passed.
  - The failures independently exposed missing required restore inventory entries, role-bound/broad report authorization, midnight date truncation, inclusive `lte` query bounds, unconverted product totals, solution clearing, and closed-ticket mutation.
- Green rerun of the same command: 5 files and 29 tests passed.

### Final verification

- Full Vitest: `node node_modules/vitest/vitest.mjs run` — 41 files/229 tests passed; 1 file/5 existing integration tests skipped by its environment gate.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` — passed.
- Focused ESLint over all changed TypeScript test/implementation files — passed with zero errors or warnings.
- PowerShell AST parsing of `scripts/restore.ps1` — passed.
- Production build: `node node_modules/next/dist/bin/next build` — passed; 75 static pages generated and the report/ticket pages and APIs were included.
- `git diff --check` over the changed implementation/test paths — passed.
- No commit was created, as requested.

## Final reports-page date-boundary fix (2026-07-20)

- The reports page now parses its date filters through `reportQuerySchema`, matching the API's normalization of a date-only `to` value to the following UTC midnight for the service's exclusive `lt` boundary.
- Added a focused reports-page regression test that verifies selecting `2026-07-20` passes `2026-07-21T00:00:00.000Z` to the report service.
- Red: the focused test failed because the page passed `2026-07-20T00:00:00.000Z`.
- Green: `vitest run "src/app/[locale]/(app)/reports/page.test.tsx"` — 1 file/1 test passed.
- TypeScript: `tsc --noEmit` — passed.
- No commit was created, as requested.
