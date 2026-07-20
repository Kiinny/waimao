# Task 2: Sales CRM

Implement the sales CRM on top of the approved foundation.

## Requirements

- Follow existing module, API, UI, validation, audit, i18n, repository, service, and RBAC patterns.
- Use red-green TDD for each domain behavior before production code.
- Dashboard must use repository data and show role-scoped KPI cards, sales funnel, monthly order trend, lead-source distribution, upcoming follow-ups, recent leads/orders, and risk reminders.
- Leads: working paginated list, fuzzy search, country/source/status/owner/date filters, create/edit/detail, ownership checks, batch assignment/status actions, duplicate detection, follow-up creation, conversion to Customer and Opportunity in one transaction.
- Customers: list/create/edit/detail; status/level/risk; multiple contacts; owner scope; detail tabs for overview, contacts, follow-ups, opportunities, quotations, orders, payments, shipments, after-sales, files, activity. Tabs without later-domain records must show accurate empty states rather than fake data.
- Contacts: customer-scoped CRUD, one primary contact constraint, decision roles, language, timezone and communication fields.
- Follow-ups: CRUD with channel, outcome, next action/date, attachments metadata, related customer/contact/lead/opportunity, customer timeline insertion, and overdue reminder query.
- Opportunities: list and Kanban board, stage transitions with validation and audit, drag/drop UI, weighted forecast, won/lost handling and required loss reason.
- CSV import must parse, preview, validate and report row errors before commit; CSV export must honor current scope/filter. Excel may be implemented through the shared export service if foundation already supports it.
- Every primary button must work, every mutation must provide loading/success/failure feedback, dangerous batch actions require confirmation.
- Add realistic seed records or extend the deterministic seed to meet the requested counts: 20 customers, 30 contacts, 40 leads, 20 opportunities and follow-ups.
- Add unit/integration tests for ownership, duplicate detection, conversion transaction, primary contact constraint, overdue logic, stage transitions and forecast.
- Add Playwright coverage for representative login, lead creation/conversion, customer detail and opportunity stage movement where the environment supports it.
- Run focused tests, full unit tests, TypeScript, ESLint and build.
- Commit the task.

## Report

Write `.superpowers/sdd/task-2-report.md` with status, commits, delivered features, exact verification results, self-review, and concerns.
