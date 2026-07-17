# Task 1 Report

## Status

`DONE_WITH_CONCERNS`

## Commits

- `f2786a4` — `feat: establish CRM foundation platform`

## Files and features delivered

- Preserved the generated Next.js App Router/pnpm scaffold and added only foundation dependencies: Prisma/PostgreSQL adapter, Auth.js, Argon2id, Decimal.js, Zod, Graphile Worker, Vitest, tsx and dotenv.
- Added Vitest configuration and 20 tests covering API envelopes/errors, decimal-safe currency conversion/profit, RBAC ownership and sensitive permissions, Argon2id, inactive-user checks, login attempts and authentication audit behavior.
- Added a validated Prisma schema and initial SQL migration covering identity/RBAC, CRM, products/configurations/quotes, sales orders/payments/refunds/costs, suppliers/purchasing, warehouses/inventory/quality, shipments, after-sales, tasks/notifications/files, currencies/exchange rates, audit, settings and sequences.
- Added a deterministic seed with 52 permissions, six system roles, nine named users, currencies, settings and sequences. The documented development password is `ChangeMe123!`.
- Added shared `ApiSuccess`, `ApiFailure`, `MoneySnapshot`, domain errors, safe JSON response helpers, Decimal.js money/profit calculations and ownership-aware RBAC. `purchase.cost.read` and `finance.profit.read` are explicit sensitive permissions.
- Added Prisma client/repository boundaries, an audit writer, Auth.js credentials configuration, HTTP-only/same-site/production-secure session cookies, protected route proxy, login-attempt persistence, inactive/locked user denial and authentication audit events.
- Added audited, server-RBAC-protected user and role list/create API foundations plus basic user/role management pages.
- Added English and Chinese dictionaries/routes with English as the root default, a working login action, responsive navy application shell, search/language/theme/notification/profile controls, dashboard repository/service boundary, database-backed dashboard metrics, and loading/empty/error components.
- Added `.env.example`, Dockerfile, Compose services for web/worker/PostgreSQL 17/MinIO, service health checks, Graphile Worker bootstrap, API health endpoint and initial README setup/development-account instructions.

## Exact checks and results

- `node node_modules\prisma\build\index.js validate`
  - Result: PASS — `The schema at prisma\schema.prisma is valid`.
- `pnpm test`
  - Result: PASS — 5 test files, 20 tests, 0 failures.
- `pnpm typecheck`
  - Result: PASS — `tsc --noEmit`, exit code 0.
- `pnpm lint`
  - Result: PASS — `eslint`, exit code 0 with no warnings/errors.
- `pnpm build`
  - Result: PASS — Next.js 16.2.10 production build compiled, typechecked and generated all 14 static/dynamic route entries.
- `git diff --cached --check`
  - Result: PASS before commit; no whitespace errors.
- `docker compose config --quiet`
  - Result: NOT RUN — Docker CLI is not installed in the execution environment.

The full final gate ran in one command with `DATABASE_URL` and `AUTH_SECRET` set to non-production verification values and exited with code 0:

```powershell
node node_modules\prisma\build\index.js validate
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Self-review findings and remaining concerns

- The exact large business-domain seed volumes are intentionally deferred to Tasks 2–5, whose briefs own the customer/contact/lead/opportunity/product/order/procurement/ticket/task counts. Task 1 provides deterministic identity and foundation seed data.
- Docker/Compose syntax and runtime startup could not be executed locally because Docker is unavailable; configuration should be checked in a Docker-enabled environment.
- User and role foundations currently expose list/create operations only. Later management work can add update/deactivation flows while reusing the transaction-scoped audit pattern.
- The generated Prisma client is intentionally ignored and must be produced with `pnpm prisma:generate` after install; the README and Docker build both do this.
- The task brief and progress ledger were not modified.

## Review fixes

### Status

`DONE_WITH_CONCERNS`

### Fixes delivered

- Replaced non-ASCII source literals in dictionaries and shell controls with stable Unicode escapes or ASCII, corrected the login/shell language switches, and localized dashboard, user and role headings/tables in English and Chinese.
- Replaced JWT permission trust with a live server authorization context. Every protected page and API request now reloads the user, rejects inactive/locked/soft-deleted users, excludes soft-deleted roles, and rebuilds current permissions. Role and permission claims are no longer copied into the JWT-backed session.
- Added exact role-permission validation. Duplicate and unknown codes now produce structured `VALIDATION_ERROR` responses rather than being silently deduplicated or ignored.
- Converted top search to a real accessible GET search flow over permission-visible customers, sales orders and quotations. The notification control now navigates to a labeled, focusable dashboard notification/risk section with live overdue-task data.
- Added tested quote-version immutability at the service and PATCH API boundary. Sent-or-later quote versions and versions with `immutableAt` reject mutation.
- Added a tested `100% T/T Before Purchase` payment/refund gate and POST transition API. Only super-admin wildcard access can supply a nonempty override reason; the transaction records the override actor, reason, time and immutable audit-log relation.
- Added a follow-up migration and schema relations for override actor/audit metadata. Quote items now use `ON DELETE RESTRICT` rather than destructive cascade from immutable quote versions.

### Red/green and final verification

- Focused review-fix tests:

  ```powershell
  pnpm test src/i18n/dictionaries.test.ts src/modules/auth/authorization-context.test.ts src/modules/roles/role-permissions.test.ts src/modules/quotes/quote-service.test.ts src/modules/orders/purchase-gate.test.ts
  ```

  Result: PASS — 5 test files, 23 tests, 0 failures.

- Full unit suite:

  ```powershell
  pnpm test
  ```

  Result: PASS — 10 test files, 43 tests, 0 failures.

- Prisma schema:

  ```powershell
  node node_modules\prisma\build\index.js validate
  ```

  Result: PASS — `The schema at prisma\schema.prisma is valid`.

- TypeScript:

  ```powershell
  pnpm typecheck
  ```

  Result: PASS — `tsc --noEmit`, exit code 0.

- ESLint:

  ```powershell
  pnpm lint
  ```

  Result: PASS — exit code 0 with no warnings/errors.

- Production build:

  ```powershell
  pnpm build
  ```

  Result: PASS — Next.js 16.2.10 compiled, typechecked and generated all 16 route entries, including search, quote-version update and purchase-transition boundaries.

### Remaining concern

- Docker/Compose execution remains unverified because the Docker CLI is unavailable in this environment.
