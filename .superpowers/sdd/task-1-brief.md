# Task 1: Foundation platform

Build the foundation of the foreign-trade CRM in `C:\Users\Admin\Documents\外贸`.

## Requirements

- Preserve the generated Next.js App Router project and pnpm.
- Install only the dependencies needed by this task.
- Set up Vitest before production business utilities and follow red-green TDD.
- Create a complete Prisma schema covering identity/RBAC, CRM, products/quotes, sales orders/payments/refunds/costs, suppliers/purchasing, warehouses/inventory/quality, shipments, after-sales, tasks/notifications/files/currencies/exchange rates/audit/settings/sequences.
- Use UUID identifiers, timestamps, version fields, soft-delete fields where meaningful, fixed-point decimal money, indexes, and required relations.
- Add a deterministic seed with six predefined roles and permissions, nine users, the requested realistic business dataset counts, and a documented development password.
- Implement shared `ApiSuccess`, `ApiFailure`, `MoneySnapshot`, domain error and JSON response helpers.
- Implement tested money conversion and profit calculations using decimal-safe arithmetic.
- Implement tested RBAC checks including ownership scope and sensitive permissions `purchase.cost.read` and `finance.profit.read`.
- Implement authentication primitives with Argon2id password hashing, Auth.js credentials login, protected route handling, safe session cookies, login-attempt records, and inactive-user checks.
- Implement audit writing helper and use it for authentication and user/role mutations.
- Add English/Chinese dictionaries and locale-aware routes; English is default.
- Replace the starter page with a professional responsive CRM login and application shell: dark navy sidebar, blue accent, top search/actions/notifications/language/theme/profile controls, responsive navigation, loading/empty/error components.
- Add working dashboard landing data from a service/repository boundary, plus basic user and role management pages/API foundations. No fake action buttons.
- Add `.env.example`, Dockerfile, Docker Compose for web/worker/PostgreSQL 17/MinIO, health checks, and initial README setup instructions.
- Do not implement later domain CRUD screens beyond what is required to demonstrate the foundation.
- Run focused tests, full unit tests, TypeScript, ESLint, and production build.
- Commit the task to `codex/foreign-trade-crm`.

## Report

Write `.superpowers/sdd/task-1-report.md` with:

- status: `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, or `BLOCKED`
- commits
- files and features delivered
- exact test/check commands and results
- self-review findings and remaining concerns
