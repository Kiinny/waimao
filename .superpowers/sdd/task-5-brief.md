# Task 5: Management Closeout

Complete support, productivity, reporting, settings, operations and documentation.

## Requirements

- Follow established patterns and red-green TDD.
- After-sales tickets support all requested issue types/statuses, priorities, customer/order/product/serial relations, attachments, assignment, solutions, costs and closure.
- Tasks support personal/team assignment, list/Kanban/calendar views, relations, due/reminder dates, priorities, status transitions, overdue calculation and notifications.
- Notifications have unread counts, mark-read actions, deep links and worker-generated reminders for follow-ups, receivables, expiring quotes, delayed purchasing/shipments and low inventory.
- Reports implement all requested sales, collection, receivable, customer, market, product, representative, supplier, purchasing, logistics, after-sales, profit and conversion views with permission-aware filters and CSV/Excel/PDF export.
- Settings implement company/profile/logo metadata, supported currencies/manual rates, taxes, bank accounts with masking, templates, payment/incoterm/status/category/source types, roles/permissions and backup settings.
- Activity Logs provide authorized filtering and read-only detail; sensitive values remain redacted.
- Add Graphile Worker tasks/schedules with idempotent reminder creation and retries.
- Add backup/restore scripts for PostgreSQL and MinIO with retention configuration and documented restore drill.
- Complete README: overview, stack, modules, structure, requirements, install, database, seed, commands, test accounts, roles, Docker deployment, backup/restore and troubleshooting.
- Ensure all navigation entries resolve to functional pages with real data or accurate empty states; no placeholder controls.
- Add requested remaining seed counts for tickets and tasks.
- Test ticket transitions, overdue tasks, notification deduplication, report permissions/calculations, settings validation, redaction and worker idempotency.
- Run focused/full tests, TypeScript, ESLint, build and relevant Docker config validation; commit.

## Report

Write `.superpowers/sdd/task-5-report.md` with status, commits, delivered features, verification, self-review, and concerns.
