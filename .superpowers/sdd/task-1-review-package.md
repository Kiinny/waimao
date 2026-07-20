# Commit list
f2786a4 feat: establish CRM foundation platform
84156c5 docs: record task 1 verification

# Stat
 .dockerignore                                      |    8 +
 .env.example                                       |   10 +
 .gitignore                                         |   44 +
 .superpowers/sdd/task-1-report.md                  |   56 +
 Dockerfile                                         |   23 +
 README.md                                          |   86 +
 compose.yaml                                       |   82 +
 eslint.config.mjs                                  |   18 +
 next.config.ts                                     |    7 +
 package.json                                       |   47 +
 pnpm-lock.yaml                                     | 6164 ++++++++++++++++++++
 pnpm-workspace.yaml                                |    7 +
 postcss.config.mjs                                 |    7 +
 prisma.config.ts                                   |   14 +
 .../20260717173000_initial/migration.sql           | 1158 ++++
 prisma/migrations/migration_lock.toml              |    2 +
 prisma/schema.prisma                               |  910 +++
 prisma/seed.ts                                     |  295 +
 public/file.svg                                    |    1 +
 public/globe.svg                                   |    1 +
 public/next.svg                                    |    1 +
 public/vercel.svg                                  |    1 +
 public/window.svg                                  |    1 +
 src/app/[locale]/(app)/dashboard/page.tsx          |   80 +
 src/app/[locale]/(app)/error.tsx                   |   20 +
 src/app/[locale]/(app)/layout.tsx                  |   24 +
 src/app/[locale]/(app)/loading.tsx                 |   10 +
 src/app/[locale]/(app)/roles/page.tsx              |   64 +
 src/app/[locale]/(app)/users/page.tsx              |   74 +
 src/app/[locale]/(auth)/login/actions.ts           |   21 +
 src/app/[locale]/(auth)/login/page.tsx             |   79 +
 src/app/[locale]/layout.tsx                        |   19 +
 src/app/api/auth/[...nextauth]/route.ts            |    3 +
 src/app/api/health/route.ts                        |   19 +
 src/app/api/roles/route.ts                         |   72 +
 src/app/api/users/route.ts                         |   71 +
 src/app/favicon.ico                                |  Bin 0 -> 25931 bytes
 src/app/globals.css                                |  489 ++
 src/app/layout.tsx                                 |   22 +
 src/app/page.tsx                                   |    5 +
 src/auth.ts                                        |   67 +
 src/components/app-shell.tsx                       |   92 +
 src/components/empty-state.tsx                     |   17 +
 src/components/theme-toggle.tsx                    |   30 +
 src/i18n/dictionaries.ts                           |   82 +
 src/lib/api.test.ts                                |   60 +
 src/lib/audit.ts                                   |   22 +
 src/lib/contracts.ts                               |   21 +
 src/lib/current-user.ts                            |   15 +
 src/lib/errors.ts                                  |   21 +
 src/lib/http.ts                                    |   55 +
 src/lib/money.test.ts                              |   41 +
 src/lib/money.ts                                   |   49 +
 src/lib/password.test.ts                           |   12 +
 src/lib/password.ts                                |   16 +
 src/lib/prisma.ts                                  |   23 +
 src/lib/rbac.test.ts                               |   49 +
 src/lib/rbac.ts                                    |   49 +
 src/modules/auth/authenticate.test.ts              |  103 +
 src/modules/auth/authenticate.ts                   |   86 +
 src/modules/auth/prisma-auth-repository.ts         |   69 +
 src/modules/dashboard/dashboard-service.ts         |   23 +
 .../dashboard/prisma-dashboard-repository.ts       |   56 +
 src/proxy.ts                                       |   19 +
 src/types/next-auth.d.ts                           |   19 +
 src/worker.ts                                      |   19 +
 tsconfig.json                                      |   34 +
 vitest.config.ts                                   |   17 +
 68 files changed, 11181 insertions(+)

# Full diff
diff --git a/.dockerignore b/.dockerignore
new file mode 100644
index 0000000..6213d01
--- /dev/null
+++ b/.dockerignore
@@ -0,0 +1,8 @@
+node_modules
+.next
+.pnpm-store
+.git
+.env
+coverage
+npm-debug.log*
+pnpm-debug.log*
diff --git a/.env.example b/.env.example
new file mode 100644
index 0000000..379ef3d
--- /dev/null
+++ b/.env.example
@@ -0,0 +1,10 @@
+DATABASE_URL=postgresql://crm:crm_dev_password@localhost:5432/foreign_trade_crm?schema=public
+AUTH_SECRET=replace-with-at-least-32-random-bytes
+AUTH_URL=http://localhost:3000
+MINIO_ENDPOINT=localhost
+MINIO_PORT=9000
+MINIO_ACCESS_KEY=atlas_minio
+MINIO_SECRET_KEY=replace-this-minio-secret
+MINIO_BUCKET=atlas-crm
+MINIO_USE_SSL=false
+WORKER_CONCURRENCY=2
diff --git a/.gitignore b/.gitignore
new file mode 100644
index 0000000..daa2a3e
--- /dev/null
+++ b/.gitignore
@@ -0,0 +1,44 @@
+# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.
+
+# dependencies
+/node_modules
+/.pnpm-store
+/.pnp
+.pnp.*
+.yarn/*
+!.yarn/patches
+!.yarn/plugins
+!.yarn/releases
+!.yarn/versions
+
+# testing
+/coverage
+/src/generated/prisma
+
+# next.js
+/.next/
+/out/
+
+# production
+/build
+
+# misc
+.DS_Store
+*.pem
+
+# debug
+npm-debug.log*
+yarn-debug.log*
+yarn-error.log*
+.pnpm-debug.log*
+
+# env files (can opt-in for committing if needed)
+.env*
+!.env.example
+
+# vercel
+.vercel
+
+# typescript
+*.tsbuildinfo
+next-env.d.ts
diff --git a/.superpowers/sdd/task-1-report.md b/.superpowers/sdd/task-1-report.md
new file mode 100644
index 0000000..ae6a534
--- /dev/null
+++ b/.superpowers/sdd/task-1-report.md
@@ -0,0 +1,56 @@
+# Task 1 Report
+
+## Status
+
+`DONE_WITH_CONCERNS`
+
+## Commits
+
+- `f2786a4` — `feat: establish CRM foundation platform`
+
+## Files and features delivered
+
+- Preserved the generated Next.js App Router/pnpm scaffold and added only foundation dependencies: Prisma/PostgreSQL adapter, Auth.js, Argon2id, Decimal.js, Zod, Graphile Worker, Vitest, tsx and dotenv.
+- Added Vitest configuration and 20 tests covering API envelopes/errors, decimal-safe currency conversion/profit, RBAC ownership and sensitive permissions, Argon2id, inactive-user checks, login attempts and authentication audit behavior.
+- Added a validated Prisma schema and initial SQL migration covering identity/RBAC, CRM, products/configurations/quotes, sales orders/payments/refunds/costs, suppliers/purchasing, warehouses/inventory/quality, shipments, after-sales, tasks/notifications/files, currencies/exchange rates, audit, settings and sequences.
+- Added a deterministic seed with 52 permissions, six system roles, nine named users, currencies, settings and sequences. The documented development password is `ChangeMe123!`.
+- Added shared `ApiSuccess`, `ApiFailure`, `MoneySnapshot`, domain errors, safe JSON response helpers, Decimal.js money/profit calculations and ownership-aware RBAC. `purchase.cost.read` and `finance.profit.read` are explicit sensitive permissions.
+- Added Prisma client/repository boundaries, an audit writer, Auth.js credentials configuration, HTTP-only/same-site/production-secure session cookies, protected route proxy, login-attempt persistence, inactive/locked user denial and authentication audit events.
+- Added audited, server-RBAC-protected user and role list/create API foundations plus basic user/role management pages.
+- Added English and Chinese dictionaries/routes with English as the root default, a working login action, responsive navy application shell, search/language/theme/notification/profile controls, dashboard repository/service boundary, database-backed dashboard metrics, and loading/empty/error components.
+- Added `.env.example`, Dockerfile, Compose services for web/worker/PostgreSQL 17/MinIO, service health checks, Graphile Worker bootstrap, API health endpoint and initial README setup/development-account instructions.
+
+## Exact checks and results
+
+- `node node_modules\prisma\build\index.js validate`
+  - Result: PASS — `The schema at prisma\schema.prisma is valid`.
+- `pnpm test`
+  - Result: PASS — 5 test files, 20 tests, 0 failures.
+- `pnpm typecheck`
+  - Result: PASS — `tsc --noEmit`, exit code 0.
+- `pnpm lint`
+  - Result: PASS — `eslint`, exit code 0 with no warnings/errors.
+- `pnpm build`
+  - Result: PASS — Next.js 16.2.10 production build compiled, typechecked and generated all 14 static/dynamic route entries.
+- `git diff --cached --check`
+  - Result: PASS before commit; no whitespace errors.
+- `docker compose config --quiet`
+  - Result: NOT RUN — Docker CLI is not installed in the execution environment.
+
+The full final gate ran in one command with `DATABASE_URL` and `AUTH_SECRET` set to non-production verification values and exited with code 0:
+
+```powershell
+node node_modules\prisma\build\index.js validate
+pnpm test
+pnpm typecheck
+pnpm lint
+pnpm build
+```
+
+## Self-review findings and remaining concerns
+
+- The exact large business-domain seed volumes are intentionally deferred to Tasks 2–5, whose briefs own the customer/contact/lead/opportunity/product/order/procurement/ticket/task counts. Task 1 provides deterministic identity and foundation seed data.
+- Docker/Compose syntax and runtime startup could not be executed locally because Docker is unavailable; configuration should be checked in a Docker-enabled environment.
+- User and role foundations currently expose list/create operations only. Later management work can add update/deactivation flows while reusing the transaction-scoped audit pattern.
+- The generated Prisma client is intentionally ignored and must be produced with `pnpm prisma:generate` after install; the README and Docker build both do this.
+- The task brief and progress ledger were not modified.
diff --git a/Dockerfile b/Dockerfile
new file mode 100644
index 0000000..082dd3d
--- /dev/null
+++ b/Dockerfile
@@ -0,0 +1,23 @@
+FROM node:24-bookworm-slim AS base
+ENV PNPM_HOME="/pnpm"
+ENV PATH="$PNPM_HOME:$PATH"
+RUN corepack enable
+WORKDIR /app
+
+FROM base AS dependencies
+COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
+RUN pnpm install --frozen-lockfile
+
+FROM dependencies AS build
+COPY . .
+ENV NEXT_TELEMETRY_DISABLED=1
+ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
+ENV DATABASE_URL=$DATABASE_URL
+RUN pnpm prisma:generate && pnpm build
+
+FROM base AS runtime
+ENV NODE_ENV=production
+ENV NEXT_TELEMETRY_DISABLED=1
+COPY --from=build /app ./
+EXPOSE 3000
+CMD ["pnpm", "start"]
diff --git a/README.md b/README.md
new file mode 100644
index 0000000..b773073
--- /dev/null
+++ b/README.md
@@ -0,0 +1,86 @@
+# Atlas Foreign-Trade CRM
+
+Atlas CRM is a bilingual, role-aware operating system for international server and hardware trade. The foundation combines customer and transaction data, secure authentication, auditability, exact money calculations, and an operational shell ready for the later sales, procurement, fulfillment, and reporting modules.
+
+## Foundation stack
+
+- Node.js 24, pnpm, Next.js App Router, React and TypeScript
+- PostgreSQL 17 with Prisma and fixed-point decimal money
+- Auth.js credentials sessions with Argon2id password hashing
+- Graphile Worker for PostgreSQL-backed background jobs
+- MinIO-compatible object storage
+- Vitest, ESLint and strict TypeScript
+
+## Local setup
+
+1. Install Node.js 24 and enable pnpm through Corepack.
+2. Copy `.env.example` to `.env` and replace `AUTH_SECRET` and storage secrets.
+3. Start PostgreSQL 17 and MinIO, or run `docker compose up postgres minio -d`.
+4. Install and initialize:
+
+   ```bash
+   pnpm install
+   pnpm prisma:generate
+   pnpm prisma:migrate
+   pnpm prisma:seed
+   ```
+
+5. Start the web and worker processes in separate terminals:
+
+   ```bash
+   pnpm dev
+   pnpm worker
+   ```
+
+Open [http://localhost:3000](http://localhost:3000). English routes are the default (`/en`); Chinese routes use `/zh`.
+
+## Development accounts
+
+The deterministic seed creates nine users across six roles. The shared development-only password is:
+
+```text
+ChangeMe123!
+```
+
+| Role | Account |
+| --- | --- |
+| Super Admin | `admin@atlascrm.dev` |
+| Sales Manager | `sales.manager@atlascrm.dev` |
+| Sales Representative | `sales.asia@atlascrm.dev`, `sales.emea@atlascrm.dev` |
+| Finance | `finance@atlascrm.dev` |
+| Procurement | `procurement@atlascrm.dev` |
+| Operations | `warehouse@atlascrm.dev`, `logistics@atlascrm.dev`, `support@atlascrm.dev` |
+
+Never reuse the development password in a shared or production environment.
+
+## Commands
+
+```bash
+pnpm test              # full Vitest suite
+pnpm typecheck         # strict TypeScript
+pnpm lint              # ESLint
+pnpm build             # production Next.js build
+pnpm prisma:generate   # generate the typed client
+pnpm prisma:migrate    # create/apply development migrations
+pnpm prisma:seed       # deterministic roles, users and foundation data
+```
+
+## Docker
+
+`docker compose up --build` starts:
+
+- `web` on port 3000 with an API/database health check
+- `worker` for Graphile Worker jobs
+- `postgres` 17 with durable storage and `pg_isready`
+- `minio` on ports 9000/9001 with durable storage and health checks
+
+Set `POSTGRES_PASSWORD`, `AUTH_SECRET`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY` outside development.
+
+## Security and architecture notes
+
+- Session cookies are HTTP-only, same-site, secure in production, and limited to eight hours.
+- Inactive and locked users cannot authenticate. Every attempt is recorded; successful and failed authentication is audited.
+- User and role mutation API foundations enforce server-side RBAC and write audit events in the same transaction.
+- Sales ownership scope is enforced separately from permission presence. Purchase-cost and profit access are explicit sensitive permissions.
+- Currency amounts, exchange-rate snapshots and profit calculations use decimal-safe fixed-point values.
+- Important business records use optimistic versions and soft-delete/cancellation fields where meaningful.
diff --git a/compose.yaml b/compose.yaml
new file mode 100644
index 0000000..f7f6f2a
--- /dev/null
+++ b/compose.yaml
@@ -0,0 +1,82 @@
+name: atlas-crm
+
+services:
+  postgres:
+    image: postgres:17-bookworm
+    environment:
+      POSTGRES_DB: foreign_trade_crm
+      POSTGRES_USER: crm
+      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-crm_dev_password}
+    volumes:
+      - postgres-data:/var/lib/postgresql/data
+    healthcheck:
+      test: ["CMD-SHELL", "pg_isready -U crm -d foreign_trade_crm"]
+      interval: 5s
+      timeout: 5s
+      retries: 10
+    restart: unless-stopped
+
+  minio:
+    image: minio/minio:RELEASE.2025-04-22T22-12-26Z
+    command: server /data --console-address ":9001"
+    environment:
+      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-atlas_minio}
+      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-replace-this-minio-secret}
+    ports:
+      - "9000:9000"
+      - "9001:9001"
+    volumes:
+      - minio-data:/data
+    healthcheck:
+      test: ["CMD", "mc", "ready", "local"]
+      interval: 10s
+      timeout: 5s
+      retries: 10
+    restart: unless-stopped
+
+  web:
+    build: .
+    environment:
+      DATABASE_URL: postgresql://crm:${POSTGRES_PASSWORD:-crm_dev_password}@postgres:5432/foreign_trade_crm?schema=public
+      AUTH_SECRET: ${AUTH_SECRET:-development-only-change-this-secret}
+      AUTH_URL: http://localhost:3000
+      MINIO_ENDPOINT: minio
+      MINIO_PORT: 9000
+      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY:-atlas_minio}
+      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY:-replace-this-minio-secret}
+      MINIO_BUCKET: atlas-crm
+      MINIO_USE_SSL: "false"
+    ports:
+      - "3000:3000"
+    depends_on:
+      postgres:
+        condition: service_healthy
+      minio:
+        condition: service_healthy
+    healthcheck:
+      test:
+        [
+          "CMD",
+          "node",
+          "-e",
+          "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)})",
+        ]
+      interval: 15s
+      timeout: 5s
+      retries: 10
+    restart: unless-stopped
+
+  worker:
+    build: .
+    command: ["pnpm", "worker"]
+    environment:
+      DATABASE_URL: postgresql://crm:${POSTGRES_PASSWORD:-crm_dev_password}@postgres:5432/foreign_trade_crm?schema=public
+      WORKER_CONCURRENCY: 2
+    depends_on:
+      postgres:
+        condition: service_healthy
+    restart: unless-stopped
+
+volumes:
+  postgres-data:
+  minio-data:
diff --git a/eslint.config.mjs b/eslint.config.mjs
new file mode 100644
index 0000000..05e726d
--- /dev/null
+++ b/eslint.config.mjs
@@ -0,0 +1,18 @@
+import { defineConfig, globalIgnores } from "eslint/config";
+import nextVitals from "eslint-config-next/core-web-vitals";
+import nextTs from "eslint-config-next/typescript";
+
+const eslintConfig = defineConfig([
+  ...nextVitals,
+  ...nextTs,
+  // Override default ignores of eslint-config-next.
+  globalIgnores([
+    // Default ignores of eslint-config-next:
+    ".next/**",
+    "out/**",
+    "build/**",
+    "next-env.d.ts",
+  ]),
+]);
+
+export default eslintConfig;
diff --git a/next.config.ts b/next.config.ts
new file mode 100644
index 0000000..e9ffa30
--- /dev/null
+++ b/next.config.ts
@@ -0,0 +1,7 @@
+import type { NextConfig } from "next";
+
+const nextConfig: NextConfig = {
+  /* config options here */
+};
+
+export default nextConfig;
diff --git a/package.json b/package.json
new file mode 100644
index 0000000..9c4b363
--- /dev/null
+++ b/package.json
@@ -0,0 +1,47 @@
+{
+  "name": "foreign-trade-crm",
+  "version": "0.1.0",
+  "private": true,
+  "packageManager": "pnpm@11.9.0",
+  "scripts": {
+    "dev": "next dev",
+    "build": "next build",
+    "start": "next start",
+    "worker": "tsx src/worker.ts",
+    "lint": "eslint",
+    "typecheck": "tsc --noEmit",
+    "test": "vitest run",
+    "test:watch": "vitest",
+    "prisma:generate": "prisma generate",
+    "prisma:migrate": "prisma migrate dev",
+    "prisma:seed": "prisma db seed"
+  },
+  "dependencies": {
+    "@prisma/adapter-pg": "^7.8.0",
+    "@prisma/client": "^7.8.0",
+    "argon2": "^0.44.0",
+    "decimal.js": "^10.6.0",
+    "graphile-worker": "^0.17.3",
+    "next": "16.2.10",
+    "next-auth": "5.0.0-beta.31",
+    "pg": "^8.22.0",
+    "react": "19.2.4",
+    "react-dom": "19.2.4",
+    "zod": "^4.4.3"
+  },
+  "devDependencies": {
+    "@tailwindcss/postcss": "^4",
+    "@types/node": "^20",
+    "@types/pg": "^8.20.0",
+    "@types/react": "^19",
+    "@types/react-dom": "^19",
+    "dotenv": "^17.4.2",
+    "eslint": "^9",
+    "eslint-config-next": "16.2.10",
+    "prisma": "^7.8.0",
+    "tailwindcss": "^4",
+    "tsx": "^4.23.1",
+    "typescript": "^5",
+    "vitest": "^4.1.10"
+  }
+}
diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
new file mode 100644
index 0000000..b9675de
--- /dev/null
+++ b/pnpm-lock.yaml
@@ -0,0 +1,6164 @@
+lockfileVersion: '9.0'
+
+settings:
+  autoInstallPeers: true
+  excludeLinksFromLockfile: false
+
+importers:
+
+  .:
+    dependencies:
+      '@prisma/adapter-pg':
+        specifier: ^7.8.0
+        version: 7.8.0
+      '@prisma/client':
+        specifier: ^7.8.0
+        version: 7.8.0(prisma@7.8.0(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)(typescript@5.9.3))(typescript@5.9.3)
+      argon2:
+        specifier: ^0.44.0
+        version: 0.44.0
+      decimal.js:
+        specifier: ^10.6.0
+        version: 10.6.0
+      graphile-worker:
+        specifier: ^0.17.3
+        version: 0.17.3(typescript@5.9.3)
+      next:
+        specifier: 16.2.10
+        version: 16.2.10(@babel/core@7.29.7)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)
+      next-auth:
+        specifier: 5.0.0-beta.31
+        version: 5.0.0-beta.31(next@16.2.10(@babel/core@7.29.7)(react-dom@19.2.4(react@19.2.4))(react@19.2.4))(react@19.2.4)
+      pg:
+        specifier: ^8.22.0
+        version: 8.22.0
+      react:
+        specifier: 19.2.4
+        version: 19.2.4
+      react-dom:
+        specifier: 19.2.4
+        version: 19.2.4(react@19.2.4)
+      zod:
+        specifier: ^4.4.3
+        version: 4.4.3
+    devDependencies:
+      '@tailwindcss/postcss':
+        specifier: ^4
+        version: 4.3.2
+      '@types/node':
+        specifier: ^20
+        version: 20.19.43
+      '@types/pg':
+        specifier: ^8.20.0
+        version: 8.20.0
+      '@types/react':
+        specifier: ^19
+        version: 19.2.17
+      '@types/react-dom':
+        specifier: ^19
+        version: 19.2.3(@types/react@19.2.17)
+      dotenv:
+        specifier: ^17.4.2
+        version: 17.4.2
+      eslint:
+        specifier: ^9
+        version: 9.39.5(jiti@2.7.0)
+      eslint-config-next:
+        specifier: 16.2.10
+        version: 16.2.10(@typescript-eslint/parser@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3))(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+      prisma:
+        specifier: ^7.8.0
+        version: 7.8.0(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)(typescript@5.9.3)
+      tailwindcss:
+        specifier: ^4
+        version: 4.3.2
+      tsx:
+        specifier: ^4.23.1
+        version: 4.23.1
+      typescript:
+        specifier: ^5
+        version: 5.9.3
+      vitest:
+        specifier: ^4.1.10
+        version: 4.1.10(@types/node@20.19.43)(vite@8.1.5(@types/node@20.19.43)(esbuild@0.28.1)(jiti@2.7.0)(tsx@4.23.1))
+
+packages:
+
+  '@alloc/quick-lru@5.2.0':
+    resolution: {integrity: sha512-UrcABB+4bUrFABwbluTIBErXwvbsU/V7TZWfmbgJfbkwiBuziS9gxdODUyuiecfdGQ85jglMW6juS3+z5TsKLw==}
+    engines: {node: '>=10'}
+
+  '@auth/core@0.41.2':
+    resolution: {integrity: sha512-Hx5MNBxN2fJTbJKGUKAA0wca43D0Akl3TvufY54Gn8lop7F+34vU1zA1pn0vQfIoVuLIrpfc2nkyjwIaPJMW7w==}
+    peerDependencies:
+      '@simplewebauthn/browser': ^9.0.1
+      '@simplewebauthn/server': ^9.0.2
+      nodemailer: ^7.0.7
+    peerDependenciesMeta:
+      '@simplewebauthn/browser':
+        optional: true
+      '@simplewebauthn/server':
+        optional: true
+      nodemailer:
+        optional: true
+
+  '@babel/code-frame@7.29.7':
+    resolution: {integrity: sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/compat-data@7.29.7':
+    resolution: {integrity: sha512-locTkQyKvwIEgBzVrn8693ebc97F2U8ZHjbXwDXJ5Fn2TCpNwTlKcaKLkdHop5c/icOFE7qt7Q9JC5hnKNa6Gg==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/core@7.29.7':
+    resolution: {integrity: sha512-RgHBCvtjbOK2gXSNBNIkNoEc9qoVEtau3hj8gEqKQuL3HZAibKarWFEI3Lfm6EYKkLalOh8eSrj9b+ch9H/VBA==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/generator@7.29.7':
+    resolution: {integrity: sha512-DkXD5OJQaAQIdZ1bt3UZdEnHAn9Imd3IVBdX03UFe+ony9Ojw5pzr9YVKGDY1jt+Gcn/FnGkNf8r+Vj5NOJWtQ==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-compilation-targets@7.29.7':
+    resolution: {integrity: sha512-wem6WaBj4NaVYVdNhLPPVacES6ZJ+KBBfSkTMD3YZxbP3rm3Di85tJU5ljaUNhaOynt+Aj0xruhYuzQBt8n71g==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-globals@7.29.7':
+    resolution: {integrity: sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-module-imports@7.29.7':
+    resolution: {integrity: sha512-ejHwrQQYcm9xnTivShn2IDOlIzInN34AXskvq9QicvCtEzq1Vzclu/tKF8Jq1Cg8JG2GL6/EmjgsCT7lXepE3g==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-module-transforms@7.29.7':
+    resolution: {integrity: sha512-UPUVSyXbOh627KiCIGQSgwWzGeBKLkaJ9PJEdrngIwMSzxLR4jS4+f1f1jb7VzBbg8nFLaYotvVPFCTqdrmTAg==}
+    engines: {node: '>=6.9.0'}
+    peerDependencies:
+      '@babel/core': ^7.0.0
+
+  '@babel/helper-string-parser@7.29.7':
+    resolution: {integrity: sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-validator-identifier@7.29.7':
+    resolution: {integrity: sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helper-validator-option@7.29.7':
+    resolution: {integrity: sha512-N9ZErrD+yW5geCDtBqnOoxmR8+tNKiGuxKlDpuJxfsqpa2dFcexaziGAE/qoHLiDDreVNMupxGmSoNlyvsA3gw==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/helpers@7.29.7':
+    resolution: {integrity: sha512-1k2lAGRMfHTcwuNYcCNUmaUffmQv8KWMfh2iJUUeRlwlwH4FdNG7mfPI10NPfLHJFThE4Tyr4mv7kTNZOiPuBg==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/parser@7.29.7':
+    resolution: {integrity: sha512-hnORnjP/1P/zFEndoeX+n+t1RwWRJiJpM/jO7FW32Kn9r5+sJB2JWOdYo4L6k78j15eCwY3Gm/7364B1EMwtNg==}
+    engines: {node: '>=6.0.0'}
+    hasBin: true
+
+  '@babel/template@7.29.7':
+    resolution: {integrity: sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/traverse@7.29.7':
+    resolution: {integrity: sha512-EhlfNQtZ+NK22w5BM61ciuiq1m58ed33Wr1Xan//ZRTy6hgjnwyCffRYwzsGXdASJSUJ1guZILsErh1eQcl+zw==}
+    engines: {node: '>=6.9.0'}
+
+  '@babel/types@7.29.7':
+    resolution: {integrity: sha512-4zBIxpPzowiZpusoFkyGVwakdRJUyuH5PxQ/PrqghfdFWWasvnCdPfQXHrenDai+gyLARulZjZowCOj6fjT4pA==}
+    engines: {node: '>=6.9.0'}
+
+  '@electric-sql/pglite-socket@0.1.1':
+    resolution: {integrity: sha512-p2hoXw3Z3LQHwTeikdZNsFBOvXGqKY2hk51BBw+8NKND8eoH+8LFOtW9Z8CQKmTJ2qqGYu82ipqiyFZOTTXNfw==}
+    hasBin: true
+    peerDependencies:
+      '@electric-sql/pglite': 0.4.1
+
+  '@electric-sql/pglite-tools@0.3.1':
+    resolution: {integrity: sha512-C+T3oivmy9bpQvSxVqXA1UDY8cB9Eb9vZHL9zxWwEUfDixbXv4G3r2LjoTdR33LD8aomR3O9ZXEO3XEwr/cUCA==}
+    peerDependencies:
+      '@electric-sql/pglite': 0.4.1
+
+  '@electric-sql/pglite@0.4.1':
+    resolution: {integrity: sha512-mZ9NzzUSYPOCnxHH1oAHPRzoMFJHY472raDKwXl/+6oPbpdJ7g8LsCN4FSaIIfkiCKHhb3iF/Zqo3NYxaIhU7Q==}
+
+  '@emnapi/core@1.10.0':
+    resolution: {integrity: sha512-yq6OkJ4p82CAfPl0u9mQebQHKPJkY7WrIuk205cTYnYe+k2Z8YBh11FrbRG/H6ihirqcacOgl2BIO8oyMQLeXw==}
+
+  '@emnapi/core@1.11.1':
+    resolution: {integrity: sha512-RSvbQmHzdKzNsLYa/wHrbc3KN4sYLKAdPZxqiM2HATqv/SBk2/ENSHpvXGaLOMcsAyz0poEGqkmmKYG3OWiJEQ==}
+
+  '@emnapi/runtime@1.10.0':
+    resolution: {integrity: sha512-ewvYlk86xUoGI0zQRNq/mC+16R1QeDlKQy21Ki3oSYXNgLb45GV1P6A0M+/s6nyCuNDqe5VpaY84BzXGwVbwFA==}
+
+  '@emnapi/runtime@1.11.1':
+    resolution: {integrity: sha512-vgj7R3y3Wgx24IQaGPA/R6YFXLHVMOZ0uVEyIQPaWs+rd1AzfEMXlAC22FYwO1XkKR6NPsq7mUandH8oIRdZFw==}
+
+  '@emnapi/runtime@1.11.2':
+    resolution: {integrity: sha512-kyOl3X0DuTiT1h2ft8r2fYO8JYtU9a9Xis/zBSiGArNaagCOWx90N1k2wxp18czFDH+OgcWGb5ZP/XMt3dcyPA==}
+
+  '@emnapi/wasi-threads@1.2.1':
+    resolution: {integrity: sha512-uTII7OYF+/Mes/MrcIOYp5yOtSMLBWSIoLPpcgwipoiKbli6k322tcoFsxoIIxPDqW01SQGAgko4EzZi2BNv2w==}
+
+  '@emnapi/wasi-threads@1.2.2':
+    resolution: {integrity: sha512-c95qOXkHdydNKhscBTebqEC1CVAZpyqOfVfBzQ1qgzyl3gfeldUjIggDbIZgDKsHLgnsM+igH7TJ/eAasaVuMA==}
+
+  '@epic-web/invariant@1.0.0':
+    resolution: {integrity: sha512-lrTPqgvfFQtR/eY/qkIzp98OGdNJu0m5ji3q/nJI8v3SXkRKEnWiOxMmbvcSoAIzv/cGiuvRy57k4suKQSAdwA==}
+
+  '@esbuild/aix-ppc64@0.28.1':
+    resolution: {integrity: sha512-Svl7tq8k/08+p6CXPpRjQ1fKX+1odH/BQbb48fV6fj3CWHhsoIOoY87w1oHXm0qEpkIK3ZfVgp0hed3XBXzXMQ==}
+    engines: {node: '>=18'}
+    cpu: [ppc64]
+    os: [aix]
+
+  '@esbuild/android-arm64@0.28.1':
+    resolution: {integrity: sha512-34EGEbCIAgosYz6goLcopX6Mo7NyGv9tfwEM2/7Ce2VcVRk568iSvniGWcUXIy7wEDR1wzolcxcriFVrWYcwBg==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [android]
+
+  '@esbuild/android-arm@0.28.1':
+    resolution: {integrity: sha512-0k2F129Xdio1TdJfzJ8sy1Q47vUD2NnwdhiAf7drUN1EBTfPf4hsFCtmMgu/6m8JSzsBrlmVjudMBQqOfG8usQ==}
+    engines: {node: '>=18'}
+    cpu: [arm]
+    os: [android]
+
+  '@esbuild/android-x64@0.28.1':
+    resolution: {integrity: sha512-dbwY7ltSMDWsRatcRpCnES4F+im88OCUgGZjy52shC7GqHRE/cYlxNbB4Z4UpJswpcc4Qxd2oE/ufM0p61IKng==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [android]
+
+  '@esbuild/darwin-arm64@0.28.1':
+    resolution: {integrity: sha512-TZbWkQY7kvTAXbXUT7uVACR5cMHsDiSz9z7ZKAX/RTq/WJEk3QyRr0wZpNhBDX+/0CtdqUIJlOiodQcta6tY3Q==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [darwin]
+
+  '@esbuild/darwin-x64@0.28.1':
+    resolution: {integrity: sha512-zfdzgK9ACBNZLI/CyHTOx81SyNbM6YXn7rxSgX97VjyiPl9W1i4Ka4fgKECEoFCKGpvBj5qArWIGgQjOwkgskQ==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [darwin]
+
+  '@esbuild/freebsd-arm64@0.28.1':
+    resolution: {integrity: sha512-wG2EA8ENdEI0qhkSZMjfqrdY+ziCYCPMmtZjjIwOmXFjmyzEHn+UUxk5of+SYsjtfs3VpnlC7QLzSI5hY/rOAw==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [freebsd]
+
+  '@esbuild/freebsd-x64@0.28.1':
+    resolution: {integrity: sha512-i7dZ9vQgnvSCzi/rYCXNgtF/U+eKZNJBzu3eTQbRgHnM7tNSizLOkRFAl3qzVc/Op/u5YkHHa4pf/3DOYHthLQ==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [freebsd]
+
+  '@esbuild/linux-arm64@0.28.1':
+    resolution: {integrity: sha512-yHs+0uc8+nvEAfAfxrWQKK5peSNzBc4PegcMO0EJ2hT71uA7vB8Ihg2e77R2P7SG5uYjPbHlLLmve4LLLRCf0g==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [linux]
+
+  '@esbuild/linux-arm@0.28.1':
+    resolution: {integrity: sha512-qVXBOHQS+d5Y722GwJzJUtOLlX7km3CraOaGormF1pDtPd2C/l1SHRPgjLunLGe51Sh5YYWKMFDyV4SxgMQYTQ==}
+    engines: {node: '>=18'}
+    cpu: [arm]
+    os: [linux]
+
+  '@esbuild/linux-ia32@0.28.1':
+    resolution: {integrity: sha512-d1z4ZuP0ajrfz/FhGT4vv278rX8KnPPJx8i5+AtK7TYbx9Le9F1hyzurZpkEyjkGa9dUGhQow4C1NmeGvqxN2w==}
+    engines: {node: '>=18'}
+    cpu: [ia32]
+    os: [linux]
+
+  '@esbuild/linux-loong64@0.28.1':
+    resolution: {integrity: sha512-M5sRjUVZrkm1OAPR3dlOYzNmN+loZKGVi1VUQGrwuqLcbR6qeAz+famMhjASeH3YVKvZz+zT1jlh/keC3Rj/lg==}
+    engines: {node: '>=18'}
+    cpu: [loong64]
+    os: [linux]
+
+  '@esbuild/linux-mips64el@0.28.1':
+    resolution: {integrity: sha512-mRObBZeHh2OxcBFPWE/FjylkRgZdYuiTR3vaTozquCGOH14iP9oN4x4Ge81CoIDYQrXmIxpFumJBu5MtZpnQJQ==}
+    engines: {node: '>=18'}
+    cpu: [mips64el]
+    os: [linux]
+
+  '@esbuild/linux-ppc64@0.28.1':
+    resolution: {integrity: sha512-slScBsMAb3GFDcdrCgLwZtPYRoH2H/youv10QiZyRjmsP48fznoveWytSgCI/R0ZcUgpc0ZhIUEx6LHts8yrfQ==}
+    engines: {node: '>=18'}
+    cpu: [ppc64]
+    os: [linux]
+
+  '@esbuild/linux-riscv64@0.28.1':
+    resolution: {integrity: sha512-kw0owk1o0GFETUJyW0jc0G4Yzs0BHZn0JDZ8JRT088vjJYX777BAs1fDGxAC+q831qOs2DTC96mNsG2opdfyyQ==}
+    engines: {node: '>=18'}
+    cpu: [riscv64]
+    os: [linux]
+
+  '@esbuild/linux-s390x@0.28.1':
+    resolution: {integrity: sha512-/lAIjX8aYFRByhh6L5rYtPEDRqa9de/4V/juOXcta5frjvzXO4/sqEtyytse0g3zZFuWu5cDN0MkLz2qRDD2Ag==}
+    engines: {node: '>=18'}
+    cpu: [s390x]
+    os: [linux]
+
+  '@esbuild/linux-x64@0.28.1':
+    resolution: {integrity: sha512-u/anNYF2mmVOEDwLtnQ1wOr3EZ9sTNGLWrsYGYwHWzGA3Si84IOkHXlbWTD1NB+9/1lcnweYKO54uhxZydNzfA==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [linux]
+
+  '@esbuild/netbsd-arm64@0.28.1':
+    resolution: {integrity: sha512-oks0DYbLwWMmaakTsCb+zL4E+aHRVLom9IJZOAthMQEPiQmydXHkziYEsGYRx0uNV/IjEKGAV941JzH02pflqw==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [netbsd]
+
+  '@esbuild/netbsd-x64@0.28.1':
+    resolution: {integrity: sha512-aeL6lAnN89Hz43Mlh1G8ARasbuoYvSITDEx0tHh5b7jJnHcssqgjy9Yx430GDpmCa6OyrKoS0aNRjKundRizGg==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [netbsd]
+
+  '@esbuild/openbsd-arm64@0.28.1':
+    resolution: {integrity: sha512-MEFJe5C3R8pwXdZ5Y21oo6m7ePiS0d9pWucn99O/wvyJZChoIQKrQDxKrGeW8F5+T0okTHesAmDeiHDTIq0V/Q==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [openbsd]
+
+  '@esbuild/openbsd-x64@0.28.1':
+    resolution: {integrity: sha512-i/ZLIOafE0Z8cI/XANJAixoJL/uRAoS2xOA3rb0xN+KK0K177cMAsQYkzHtBrtMXAKuAc7HGgcWiZ/sRC1Nxgw==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [openbsd]
+
+  '@esbuild/openharmony-arm64@0.28.1':
+    resolution: {integrity: sha512-ge+Z7EXFNt2BO1oAMsVpiQ8EwndV9i1xXerAeTIK7AtPs3bKFXQM7nlRxDSIUIMeueR1CNXxqztLzdNeReKBJg==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [openharmony]
+
+  '@esbuild/sunos-x64@0.28.1':
+    resolution: {integrity: sha512-BEjgtECkL3vY+SaSQ6nzVfiALUeFxpawyp8Jmf5PtYhf1Ug40N1h/hxlhts+f1FvSvarEigdxS3BlSMI2PJLcQ==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [sunos]
+
+  '@esbuild/win32-arm64@0.28.1':
+    resolution: {integrity: sha512-lCv9eK/H6ZJWbE7bh2nw54CZ9M2nupBxJcTsdk/QQnWkdSjKGuxmmH8/GWrlT1eMmZfn4dGcCjRte397WqfQXA==}
+    engines: {node: '>=18'}
+    cpu: [arm64]
+    os: [win32]
+
+  '@esbuild/win32-ia32@0.28.1':
+    resolution: {integrity: sha512-zvb/mB2bSCoJOpoCBgYKKpX6YM6mJBlBUVUtVj41DlZJVEB6/0CKlRYxP5wWl1C1ILiCoAU5wZZ4q1P3qeS6Eg==}
+    engines: {node: '>=18'}
+    cpu: [ia32]
+    os: [win32]
+
+  '@esbuild/win32-x64@0.28.1':
+    resolution: {integrity: sha512-bm4Mowrv+GXMlpWX++EcXw/iLyd1o3+bJkC2DkWXYVvgZCqD/bSj9ctZeAMC3cIxgjRVR2Dufaiu4YPxr5gW1A==}
+    engines: {node: '>=18'}
+    cpu: [x64]
+    os: [win32]
+
+  '@eslint-community/eslint-utils@4.9.1':
+    resolution: {integrity: sha512-phrYmNiYppR7znFEdqgfWHXR6NCkZEK7hwWDHZUjit/2/U0r6XvkDl0SYnoM51Hq7FhCGdLDT6zxCCOY1hexsQ==}
+    engines: {node: ^12.22.0 || ^14.17.0 || >=16.0.0}
+    peerDependencies:
+      eslint: ^6.0.0 || ^7.0.0 || >=8.0.0
+
+  '@eslint-community/regexpp@4.12.2':
+    resolution: {integrity: sha512-EriSTlt5OC9/7SXkRSCAhfSxxoSUgBm33OH+IkwbdpgoqsSsUg7y3uh+IICI/Qg4BBWr3U2i39RpmycbxMq4ew==}
+    engines: {node: ^12.0.0 || ^14.0.0 || >=16.0.0}
+
+  '@eslint/config-array@0.21.2':
+    resolution: {integrity: sha512-nJl2KGTlrf9GjLimgIru+V/mzgSK0ABCDQRvxw5BjURL7WfH5uoWmizbH7QB6MmnMBd8cIC9uceWnezL1VZWWw==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  '@eslint/config-helpers@0.4.2':
+    resolution: {integrity: sha512-gBrxN88gOIf3R7ja5K9slwNayVcZgK6SOUORm2uBzTeIEfeVaIhOpCtTox3P6R7o2jLFwLFTLnC7kU/RGcYEgw==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  '@eslint/core@0.17.0':
+    resolution: {integrity: sha512-yL/sLrpmtDaFEiUj1osRP4TI2MDz1AddJL+jZ7KSqvBuliN4xqYY54IfdN8qD8Toa6g1iloph1fxQNkjOxrrpQ==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  '@eslint/eslintrc@3.3.6':
+    resolution: {integrity: sha512-l2Ul9PrHsPCKcEY/ac7VgFj9D80C7S68sOKc618SyHDPK36s1XcFebXY0iTzUVn4Yq+YbwvSnDmCz9yxjX+QrA==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  '@eslint/js@9.39.5':
+    resolution: {integrity: sha512-QywQuszQh77pIXCsq998c8hbhSTI/azTty1Z6N53dmAudKHhy573j3yvRLsX2BSp8YpLtoCEG8E9DJe+8zUh4A==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  '@eslint/object-schema@2.1.7':
+    resolution: {integrity: sha512-VtAOaymWVfZcmZbp6E2mympDIHvyjXs/12LqWYjVw6qjrfF+VK+fyG33kChz3nnK+SU5/NeHOqrTEHS8sXO3OA==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  '@eslint/plugin-kit@0.4.1':
+    resolution: {integrity: sha512-43/qtrDUokr7LJqoF2c3+RInu/t4zfrpYdoSDfYyhg52rwLV6TnOvdG4fXm7IkSB3wErkcmJS9iEhjVtOSEjjA==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  '@graphile/logger@0.2.0':
+    resolution: {integrity: sha512-jjcWBokl9eb1gVJ85QmoaQ73CQ52xAaOCF29ukRbYNl6lY+ts0ErTaDYOBlejcbUs2OpaiqYLO5uDhyLFzWw4w==}
+
+  '@hono/node-server@1.19.11':
+    resolution: {integrity: sha512-dr8/3zEaB+p0D2n/IUrlPF1HZm586qgJNXK1a9fhg/PzdtkK7Ksd5l312tJX2yBuALqDYBlG20QEbayqPyxn+g==}
+    engines: {node: '>=18.14.1'}
+    peerDependencies:
+      hono: ^4
+
+  '@humanfs/core@0.19.2':
+    resolution: {integrity: sha512-UhXNm+CFMWcbChXywFwkmhqjs3PRCmcSa/hfBgLIb7oQ5HNb1wS0icWsGtSAUNgefHeI+eBrA8I1fxmbHsGdvA==}
+    engines: {node: '>=18.18.0'}
+
+  '@humanfs/node@0.16.8':
+    resolution: {integrity: sha512-gE1eQNZ3R++kTzFUpdGlpmy8kDZD/MLyHqDwqjkVQI0JMdI1D51sy1H958PNXYkM2rAac7e5/CnIKZrHtPh3BQ==}
+    engines: {node: '>=18.18.0'}
+
+  '@humanfs/types@0.15.0':
+    resolution: {integrity: sha512-ZZ1w0aoQkwuUuC7Yf+7sdeaNfqQiiLcSRbfI08oAxqLtpXQr9AIVX7Ay7HLDuiLYAaFPu8oBYNq/QIi9URHJ3Q==}
+    engines: {node: '>=18.18.0'}
+
+  '@humanwhocodes/module-importer@1.0.1':
+    resolution: {integrity: sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==}
+    engines: {node: '>=12.22'}
+
+  '@humanwhocodes/retry@0.4.3':
+    resolution: {integrity: sha512-bV0Tgo9K4hfPCek+aMAn81RppFKv2ySDQeMoSZuvTASywNTnVJCArCZE2FWqpvIatKu7VMRLWlR1EazvVhDyhQ==}
+    engines: {node: '>=18.18'}
+
+  '@img/colour@1.1.0':
+    resolution: {integrity: sha512-Td76q7j57o/tLVdgS746cYARfSyxk8iEfRxewL9h4OMzYhbW4TAcppl0mT4eyqXddh6L/jwoM75mo7ixa/pCeQ==}
+    engines: {node: '>=18'}
+
+  '@img/sharp-darwin-arm64@0.34.5':
+    resolution: {integrity: sha512-imtQ3WMJXbMY4fxb/Ndp6HBTNVtWCUI0WdobyheGf5+ad6xX8VIDO8u2xE4qc/fr08CKG/7dDseFtn6M6g/r3w==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [arm64]
+    os: [darwin]
+
+  '@img/sharp-darwin-x64@0.34.5':
+    resolution: {integrity: sha512-YNEFAF/4KQ/PeW0N+r+aVVsoIY0/qxxikF2SWdp+NRkmMB7y9LBZAVqQ4yhGCm/H3H270OSykqmQMKLBhBJDEw==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [x64]
+    os: [darwin]
+
+  '@img/sharp-libvips-darwin-arm64@1.2.4':
+    resolution: {integrity: sha512-zqjjo7RatFfFoP0MkQ51jfuFZBnVE2pRiaydKJ1G/rHZvnsrHAOcQALIi9sA5co5xenQdTugCvtb1cuf78Vf4g==}
+    cpu: [arm64]
+    os: [darwin]
+
+  '@img/sharp-libvips-darwin-x64@1.2.4':
+    resolution: {integrity: sha512-1IOd5xfVhlGwX+zXv2N93k0yMONvUlANylbJw1eTah8K/Jtpi15KC+WSiaX/nBmbm2HxRM1gZ0nSdjSsrZbGKg==}
+    cpu: [x64]
+    os: [darwin]
+
+  '@img/sharp-libvips-linux-arm64@1.2.4':
+    resolution: {integrity: sha512-excjX8DfsIcJ10x1Kzr4RcWe1edC9PquDRRPx3YVCvQv+U5p7Yin2s32ftzikXojb1PIFc/9Mt28/y+iRklkrw==}
+    cpu: [arm64]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-libvips-linux-arm@1.2.4':
+    resolution: {integrity: sha512-bFI7xcKFELdiNCVov8e44Ia4u2byA+l3XtsAj+Q8tfCwO6BQ8iDojYdvoPMqsKDkuoOo+X6HZA0s0q11ANMQ8A==}
+    cpu: [arm]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-libvips-linux-ppc64@1.2.4':
+    resolution: {integrity: sha512-FMuvGijLDYG6lW+b/UvyilUWu5Ayu+3r2d1S8notiGCIyYU/76eig1UfMmkZ7vwgOrzKzlQbFSuQfgm7GYUPpA==}
+    cpu: [ppc64]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-libvips-linux-riscv64@1.2.4':
+    resolution: {integrity: sha512-oVDbcR4zUC0ce82teubSm+x6ETixtKZBh/qbREIOcI3cULzDyb18Sr/Wcyx7NRQeQzOiHTNbZFF1UwPS2scyGA==}
+    cpu: [riscv64]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-libvips-linux-s390x@1.2.4':
+    resolution: {integrity: sha512-qmp9VrzgPgMoGZyPvrQHqk02uyjA0/QrTO26Tqk6l4ZV0MPWIW6LTkqOIov+J1yEu7MbFQaDpwdwJKhbJvuRxQ==}
+    cpu: [s390x]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-libvips-linux-x64@1.2.4':
+    resolution: {integrity: sha512-tJxiiLsmHc9Ax1bz3oaOYBURTXGIRDODBqhveVHonrHJ9/+k89qbLl0bcJns+e4t4rvaNBxaEZsFtSfAdquPrw==}
+    cpu: [x64]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-libvips-linuxmusl-arm64@1.2.4':
+    resolution: {integrity: sha512-FVQHuwx1IIuNow9QAbYUzJ+En8KcVm9Lk5+uGUQJHaZmMECZmOlix9HnH7n1TRkXMS0pGxIJokIVB9SuqZGGXw==}
+    cpu: [arm64]
+    os: [linux]
+    libc: [musl]
+
+  '@img/sharp-libvips-linuxmusl-x64@1.2.4':
+    resolution: {integrity: sha512-+LpyBk7L44ZIXwz/VYfglaX/okxezESc6UxDSoyo2Ks6Jxc4Y7sGjpgU9s4PMgqgjj1gZCylTieNamqA1MF7Dg==}
+    cpu: [x64]
+    os: [linux]
+    libc: [musl]
+
+  '@img/sharp-linux-arm64@0.34.5':
+    resolution: {integrity: sha512-bKQzaJRY/bkPOXyKx5EVup7qkaojECG6NLYswgktOZjaXecSAeCWiZwwiFf3/Y+O1HrauiE3FVsGxFg8c24rZg==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [arm64]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-linux-arm@0.34.5':
+    resolution: {integrity: sha512-9dLqsvwtg1uuXBGZKsxem9595+ujv0sJ6Vi8wcTANSFpwV/GONat5eCkzQo/1O6zRIkh0m/8+5BjrRr7jDUSZw==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [arm]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-linux-ppc64@0.34.5':
+    resolution: {integrity: sha512-7zznwNaqW6YtsfrGGDA6BRkISKAAE1Jo0QdpNYXNMHu2+0dTrPflTLNkpc8l7MUP5M16ZJcUvysVWWrMefZquA==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [ppc64]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-linux-riscv64@0.34.5':
+    resolution: {integrity: sha512-51gJuLPTKa7piYPaVs8GmByo7/U7/7TZOq+cnXJIHZKavIRHAP77e3N2HEl3dgiqdD/w0yUfiJnII77PuDDFdw==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [riscv64]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-linux-s390x@0.34.5':
+    resolution: {integrity: sha512-nQtCk0PdKfho3eC5MrbQoigJ2gd1CgddUMkabUj+rBevs8tZ2cULOx46E7oyX+04WGfABgIwmMC0VqieTiR4jg==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [s390x]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-linux-x64@0.34.5':
+    resolution: {integrity: sha512-MEzd8HPKxVxVenwAa+JRPwEC7QFjoPWuS5NZnBt6B3pu7EG2Ge0id1oLHZpPJdn3OQK+BQDiw9zStiHBTJQQQQ==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [x64]
+    os: [linux]
+    libc: [glibc]
+
+  '@img/sharp-linuxmusl-arm64@0.34.5':
+    resolution: {integrity: sha512-fprJR6GtRsMt6Kyfq44IsChVZeGN97gTD331weR1ex1c1rypDEABN6Tm2xa1wE6lYb5DdEnk03NZPqA7Id21yg==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [arm64]
+    os: [linux]
+    libc: [musl]
+
+  '@img/sharp-linuxmusl-x64@0.34.5':
+    resolution: {integrity: sha512-Jg8wNT1MUzIvhBFxViqrEhWDGzqymo3sV7z7ZsaWbZNDLXRJZoRGrjulp60YYtV4wfY8VIKcWidjojlLcWrd8Q==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [x64]
+    os: [linux]
+    libc: [musl]
+
+  '@img/sharp-wasm32@0.34.5':
+    resolution: {integrity: sha512-OdWTEiVkY2PHwqkbBI8frFxQQFekHaSSkUIJkwzclWZe64O1X4UlUjqqqLaPbUpMOQk6FBu/HtlGXNblIs0huw==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [wasm32]
+
+  '@img/sharp-win32-arm64@0.34.5':
+    resolution: {integrity: sha512-WQ3AgWCWYSb2yt+IG8mnC6Jdk9Whs7O0gxphblsLvdhSpSTtmu69ZG1Gkb6NuvxsNACwiPV6cNSZNzt0KPsw7g==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [arm64]
+    os: [win32]
+
+  '@img/sharp-win32-ia32@0.34.5':
+    resolution: {integrity: sha512-FV9m/7NmeCmSHDD5j4+4pNI8Cp3aW+JvLoXcTUo0IqyjSfAZJ8dIUmijx1qaJsIiU+Hosw6xM5KijAWRJCSgNg==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [ia32]
+    os: [win32]
+
+  '@img/sharp-win32-x64@0.34.5':
+    resolution: {integrity: sha512-+29YMsqY2/9eFEiW93eqWnuLcWcufowXewwSNIT6UwZdUUCrM3oFjMWH/Z6/TMmb4hlFenmfAVbpWeup2jryCw==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+    cpu: [x64]
+    os: [win32]
+
+  '@jridgewell/gen-mapping@0.3.13':
+    resolution: {integrity: sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==}
+
+  '@jridgewell/remapping@2.3.5':
+    resolution: {integrity: sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==}
+
+  '@jridgewell/resolve-uri@3.1.2':
+    resolution: {integrity: sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==}
+    engines: {node: '>=6.0.0'}
+
+  '@jridgewell/sourcemap-codec@1.5.5':
+    resolution: {integrity: sha512-cYQ9310grqxueWbl+WuIUIaiUaDcj7WOq5fVhEljNVgRfOUhY9fy2zTvfoqWsnebh8Sl70VScFbICvJnLKB0Og==}
+
+  '@jridgewell/trace-mapping@0.3.31':
+    resolution: {integrity: sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==}
+
+  '@kurkle/color@0.3.4':
+    resolution: {integrity: sha512-M5UknZPHRu3DEDWoipU6sE8PdkZ6Z/S+v4dD+Ke8IaNlpdSQah50lz1KtcFBa2vsdOnwbbnxJwVM4wty6udA5w==}
+
+  '@napi-rs/wasm-runtime@1.1.6':
+    resolution: {integrity: sha512-ZLv/JdUfkvOy9eCnnBaGfiO+XimbjebAeO+MRQqD/B+FR1tnRN0tpKSJHRbE8sFfS6aqsXZ67TQjfwfsxULVbg==}
+    peerDependencies:
+      '@emnapi/core': ^1.7.1
+      '@emnapi/runtime': ^1.7.1
+
+  '@next/env@16.2.10':
+    resolution: {integrity: sha512-zLPxg9M0MEHmygpj5OuxjQ+vHMiy/K7cSp74G8ecYolmgUWw0RwN02tF56npup/+qaI8JB97hQgS/r2Hb6QwVA==}
+
+  '@next/eslint-plugin-next@16.2.10':
+    resolution: {integrity: sha512-Gs8D2m21VnJeFo9qvYIIqJH94frWerWYu41BprU1pLtRVF7PCQNLiFZZ3fG+iPuj3K83Cwv/rt+msLOy8Qgu3Q==}
+
+  '@next/swc-darwin-arm64@16.2.10':
+    resolution: {integrity: sha512-v9IdJCa0H0mbo+8z5zwUpOk1Vj7RjkcI5uNYf5Ws1y6szf/p3Mzl9hLaST8SCt6L9h8NGnruZcd2+o0NTNwDhA==}
+    engines: {node: '>= 10'}
+    cpu: [arm64]
+    os: [darwin]
+
+  '@next/swc-darwin-x64@16.2.10':
+    resolution: {integrity: sha512-17IS0jJRViROGmA9uGdNR8VPJpfbnaVG7E9qhso5jDLkmyd0lSDORWxbcKINzcFqzZqGwGtMSnrFRxBpuUYjLQ==}
+    engines: {node: '>= 10'}
+    cpu: [x64]
+    os: [darwin]
+
+  '@next/swc-linux-arm64-gnu@16.2.10':
+    resolution: {integrity: sha512-GRQRsRtuciNJvB54AvvuQTiq0oZtFwa1owQqtZD8wwnGpM2L39MV22kpI72YSXLKIyY40LC66EiLFv4PiicXxg==}
+    engines: {node: '>= 10'}
+    cpu: [arm64]
+    os: [linux]
+    libc: [glibc]
+
+  '@next/swc-linux-arm64-musl@16.2.10':
+    resolution: {integrity: sha512-zkN9MQYS7UQBro+FnISUq1itaQjXI9xqISzuQ+2bc921NcJ1x4yPCqrn77tVN6/dOOXaaWVX3k6/bR07pPwK+A==}
+    engines: {node: '>= 10'}
+    cpu: [arm64]
+    os: [linux]
+    libc: [musl]
+
+  '@next/swc-linux-x64-gnu@16.2.10':
+    resolution: {integrity: sha512-iCVJnwvrPYECvA6WM/7+oo+OiTvedIKLxtCLAZP4xZR3nXa1zmzZyLPbYCmWvpd4CvMYF1EMTafd0ii3DygLvA==}
+    engines: {node: '>= 10'}
+    cpu: [x64]
+    os: [linux]
+    libc: [glibc]
+
+  '@next/swc-linux-x64-musl@16.2.10':
+    resolution: {integrity: sha512-ov2g4H0dHY9bPoOU83m91hWT7Iq5qy13bUnyyshLU3HGR1Ownn0X9QpmDPc5iIUaahTp7f7LeGAhV4DSFtackw==}
+    engines: {node: '>= 10'}
+    cpu: [x64]
+    os: [linux]
+    libc: [musl]
+
+  '@next/swc-win32-arm64-msvc@16.2.10':
+    resolution: {integrity: sha512-DwAnhLX76HQiFFQNgWlcK+JzlnD1rZ+UK/WY0ZMI/deXpvgnesjNYrqcfo1JzBuz4Kf7o3brIBL0glI1junatA==}
+    engines: {node: '>= 10'}
+    cpu: [arm64]
+    os: [win32]
+
+  '@next/swc-win32-x64-msvc@16.2.10':
+    resolution: {integrity: sha512-0JXq3b85Jk9Jg4ntLUbXSPvoDw3gpZou7twuKdoFG2jOw635v7+IiXfTaa0TxVMyx78pUjnrVYwLgjKfX4e6/A==}
+    engines: {node: '>= 10'}
+    cpu: [x64]
+    os: [win32]
+
+  '@nodelib/fs.scandir@2.1.5':
+    resolution: {integrity: sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm/NOTo0KG7HYHU7eppKZj3MyqYuMBf62g==}
+    engines: {node: '>= 8'}
+
+  '@nodelib/fs.stat@2.0.5':
+    resolution: {integrity: sha512-RkhPPp2zrqDAQA/2jNhnztcPAlv64XdhIp7a7454A5ovI7Bukxgt7MX7udwAu3zg1DcpPU0rz3VV1SeaqvY4+A==}
+    engines: {node: '>= 8'}
+
+  '@nodelib/fs.walk@1.2.8':
+    resolution: {integrity: sha512-oGB+UxlgWcgQkgwo8GcEGwemoTFt3FIO9ababBmaGwXIoBKZ+GTy0pP185beGg7Llih/NSHSV2XAs1lnznocSg==}
+    engines: {node: '>= 8'}
+
+  '@nolyfill/is-core-module@1.0.39':
+    resolution: {integrity: sha512-nn5ozdjYQpUCZlWGuxcJY/KpxkWQs4DcbMCmKojjyrYDEAGy4Ce19NN4v5MduafTwJlbKc99UA8YhSVqq9yPZA==}
+    engines: {node: '>=12.4.0'}
+
+  '@oxc-project/types@0.139.0':
+    resolution: {integrity: sha512-r9gHphtCs+1M7J0pw6Sn/hh/Wpa/iQrOOkrNAlVLF/gHq+/CJmHIWKKUUhdWjcD6CIa8idarspCsASiXCXvFUw==}
+
+  '@panva/hkdf@1.2.1':
+    resolution: {integrity: sha512-6oclG6Y3PiDFcoyk8srjLfVKyMfVCKJ27JwNPViuXziFpmdz+MZnZN/aKY0JGXgYuO/VghU0jcOAZgWXZ1Dmrw==}
+
+  '@phc/format@1.0.0':
+    resolution: {integrity: sha512-m7X9U6BG2+J+R1lSOdCiITLLrxm+cWlNI3HUFA92oLO77ObGNzaKdh8pMLqdZcshtkKuV84olNNXDfMc4FezBQ==}
+    engines: {node: '>=10'}
+
+  '@prisma/adapter-pg@7.8.0':
+    resolution: {integrity: sha512-ygb3UkerK3v8MDpXVgCISdRNDozpxh6+JVJgiIGbSr5KBgz10LLf5ejUskPGoXlsIjxsOu6nuy1JVQr2EKGSlg==}
+
+  '@prisma/client-runtime-utils@7.8.0':
+    resolution: {integrity: sha512-5NQZztQ0oY/ADFkmd9gPuweH5A1/CCY8YQPorLLO0Mu6a87mY5gsnDkzmFmIHs9NFaLnZojzgddFVN4RpKYrdw==}
+
+  '@prisma/client@7.8.0':
+    resolution: {integrity: sha512-HFp3Dawv/3sU3JtlPha90IB+48lS7zHiH4LKZPjmcE8YH5P9DOXGPvo8dqOtO7MqLDd1p2hOWMcFlRT1DMblHw==}
+    engines: {node: ^20.19 || ^22.12 || >=24.0}
+    peerDependencies:
+      prisma: '*'
+      typescript: '>=5.4.0'
+    peerDependenciesMeta:
+      prisma:
+        optional: true
+      typescript:
+        optional: true
+
+  '@prisma/config@7.8.0':
+    resolution: {integrity: sha512-HFESzd9rx2ZQxlK+TL7tu1HPvCqrHiL6LCxYykI2c34mvaUuIVVl3lYuicJD/MNnzgPnyeBEMlK4WTomJCV5jw==}
+
+  '@prisma/debug@7.2.0':
+    resolution: {integrity: sha512-YSGTiSlBAVJPzX4ONZmMotL+ozJwQjRmZweQNIq/ER0tQJKJynNkRB3kyvt37eOfsbMCXk3gnLF6J9OJ4QWftw==}
+
+  '@prisma/debug@7.8.0':
+    resolution: {integrity: sha512-p+QZReysDUqXC+mk17q9a+Y/qzh4c2KYliDK30buYUyfrGeTGSyfmc0AIrJRhZJrLHhRiJa9Au/J72h3C+szvA==}
+
+  '@prisma/dev@0.24.3':
+    resolution: {integrity: sha512-ffHlQuKXZiaDt9Go0OnCTdJZrHxK0k7omJKNV86/VjpsXu5EIHZLK0T7JSWgvNlJwh56kW9JFu9v0qJciFzepg==}
+
+  '@prisma/driver-adapter-utils@7.8.0':
+    resolution: {integrity: sha512-/Q13o0ZT0rjc1Xk0Q9KhZYwuq2EW/vSbWUBKfgEKkaCuB/Sg6bqnjmTZqC5cD4d6y1vfFAEwBRzfzoSMIVJ55A==}
+
+  '@prisma/engines-version@7.8.0-6.3c6e192761c0362d496ed980de936e2f3cebcd3a':
+    resolution: {integrity: sha512-fJPQxCkLgA5EayWaW8eArgCvjJ+N+Kz3VyeNKMEeYiQC4alNkxRKFVAGxv/ZUzuJISKqdw+zGeDbS6mn6RCPOA==}
+
+  '@prisma/engines@7.8.0':
+    resolution: {integrity: sha512-jx3rCnNNrt5uzbkKlegtQ2GZHxSlihMCzutgT/BP6UIDF1r9tDI39hV/0T/cHZgzJ3ELbuQPXlVZy+Y1n0pcgw==}
+
+  '@prisma/fetch-engine@7.8.0':
+    resolution: {integrity: sha512-gwB0Euiz/DDRyxFRpLXYlK3RfaZUj1c5dAYMuhZYfApg7arknJlcb9bIsOHDppJmbqYaVA+yBIiFMDBfprsNPQ==}
+
+  '@prisma/get-platform@7.2.0':
+    resolution: {integrity: sha512-k1V0l0Td1732EHpAfi2eySTezyllok9dXb6UQanajkJQzPUGi3vO2z7jdkz67SypFTdmbnyGYxvEvYZdZsMAVA==}
+
+  '@prisma/get-platform@7.8.0':
+    resolution: {integrity: sha512-WlxgRGnolL8VH2EmkH1R/DkKNr/mVdS3G2h42IZFFZ3eUrH9OT6t73kIOSlkkrv50wG123Iq8d96ufv5LlZktw==}
+
+  '@prisma/query-plan-executor@7.2.0':
+    resolution: {integrity: sha512-EOZmNzcV8uJ0mae3DhTsiHgoNCuu1J9mULQpGCh62zN3PxPTd+qI9tJvk5jOst8WHKQNwJWR3b39t0XvfBB0WQ==}
+
+  '@prisma/streams-local@0.1.2':
+    resolution: {integrity: sha512-l49yTxKKF2odFxaAXTmwmkBKL3+bVQ1tFOooGifu4xkdb9NMNLxHj27XAhTylWZod8I+ISGM5erU1xcl/oBCtg==}
+    engines: {bun: '>=1.3.6', node: '>=22.0.0'}
+
+  '@prisma/studio-core@0.27.3':
+    resolution: {integrity: sha512-AADjNFPdsrglxHQVTmHFqv6DuKQZ5WY4p5/gVFY017twvNrSwpLJ9lqUbYYxEu2W7nbvVxTZA8deJ8LseNALsw==}
+    engines: {node: ^20.19 || ^22.12 || >=24.0, pnpm: '8'}
+    peerDependencies:
+      '@types/react': ^18.0.0 || ^19.0.0
+      react: ^18.0.0 || ^19.0.0
+      react-dom: ^18.0.0 || ^19.0.0
+
+  '@radix-ui/primitive@1.1.3':
+    resolution: {integrity: sha512-JTF99U/6XIjCBo0wqkU5sK10glYe27MRRsfwoiq5zzOEZLHU3A3KCMa5X/azekYRCJ0HlwI0crAXS/5dEHTzDg==}
+
+  '@radix-ui/react-compose-refs@1.1.2':
+    resolution: {integrity: sha512-z4eqJvfiNnFMHIIvXP3CY57y2WJs5g2v3X0zm9mEJkrkNv4rDxu+sg9Jh8EkXyeqBkB7SOcboo9dMVqhyrACIg==}
+    peerDependencies:
+      '@types/react': '*'
+      react: ^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc
+    peerDependenciesMeta:
+      '@types/react':
+        optional: true
+
+  '@radix-ui/react-primitive@2.1.3':
+    resolution: {integrity: sha512-m9gTwRkhy2lvCPe6QJp4d3G1TYEUHn/FzJUtq9MjH46an1wJU+GdoGC5VLof8RX8Ft/DlpshApkhswDLZzHIcQ==}
+    peerDependencies:
+      '@types/react': '*'
+      '@types/react-dom': '*'
+      react: ^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc
+      react-dom: ^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc
+    peerDependenciesMeta:
+      '@types/react':
+        optional: true
+      '@types/react-dom':
+        optional: true
+
+  '@radix-ui/react-slot@1.2.3':
+    resolution: {integrity: sha512-aeNmHnBxbi2St0au6VBVC7JXFlhLlOnvIIlePNniyUNAClzmtAUEY8/pBiK3iHjufOlwA+c20/8jngo7xcrg8A==}
+    peerDependencies:
+      '@types/react': '*'
+      react: ^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc
+    peerDependenciesMeta:
+      '@types/react':
+        optional: true
+
+  '@radix-ui/react-toggle@1.1.10':
+    resolution: {integrity: sha512-lS1odchhFTeZv3xwHH31YPObmJn8gOg7Lq12inrr0+BH/l3Tsq32VfjqH1oh80ARM3mlkfMic15n0kg4sD1poQ==}
+    peerDependencies:
+      '@types/react': '*'
+      '@types/react-dom': '*'
+      react: ^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc
+      react-dom: ^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc
+    peerDependenciesMeta:
+      '@types/react':
+        optional: true
+      '@types/react-dom':
+        optional: true
+
+  '@radix-ui/react-use-controllable-state@1.2.2':
+    resolution: {integrity: sha512-BjasUjixPFdS+NKkypcyyN5Pmg83Olst0+c6vGov0diwTEo6mgdqVR6hxcEgFuh4QrAs7Rc+9KuGJ9TVCj0Zzg==}
+    peerDependencies:
+      '@types/react': '*'
+      react: ^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc
+    peerDependenciesMeta:
+      '@types/react':
+        optional: true
+
+  '@radix-ui/react-use-effect-event@0.0.2':
+    resolution: {integrity: sha512-Qp8WbZOBe+blgpuUT+lw2xheLP8q0oatc9UpmiemEICxGvFLYmHm9QowVZGHtJlGbS6A6yJ3iViad/2cVjnOiA==}
+    peerDependencies:
+      '@types/react': '*'
+      react: ^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc
+    peerDependenciesMeta:
+      '@types/react':
+        optional: true
+
+  '@radix-ui/react-use-layout-effect@1.1.1':
+    resolution: {integrity: sha512-RbJRS4UWQFkzHTTwVymMTUv8EqYhOp8dOOviLj2ugtTiXRaRQS7GLGxZTLL1jWhMeoSCf5zmcZkqTl9IiYfXcQ==}
+    peerDependencies:
+      '@types/react': '*'
+      react: ^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc
+    peerDependenciesMeta:
+      '@types/react':
+        optional: true
+
+  '@rolldown/binding-android-arm64@1.1.5':
+    resolution: {integrity: sha512-lZg8fqIv2v7FF237bwMgzGZEJvGL79/s5knJ/i6FmsGF4XXlzccZ4jb+TrFIxtSSxFtIpdsgrPZeMk1I9AFcyQ==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [arm64]
+    os: [android]
+
+  '@rolldown/binding-darwin-arm64@1.1.5':
+    resolution: {integrity: sha512-51Bnx9pNiMRKSUNtBfySkNJ9vMU9Hh3I1ozDd6gyPPYzaXCfnptUcEZxXGYFn+ul2dtcMUiqGR1Yai2K10uoTw==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [arm64]
+    os: [darwin]
+
+  '@rolldown/binding-darwin-x64@1.1.5':
+    resolution: {integrity: sha512-Tm+gbfC0aHu1tBA/JvKQh32S0K6YgCHkiAF4/W6xX0K0RmNuc94VeK419dJoE65R5aRxmo+noZQSWrAMF6yb6g==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [x64]
+    os: [darwin]
+
+  '@rolldown/binding-freebsd-x64@1.1.5':
+    resolution: {integrity: sha512-JMzDKCCXq93YccG5gz3hvOs1oXRKAf0XYpfOS88e+wZrC8Iugj6j68867vrYZkvpDDpKn/KoKORThmchMpF6TA==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [x64]
+    os: [freebsd]
+
+  '@rolldown/binding-linux-arm-gnueabihf@1.1.5':
+    resolution: {integrity: sha512-uML21j2K5TfPGutKxub+M+nLjZIrWjXQ5Grx4lCe/nimTj9B4L63zHpjXLl4y0L3mcm2htEQIb06oCG/szerNw==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [arm]
+    os: [linux]
+
+  '@rolldown/binding-linux-arm64-gnu@1.1.5':
+    resolution: {integrity: sha512-navSiuTMogvnQoZoM/v+l3ZWo50/NTwSHSzheABx/RCnmUPaKwq9qSo4Br2OYRs21+Fz8uFqITZM3H4opOB0/Q==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [arm64]
+    os: [linux]
+    libc: [glibc]
+
+  '@rolldown/binding-linux-arm64-musl@1.1.5':
+    resolution: {integrity: sha512-lAryqH7IteztmCXQXk0etKj4wBQ7Gx5S6LjKhsgp9zb8I5bsuvU/2llH1hDQcjsFeqIsovMVN339/8pUDDBXxA==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [arm64]
+    os: [linux]
+    libc: [musl]
+
+  '@rolldown/binding-linux-ppc64-gnu@1.1.5':
+    resolution: {integrity: sha512-fsK/sNBnxzBlL4O1JNrZakVQxPspqpED5dLtNsZS9oOKmtSpdNIzxH2kkol5HYTWJN47sE20ztMJPxfZ89qGOg==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [ppc64]
+    os: [linux]
+    libc: [glibc]
+
+  '@rolldown/binding-linux-s390x-gnu@1.1.5':
+    resolution: {integrity: sha512-gLYb4BIadlfTOYT5gO503n8zQjXflgzpD0FcyKh0Mzx3rqCZKnHoJWV9xe1KXUJ5lx2JfcSHr/mhzS0PC/McAA==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [s390x]
+    os: [linux]
+    libc: [glibc]
+
+  '@rolldown/binding-linux-x64-gnu@1.1.5':
+    resolution: {integrity: sha512-FjcpEKUyJygHgs1o50VYNvkt5+7Le/VEdYt0AkRpkL33MnyQfwr8l5mXwMmfmTbyMPr5vJLC+8/Gd9gXnwU1QQ==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [x64]
+    os: [linux]
+    libc: [glibc]
+
+  '@rolldown/binding-linux-x64-musl@1.1.5':
+    resolution: {integrity: sha512-Me+PfPI2TMeOQk0gYWfLQZtTktrmzbr8cDboqX83XKc7UrgAi55gF+2dUkWdxd19n55Essp2yeca+O9N5rBxHg==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [x64]
+    os: [linux]
+    libc: [musl]
+
+  '@rolldown/binding-openharmony-arm64@1.1.5':
+    resolution: {integrity: sha512-yc5WrLzXks6zCQfn9Oxr8pORKyl/pF+QjHmW/Qx3qu0oyrrNC+y2JLTU1E2rcWYAmzlnqngWXHQjy51VzW70Vw==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [arm64]
+    os: [openharmony]
+
+  '@rolldown/binding-wasm32-wasi@1.1.5':
+    resolution: {integrity: sha512-VbQGPX2b4r48TAMIM2cjgluIM1HYutm4pcTEJsle7iEP7sB1dFqtPLBVbdLAZCxy1txCcPxf4QFf4v8uvltPqA==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [wasm32]
+
+  '@rolldown/binding-win32-arm64-msvc@1.1.5':
+    resolution: {integrity: sha512-gHv82k63z4qpV5+Q1y/12KrK0ltWBukVDI8nZcbT7Tt/ZlOIVwppazneq0F93oDxTo3IgAMEDIoQh3E2n6mVsw==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [arm64]
+    os: [win32]
+
+  '@rolldown/binding-win32-x64-msvc@1.1.5':
+    resolution: {integrity: sha512-tTZuDBPw85tEN5PQi1pnEBzDy0Z49HtScLAbD5t6hyeU92A95pRWaSMw1GZZi/RwgSgUIl0xrSlXIT/9QzvYSA==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    cpu: [x64]
+    os: [win32]
+
+  '@rolldown/pluginutils@1.0.1':
+    resolution: {integrity: sha512-2j9bGt5Jh8hj+vPtgzPtl72j0yRxHAyumoo6TNfAjsLB04UtpSvPbPcDcBMxz7n+9CYB0c1GxQFxYRg2jimqGw==}
+
+  '@rtsao/scc@1.1.0':
+    resolution: {integrity: sha512-zt6OdqaDoOnJ1ZYsCYGt9YmWzDXl4vQdKTyJev62gFhRGKdx7mcT54V9KIjg+d2wi9EXsPvAPKe7i7WjfVWB8g==}
+
+  '@standard-schema/spec@1.1.0':
+    resolution: {integrity: sha512-l2aFy5jALhniG5HgqrD6jXLi/rUWrKvqN/qJx6yoJsgKhblVd+iqqU4RCXavm/jPityDo5TCvKMnpjKnOriy0w==}
+
+  '@swc/helpers@0.5.15':
+    resolution: {integrity: sha512-JQ5TuMi45Owi4/BIMAJBoSQoOJu12oOk/gADqlcUL9JEdHB8vyjUSsxqeNXnmXHjYKMi2WcYtezGEEhqUI/E2g==}
+
+  '@tailwindcss/node@4.3.2':
+    resolution: {integrity: sha512-yWP/sqEcBLaD8JuA6zNwxoYKr75qxTioYwlRwekj5Jr/I5GXnoJfjetH/psLUIv74cYTH2lBUEzBkinthoYcBg==}
+
+  '@tailwindcss/oxide-android-arm64@4.3.2':
+    resolution: {integrity: sha512-WHxqIuHpvZ5VtdX6GTl1Ik/Vp2YuN42Et+0CdeaVd/frQ9jAvGmvR8vLT+jk3e8/Q3x8kECB9+R17pgpp2BulA==}
+    engines: {node: '>= 20'}
+    cpu: [arm64]
+    os: [android]
+
+  '@tailwindcss/oxide-darwin-arm64@4.3.2':
+    resolution: {integrity: sha512-GZypeUY/IDJW3877KeM+O67vbXr3MBnbtEL4aYhNErv/JWZhye2vGSWWG9tB6iiqR2MqRNkY8IOUy4NdSZV26w==}
+    engines: {node: '>= 20'}
+    cpu: [arm64]
+    os: [darwin]
+
+  '@tailwindcss/oxide-darwin-x64@4.3.2':
+    resolution: {integrity: sha512-UIIzmefR6KO1sDU7MzRqAxC8iBpft/VhkGjTjnhoS6k7Z3rQ9wEgA1ODSiyH/tcSYssulNm4Ci3hOeK1jH7ccQ==}
+    engines: {node: '>= 20'}
+    cpu: [x64]
+    os: [darwin]
+
+  '@tailwindcss/oxide-freebsd-x64@4.3.2':
+    resolution: {integrity: sha512-GN+uAmcI6DNspnCDwtOAZrTz6oukJnp337qZvxqCGLd3BHBzJpO0ZbTLRvJNdztOeAmTzewewGIMPb0tk2R4WA==}
+    engines: {node: '>= 20'}
+    cpu: [x64]
+    os: [freebsd]
+
+  '@tailwindcss/oxide-linux-arm-gnueabihf@4.3.2':
+    resolution: {integrity: sha512-4ABn7qSbdHRwTiDiuWNegCyb5+2FJ4vKIKc3DmKrvAFw7MU1Lm11dIkTPwUaFdTzc7IsOpDbqBrlh0x6y36U/w==}
+    engines: {node: '>= 20'}
+    cpu: [arm]
+    os: [linux]
+
+  '@tailwindcss/oxide-linux-arm64-gnu@4.3.2':
+    resolution: {integrity: sha512-wDgEIGwoM8w8pufh9LVt1PahDgNdKXrLC2qfAnV3vAmococ9RWbxeAw4pxPttd/TsJfwjyLf90Dg1y9y8I6Emw==}
+    engines: {node: '>= 20'}
+    cpu: [arm64]
+    os: [linux]
+    libc: [glibc]
+
+  '@tailwindcss/oxide-linux-arm64-musl@4.3.2':
+    resolution: {integrity: sha512-J5Nuk0uZQIiMTJj3LEx4sAA9tMFUoXQZFv1J6An+QGYe53HKRJuFDi0rpq/tuouCZeAbOBY3kQ6g8qeD4TUjtA==}
+    engines: {node: '>= 20'}
+    cpu: [arm64]
+    os: [linux]
+    libc: [musl]
+
+  '@tailwindcss/oxide-linux-x64-gnu@4.3.2':
+    resolution: {integrity: sha512-kqCZpSKOBEJO4mz7OqWoofBZeXTAwaVGPj0ErAj7CojmhKpWVWVOnrt9dE8odoIraZq4oj3ausM37kXi+Tow8w==}
+    engines: {node: '>= 20'}
+    cpu: [x64]
+    os: [linux]
+    libc: [glibc]
+
+  '@tailwindcss/oxide-linux-x64-musl@4.3.2':
+    resolution: {integrity: sha512-cixpqbh2toJDmkuCRI68nXA8ZxNmdK9Y+9v5h3MC3ZQKy/0BO8AWzlkWyRM7JAFSGBlfig4YVTPsK6MVgqz1uw==}
+    engines: {node: '>= 20'}
+    cpu: [x64]
+    os: [linux]
+    libc: [musl]
+
+  '@tailwindcss/oxide-wasm32-wasi@4.3.2':
+    resolution: {integrity: sha512-4ec2Z/LOmRsAgU23CS4xeJfcJlmRg94A/XrbGRCF1gyU/zdDfRLYDVsS+ynSZCmGNxQ1jQriQOKMQeQxBA3Isw==}
+    engines: {node: '>=14.0.0'}
+    cpu: [wasm32]
+    bundledDependencies:
+      - '@napi-rs/wasm-runtime'
+      - '@emnapi/core'
+      - '@emnapi/runtime'
+      - '@tybys/wasm-util'
+      - '@emnapi/wasi-threads'
+      - tslib
+
+  '@tailwindcss/oxide-win32-arm64-msvc@4.3.2':
+    resolution: {integrity: sha512-Zyr/M0+XcYZu3bZrUytc7TXvrk0ftWfl8gN2MwekNDzhqhKRUucMPSeOzM0o0wH5AWOU49BsKRrfKxI2atCPMQ==}
+    engines: {node: '>= 20'}
+    cpu: [arm64]
+    os: [win32]
+
+  '@tailwindcss/oxide-win32-x64-msvc@4.3.2':
+    resolution: {integrity: sha512-QI9BO7KlNZsp2GuO0jwAAj5jCDABOKXRkCk2XuKTSaNEFSdfzqswYVTtCHBNKHLsqyjFyFkqlDiwkNbTYSssMQ==}
+    engines: {node: '>= 20'}
+    cpu: [x64]
+    os: [win32]
+
+  '@tailwindcss/oxide@4.3.2':
+    resolution: {integrity: sha512-z8ZgnzX8gdNoWLBLqBPoh/sjnxkwvf9ZuWjnO0l0yIzbLa5/9S+eC5QxGZKRobVHIC3/1BoMWjHblqWjcgFgag==}
+    engines: {node: '>= 20'}
+
+  '@tailwindcss/postcss@4.3.2':
+    resolution: {integrity: sha512-rjVWYCa7Ngbi5AarT6k8TkxUG3Wl1QKzHdIZVsjZSzf36Jmo2IKZt/NHRAwly8oDkbBOH0YTu+CHuf9jPxMc+g==}
+
+  '@tybys/wasm-util@0.10.3':
+    resolution: {integrity: sha512-F3fo1MYrRJYL3zER0OUOmkutjr1Vp23m7OsSgp7nq4SP6OqX6C/56XFIPAl5bt3zaBRjmW7SGz3u/6LwFpYcOg==}
+
+  '@types/chai@5.2.3':
+    resolution: {integrity: sha512-Mw558oeA9fFbv65/y4mHtXDs9bPnFMZAL/jxdPFUpOHHIXX91mcgEHbS5Lahr+pwZFR8A7GQleRWeI6cGFC2UA==}
+
+  '@types/debug@4.1.13':
+    resolution: {integrity: sha512-KSVgmQmzMwPlmtljOomayoR89W4FynCAi3E8PPs7vmDVPe84hT+vGPKkJfThkmXs0x0jAaa9U8uW8bbfyS2fWw==}
+
+  '@types/deep-eql@4.0.2':
+    resolution: {integrity: sha512-c9h9dVVMigMPc4bwTvC5dxqtqJZwQPePsWjPlpSOnojbor6pGqdk541lfA7AqFQr5pB1BRdq0juY9db81BwyFw==}
+
+  '@types/estree@1.0.9':
+    resolution: {integrity: sha512-GhdPgy1el4/ImP05X05Uw4cw2/M93BCUmnEvWZNStlCzEKME4Fkk+YpoA5OiHNQmoS7Cafb8Xa3Pya8m1Qrzeg==}
+
+  '@types/interpret@1.1.4':
+    resolution: {integrity: sha512-r+tPKWHYqaxJOYA3Eik0mMi+SEREqOXLmsooRFmc6GHv7nWUDixFtKN+cegvsPlDcEZd9wxsdp041v2imQuvag==}
+
+  '@types/json-schema@7.0.15':
+    resolution: {integrity: sha512-5+fP8P8MFNC+AyZCDxrB2pkZFPGzqQWUzpSeuuVLvm8VMcorNYavBqoFcxK8bQz4Qsbn4oUEEem4wDLfcysGHA==}
+
+  '@types/json5@0.0.29':
+    resolution: {integrity: sha512-dRLjCWHYg4oaA77cxO64oO+7JwCwnIzkZPdrrC71jQmQtlhM556pwKo5bUzqvZndkVbeFLIIi+9TC40JNF5hNQ==}
+
+  '@types/ms@2.1.0':
+    resolution: {integrity: sha512-GsCCIZDE/p3i96vtEqx+7dBUGXrc7zeSK3wwPHIaRThS+9OhWIXRqzs4d6k1SVU8g91DrNRWxWUGhp5KXQb2VA==}
+
+  '@types/node@20.19.43':
+    resolution: {integrity: sha512-6oYBAi5ikg4Pl+kGsoYtawUMBT2zZMCvPNF7pVLnHZfd1zf38DRiWn/gT01RYCdUqkv7Fhr+C9ot4/tb+2sVvA==}
+
+  '@types/node@22.20.1':
+    resolution: {integrity: sha512-EANqOCF9QFyra+4pfxUcX9STKJpCLjMbObVzljIJomAWSnuSIEAvyzEU53GaajbXJEgdh0iEcPL+DGvpUd4k1Q==}
+
+  '@types/pg@8.20.0':
+    resolution: {integrity: sha512-bEPFOaMAHTEP1EzpvHTbmwR8UsFyHSKsRisLIHVMXnpNefSbGA1bD6CVy+qKjGSqmZqNqBDV2azOBo8TgkcVow==}
+
+  '@types/react-dom@19.2.3':
+    resolution: {integrity: sha512-jp2L/eY6fn+KgVVQAOqYItbF0VY/YApe5Mz2F0aykSO8gx31bYCZyvSeYxCHKvzHG5eZjc+zyaS5BrBWya2+kQ==}
+    peerDependencies:
+      '@types/react': ^19.2.0
+
+  '@types/react@19.2.17':
+    resolution: {integrity: sha512-MXfmqaVPEVgkBT/aY0aGCkRWWtByiYQXo3xdQ8r5RzuFrPiRn8Gar2tQdXSUQ2GKV3bkXckek89V8wQBY2Q/Aw==}
+
+  '@types/semver@7.7.1':
+    resolution: {integrity: sha512-FmgJfu+MOcQ370SD0ev7EI8TlCAfKYU+B4m5T3yXc1CiRN94g/SZPtsCkk506aUDtlMnFZvasDwHHUcZUEaYuA==}
+
+  '@typescript-eslint/eslint-plugin@8.64.0':
+    resolution: {integrity: sha512-CGvQPBxN3wZLu6Rz2kFUpZeoCm78xUic92ck39KPePkO1NPOwjCqdQnm5Q87tpWw9vcBvW8XLrDXjH9PWYtJ3Q==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+    peerDependencies:
+      '@typescript-eslint/parser': ^8.64.0
+      eslint: ^8.57.0 || ^9.0.0 || ^10.0.0
+      typescript: '>=4.8.4 <6.1.0'
+
+  '@typescript-eslint/parser@8.64.0':
+    resolution: {integrity: sha512-KA0OshtlcCCXmbfqyZkM5pV3/WNraJf7DkJRLpyrmwPtud57H5BDX7C3k0LPSPxpprfRL+cJDGabF10mvNCoCw==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+    peerDependencies:
+      eslint: ^8.57.0 || ^9.0.0 || ^10.0.0
+      typescript: '>=4.8.4 <6.1.0'
+
+  '@typescript-eslint/project-service@8.64.0':
+    resolution: {integrity: sha512-tk4WpOJ6IEbGrVHaNmM0YRrwAD3exZlIK3iadQNAxh4YKk6jvUQ4ecq18n+v7+meh+cJ3j+D8nbk8sRKhlwLQg==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+    peerDependencies:
+      typescript: '>=4.8.4 <6.1.0'
+
+  '@typescript-eslint/scope-manager@8.64.0':
+    resolution: {integrity: sha512-CXEaFdYXjSTgKhisNkwCcJwTP8Pl+fmRrEQrri4nm3vU743bALrxzLmq7fHG/7e6a5xO0lDYeURpZmBuhHk54w==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  '@typescript-eslint/tsconfig-utils@8.64.0':
+    resolution: {integrity: sha512-2yo8rRNKuzbVWQp5kslhANqZ2uDAeROQHBRZNPu8JDsHmeFNj/XJJhX/FhNUWmkHHvoNsKa6+tHJiig87EzsQw==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+    peerDependencies:
+      typescript: '>=4.8.4 <6.1.0'
+
+  '@typescript-eslint/type-utils@8.64.0':
+    resolution: {integrity: sha512-XWG4Fmmv/6SvyS9nH8jWrKs6terwJvE8cyRt1CzYYqzp9OrPhCT4cMc/f7C6RZCwG+qMmiffJS1/qJP8G1URtg==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+    peerDependencies:
+      eslint: ^8.57.0 || ^9.0.0 || ^10.0.0
+      typescript: '>=4.8.4 <6.1.0'
+
+  '@typescript-eslint/types@8.64.0':
+    resolution: {integrity: sha512-qjhfuTfLXjA4IOzXvz0rTjT01BqEiIgPoUeMwiEjnaHKJMTNo8rH5pYW1a2L/0Dnux2fPC85AeyJoWaGa8WxTA==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  '@typescript-eslint/typescript-estree@8.64.0':
+    resolution: {integrity: sha512-Pztpsn1aCE1oWDvDEfUk31nngvvF7vUB5SwHFEaZIFpvw7WJtqUHHL4plBZDA9HfWJJjL13BdG0YrJInTUvoVA==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+    peerDependencies:
+      typescript: '>=4.8.4 <6.1.0'
+
+  '@typescript-eslint/utils@8.64.0':
+    resolution: {integrity: sha512-aJUGVB3+U0htrrCjoA8qukw8cm8fNCGAxK/tVoS70k8aeb7DETKeFozRiVFIwEeN9WJLsjaP3ph8I60tY2XZoQ==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+    peerDependencies:
+      eslint: ^8.57.0 || ^9.0.0 || ^10.0.0
+      typescript: '>=4.8.4 <6.1.0'
+
+  '@typescript-eslint/visitor-keys@8.64.0':
+    resolution: {integrity: sha512-mrtuL8Nsn6gi2H4mo5KMTp823M+3Q19Ew/i+Zlikq20tIMm99C3Ez0dCmkWWnxut20esQvTg8aUSEhMcAOXhEw==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  '@unrs/resolver-binding-android-arm-eabi@1.12.2':
+    resolution: {integrity: sha512-g5T90pqg1bo/7mytQx6F4iBNC0Wsh9cu+z9veDbFjc7HjpesJFWD7QMS0NGStXM075+7dJPPVvBbpZlnrdpi/w==}
+    cpu: [arm]
+    os: [android]
+
+  '@unrs/resolver-binding-android-arm64@1.12.2':
+    resolution: {integrity: sha512-YGCRZv/9GLhwmz6mYDeTsm/92BAyR28l6c2ReweVW5pWgfsitWLY8upvfRlGdoyD8HjeTHSYJWyZGD4KJA/nFQ==}
+    cpu: [arm64]
+    os: [android]
+
+  '@unrs/resolver-binding-darwin-arm64@1.12.2':
+    resolution: {integrity: sha512-u9DiNT1auQMO20A9SyTuG3wUgQWB9Z7KjAg0uFuCDR1FsAY8A0CG2S6JpHS1xwm/w1G08bjXZDcyOCjv1WAm2w==}
+    cpu: [arm64]
+    os: [darwin]
+
+  '@unrs/resolver-binding-darwin-x64@1.12.2':
+    resolution: {integrity: sha512-f7rPLi/T1HVKZu/u6t87lroib16n8vrSzcyxI7lg4BGO9UF26KhQL44sd9eOUgrTYhvRXtWOIZT5PejdPyJfUA==}
+    cpu: [x64]
+    os: [darwin]
+
+  '@unrs/resolver-binding-freebsd-x64@1.12.2':
+    resolution: {integrity: sha512-BpcOjWCJub6nRZUS2zA20pmLvjtqAtGejETaIyRLiZiQf++cbrjltLA5NN/xaXfqeOBOSlMFbemIl5/S5tljmg==}
+    cpu: [x64]
+    os: [freebsd]
+
+  '@unrs/resolver-binding-linux-arm-gnueabihf@1.12.2':
+    resolution: {integrity: sha512-vZTDvdSISZjJx66OzJqtsOhzifbqRjbmI1Mnu49fQDwog5GtDI4QidRiEAYbZCRj9C8YZEW+3ZjqsyS9GR4k2A==}
+    cpu: [arm]
+    os: [linux]
+
+  '@unrs/resolver-binding-linux-arm-musleabihf@1.12.2':
+    resolution: {integrity: sha512-BiPI+IrIlwcW4nLLMM21+B1dFPzd55yAVgVGrdgDjNef+ch03GdxrcyaIz8X9SsQirh/kCQ7mviyWlMxdh2D7g==}
+    cpu: [arm]
+    os: [linux]
+
+  '@unrs/resolver-binding-linux-arm64-gnu@1.12.2':
+    resolution: {integrity: sha512-zJc0H99FEPoFfSrNpa91HYfxzfAJCr502oxNK1cfdC9hlaFI43RT+JFCann9JUgZmLzzntChHyn13Sgn9ljHNg==}
+    cpu: [arm64]
+    os: [linux]
+    libc: [glibc]
+
+  '@unrs/resolver-binding-linux-arm64-musl@1.12.2':
+    resolution: {integrity: sha512-KQ3Lki6l+Pz1k/eBipN41ES+YUK30beLGb9YqcB1O542cyLCNE6GaxrfcY3T6EezmGGk84wb5XyO9loTM9tkcA==}
+    cpu: [arm64]
+    os: [linux]
+    libc: [musl]
+
+  '@unrs/resolver-binding-linux-loong64-gnu@1.12.2':
+    resolution: {integrity: sha512-3SJGEh1DborhG6pyxvhPzCT4bbSIVihsvgJc13P1bHG7KLdNDaF9T3gsTwFc7Jw/5Y5/iWOjkEx7Zy0NvCGX3Q==}
+    cpu: [loong64]
+    os: [linux]
+    libc: [glibc]
+
+  '@unrs/resolver-binding-linux-loong64-musl@1.12.2':
+    resolution: {integrity: sha512-jiuG/Obbel7uw1PwHNFfrkiKhLAF6mnyZ6aWlOAVN9WqKm8v0OFGnciJIHu8+CMvXLQ8AD51LPzAoUfT21D5Ew==}
+    cpu: [loong64]
+    os: [linux]
+    libc: [musl]
+
+  '@unrs/resolver-binding-linux-ppc64-gnu@1.12.2':
+    resolution: {integrity: sha512-q7xRvVpmcfeL+LlZg8Pbbo6QaTZwDU5BaGZbwfhkEsXJn3Was8xYfE0RBH266xZt0rM6B7i8xAYIvjthuUIWHg==}
+    cpu: [ppc64]
+    os: [linux]
+    libc: [glibc]
+
+  '@unrs/resolver-binding-linux-riscv64-gnu@1.12.2':
+    resolution: {integrity: sha512-0CVdx6lcnT3Q9inOH8tsMIOJ6ImndllMjqJHg8RLVdB7Vq4SfkEXl9mCSsVNuNA4MCYycRicCUxPCabVHJRr6A==}
+    cpu: [riscv64]
+    os: [linux]
+    libc: [glibc]
+
+  '@unrs/resolver-binding-linux-riscv64-musl@1.12.2':
+    resolution: {integrity: sha512-iOwlRo9vnp6R6ohHQS11n0NnfdXx/omhkocmIfaPRpQhKZ+3BDMkkdRVh53qjkFkpPddf+FETA28NwGN7l5l+w==}
+    cpu: [riscv64]
+    os: [linux]
+    libc: [musl]
+
+  '@unrs/resolver-binding-linux-s390x-gnu@1.12.2':
+    resolution: {integrity: sha512-HYJtLfXq94q8iZNFT1lknx258wlkkWhZeUXJRqzKBBUJ00CvZ+N33zgbCqimLjsyw5Va6uUxhVa12mI+kaveEw==}
+    cpu: [s390x]
+    os: [linux]
+    libc: [glibc]
+
+  '@unrs/resolver-binding-linux-x64-gnu@1.12.2':
+    resolution: {integrity: sha512-mPsUhunKKDih5O96Y6enDQyHc1SqBPlY1E/SfMWDM3EdJ95Z9CArPeCVwCCqbP45ljvivdEk8Fxn+SIb1rDAJQ==}
+    cpu: [x64]
+    os: [linux]
+    libc: [glibc]
+
+  '@unrs/resolver-binding-linux-x64-musl@1.12.2':
+    resolution: {integrity: sha512-azrt6+5ydLd8Vt210AAFis/lZevSfPw93EJRIJG+xPu4WCJ8K0kppCTpMyLPcKT7H15M4Jnt2tMp5bOvCkRC6A==}
+    cpu: [x64]
+    os: [linux]
+    libc: [musl]
+
+  '@unrs/resolver-binding-openharmony-arm64@1.12.2':
+    resolution: {integrity: sha512-YZ9hP4O0X9PQb8eO980qmLNGH4zT3I9+SZTdt0Pr0YyuGQhYKoOZkV02VzrzyOZJ5xIJ3UFIenKkUkGg8GjgWQ==}
+    cpu: [arm64]
+    os: [openharmony]
+
+  '@unrs/resolver-binding-wasm32-wasi@1.12.2':
+    resolution: {integrity: sha512-tYFDIkMxSflfEc/h92ZWNsZlHSwgimbNHSO3PL2JWQHfCuC2q316jMyYU9TIWZsFK2bQwyK5VAdYgn8ygPj69A==}
+    engines: {node: '>=14.0.0'}
+    cpu: [wasm32]
+
+  '@unrs/resolver-binding-win32-arm64-msvc@1.12.2':
+    resolution: {integrity: sha512-qzNyg3xL0VPQmCaUh+N5jSitce6k+uCBfMDesWRnlULOZaqUkaJ0ybdT+UqlAWJoQjuqfIU/0Ptx9bteN4D82g==}
+    cpu: [arm64]
+    os: [win32]
+
+  '@unrs/resolver-binding-win32-ia32-msvc@1.12.2':
+    resolution: {integrity: sha512-WD9sY00OfpHVGfsnHZoA8jVT+esS/Bg8z8jzxp5BnDCjjwsuKsPQrzswwpFy4J1AUJbXPRfkpcX0mXrzeXW79g==}
+    cpu: [ia32]
+    os: [win32]
+
+  '@unrs/resolver-binding-win32-x64-msvc@1.12.2':
+    resolution: {integrity: sha512-nAB74NfSNKknqQ1RrYj6uz8FcXEomu/MATJZxh/x+BArzN2U3JbOYC0APYzUIGhVY3m5hRxA8VPNdPBoG8txlA==}
+    cpu: [x64]
+    os: [win32]
+
+  '@vitest/expect@4.1.10':
+    resolution: {integrity: sha512-YsCn+qAk1GWjQOWFEsEcL2gNQ0zmVmQu3T03qP6UyjhtmdtwtbuI+DASn/7iQB3HGTXkdBwGddzxPlmiql5vlA==}
+
+  '@vitest/mocker@4.1.10':
+    resolution: {integrity: sha512-v0xaezt+DKEmKfaxg133ldzADrwLGd7Ze1MfQQTYfvs8OqZIwbxyxaYURivwV7sWy5fqn3rH5uOrSp07bp44Ow==}
+    peerDependencies:
+      msw: ^2.4.9
+      vite: ^6.0.0 || ^7.0.0 || ^8.0.0
+    peerDependenciesMeta:
+      msw:
+        optional: true
+      vite:
+        optional: true
+
+  '@vitest/pretty-format@4.1.10':
+    resolution: {integrity: sha512-W1HsjSH4MXQ9YfmmhLAoIYf1HRfekQCGngeIgcei6MP5QQGWUe0gkopdZQaVCFO+JDJMrAJGwa5pRpNpvy4P8Q==}
+
+  '@vitest/runner@4.1.10':
+    resolution: {integrity: sha512-IKI6kpIH+LmpROplyLwBBaCfMgOZOMsygVa6BARD6ahA04VRuJSa6OaVG7kRvSEMD870Vd91rSSw0eegtWyLGg==}
+
+  '@vitest/snapshot@4.1.10':
+    resolution: {integrity: sha512-xRkfOT1qpTAi/Ti4Y1LtfRc3kEuqxGw59eN2jN9pRWMtS/XDevekhcFSqvQqjUNGksfjMJu3Y+oJ+4Ypn2OaJw==}
+
+  '@vitest/spy@4.1.10':
+    resolution: {integrity: sha512-PLf/Ugvoq5wO/b4rwYCR1h2PSIdXz7wnkQFMiUpLdtM7l6pqVFcQIBEHyT1+l+cj7mNwAfZHzqXqDyjvOuwbDw==}
+
+  '@vitest/utils@4.1.10':
+    resolution: {integrity: sha512-fy9am/HWxbaGt/Sawrp90vt6Y6jQwf1RX77cz3uwoJwJVMli/e1IEwRPnMNJ7vKfPTwo0diXifkpPvwH9v7nGA==}
+
+  acorn-jsx@5.3.2:
+    resolution: {integrity: sha512-rq9s+JNhf0IChjtDXxllJ7g41oZk5SlXtp0LHwyA5cejwn7vKmKp4pPri6YEePv2PU65sAsegbXtIinmDFDXgQ==}
+    peerDependencies:
+      acorn: ^6.0.0 || ^7.0.0 || ^8.0.0
+
+  acorn@8.17.0:
+    resolution: {integrity: sha512-xRQbDb9BnwDafYNn6Vwl839DYVjqXYb1XVGtWAZ1kcDc6iwAL4hg3B1dZlRiuENFeO2H53gFG3in621AdERVAg==}
+    engines: {node: '>=0.4.0'}
+    hasBin: true
+
+  ajv@6.15.0:
+    resolution: {integrity: sha512-fgFx7Hfoq60ytK2c7DhnF8jIvzYgOMxfugjLOSMHjLIPgenqa7S7oaagATUq99mV6IYvN2tRmC0wnTYX6iPbMw==}
+
+  ajv@8.20.0:
+    resolution: {integrity: sha512-Thbli+OlOj+iMPYFBVBfJ3OmCAnaSyNn4M1vz9T6Gka5Jt9ba/HIR56joy65tY6kx/FCF5VXNB819Y7/GUrBGA==}
+
+  ansi-regex@5.0.1:
+    resolution: {integrity: sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==}
+    engines: {node: '>=8'}
+
+  ansi-styles@4.3.0:
+    resolution: {integrity: sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==}
+    engines: {node: '>=8'}
+
+  argon2@0.44.0:
+    resolution: {integrity: sha512-zHPGN3S55sihSQo0dBbK0A5qpi2R31z7HZDZnry3ifOyj8bZZnpZND2gpmhnRGO1V/d555RwBqIK5W4Mrmv3ig==}
+    engines: {node: '>=16.17.0'}
+
+  argparse@2.0.1:
+    resolution: {integrity: sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==}
+
+  aria-query@5.3.2:
+    resolution: {integrity: sha512-COROpnaoap1E2F000S62r6A60uHZnmlvomhfyT2DlTcrY1OrBKn2UhH7qn5wTC9zMvD0AY7csdPSNwKP+7WiQw==}
+    engines: {node: '>= 0.4'}
+
+  array-buffer-byte-length@1.0.2:
+    resolution: {integrity: sha512-LHE+8BuR7RYGDKvnrmcuSq3tDcKv9OFEXQt/HpbZhY7V6h0zlUXutnAD82GiFx9rdieCMjkvtcsPqBwgUl1Iiw==}
+    engines: {node: '>= 0.4'}
+
+  array-includes@3.1.9:
+    resolution: {integrity: sha512-FmeCCAenzH0KH381SPT5FZmiA/TmpndpcaShhfgEN9eCVjnFBqq3l1xrI42y8+PPLI6hypzou4GXw00WHmPBLQ==}
+    engines: {node: '>= 0.4'}
+
+  array.prototype.findlast@1.2.5:
+    resolution: {integrity: sha512-CVvd6FHg1Z3POpBLxO6E6zr+rSKEQ9L6rZHAaY7lLfhKsWYUBBOuMs0e9o24oopj6H+geRCX0YJ+TJLBK2eHyQ==}
+    engines: {node: '>= 0.4'}
+
+  array.prototype.findlastindex@1.2.6:
+    resolution: {integrity: sha512-F/TKATkzseUExPlfvmwQKGITM3DGTK+vkAsCZoDc5daVygbJBnjEUCbgkAvVFsgfXfX4YIqZ/27G3k3tdXrTxQ==}
+    engines: {node: '>= 0.4'}
+
+  array.prototype.flat@1.3.3:
+    resolution: {integrity: sha512-rwG/ja1neyLqCuGZ5YYrznA62D4mZXg0i1cIskIUKSiqF3Cje9/wXAls9B9s1Wa2fomMsIv8czB8jZcPmxCXFg==}
+    engines: {node: '>= 0.4'}
+
+  array.prototype.flatmap@1.3.3:
+    resolution: {integrity: sha512-Y7Wt51eKJSyi80hFrJCePGGNo5ktJCslFuboqJsbf57CCPcm5zztluPlc4/aD8sWsKvlwatezpV4U1efk8kpjg==}
+    engines: {node: '>= 0.4'}
+
+  array.prototype.tosorted@1.1.4:
+    resolution: {integrity: sha512-p6Fx8B7b7ZhL/gmUsAy0D15WhvDccw3mnGNbZpi3pmeJdxtWsj2jEaI4Y6oo3XiHfzuSgPwKc04MYt6KgvC/wA==}
+    engines: {node: '>= 0.4'}
+
+  arraybuffer.prototype.slice@1.0.4:
+    resolution: {integrity: sha512-BNoCY6SXXPQ7gF2opIP4GBE+Xw7U+pHMYKuzjgCN3GwiaIR09UUeKfheyIry77QtrCBlC0KK0q5/TER/tYh3PQ==}
+    engines: {node: '>= 0.4'}
+
+  assertion-error@2.0.1:
+    resolution: {integrity: sha512-Izi8RQcffqCeNVgFigKli1ssklIbpHnCYc6AknXGYoB6grJqyeby7jv12JUQgmTAnIDnbck1uxksT4dzN3PWBA==}
+    engines: {node: '>=12'}
+
+  ast-types-flow@0.0.8:
+    resolution: {integrity: sha512-OH/2E5Fg20h2aPrbe+QL8JZQFko0YZaF+j4mnQ7BGhfavO7OpSLa8a0y9sBwomHdSbkhTS8TQNayBfnW5DwbvQ==}
+
+  async-function@1.0.0:
+    resolution: {integrity: sha512-hsU18Ae8CDTR6Kgu9DYf0EbCr/a5iGL0rytQDobUcdpYOKokk8LEjVphnXkDkgpi0wYVsqrXuP0bZxJaTqdgoA==}
+    engines: {node: '>= 0.4'}
+
+  available-typed-arrays@1.0.7:
+    resolution: {integrity: sha512-wvUjBtSGN7+7SjNpq/9M2Tg350UZD3q62IFZLbRAR1bSMlCo1ZaeW+BJ+D090e4hIIZLBcTDWe4Mh4jvUDajzQ==}
+    engines: {node: '>= 0.4'}
+
+  aws-ssl-profiles@1.1.2:
+    resolution: {integrity: sha512-NZKeq9AfyQvEeNlN0zSYAaWrmBffJh3IELMZfRpJVWgrpEbtEpnjvzqBPf+mxoI287JohRDoa+/nsfqqiZmF6g==}
+    engines: {node: '>= 6.0.0'}
+
+  axe-core@4.12.1:
+    resolution: {integrity: sha512-s7iGf5GaVMxEG0ENN9x+xTr7GFZCb1ZP/1uATUpCEK2X78nDB3RwbtFCo9pGAf9ru+VwoQ464DkaLEeRM08wJA==}
+    engines: {node: '>=4'}
+
+  axobject-query@4.1.0:
+    resolution: {integrity: sha512-qIj0G9wZbMGNLjLmg1PT6v2mE9AH2zlnADJD/2tC6E00hgmhUOfEB6greHPAfLRSufHqROIUTkw6E+M3lH0PTQ==}
+    engines: {node: '>= 0.4'}
+
+  balanced-match@1.0.2:
+    resolution: {integrity: sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==}
+
+  balanced-match@4.0.4:
+    resolution: {integrity: sha512-BLrgEcRTwX2o6gGxGOCNyMvGSp35YofuYzw9h1IMTRmKqttAZZVU67bdb9Pr2vUHA8+j3i2tJfjO6C6+4myGTA==}
+    engines: {node: 18 || 20 || >=22}
+
+  baseline-browser-mapping@2.10.43:
+    resolution: {integrity: sha512-AjYpR78kDWAY3Efj+cDTFH9t9SCoL7OoTp1BOb0mQV7S+6CiLwnWM3FyxhJtdPufDFKzmCSFoUncKjWgJEZTCQ==}
+    engines: {node: '>=6.0.0'}
+    hasBin: true
+
+  better-result@2.9.2:
+    resolution: {integrity: sha512-WIFoBPCdnTOdk9inkE1ZRvCZ4P0CpSkAiLlchC65N7n9DcjZ3NhqkBOlafzpOVnO8ixyi37kicmSJ3ENhPZl7Q==}
+
+  brace-expansion@1.1.16:
+    resolution: {integrity: sha512-IDw48K2/2kRkg9LdJxurvq3lV3aBgq0REY89duEqFRthjlPdXHKMj7EnQOXVckxzgisinf3nHfrcE2FufFLXMw==}
+
+  brace-expansion@5.0.7:
+    resolution: {integrity: sha512-7oFy703dxfY3/NLxC1fh2SUCQ0H9rmAY+5EpDVfXjUTTs+HEwR2nYaqLv+GWcTsumwxPfiz6CzCNkwXwBUwqCA==}
+    engines: {node: 18 || 20 || >=22}
+
+  braces@3.0.3:
+    resolution: {integrity: sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==}
+    engines: {node: '>=8'}
+
+  browserslist@4.28.6:
+    resolution: {integrity: sha512-FQBYNK15VMslhLHpA7+n+n1GOlF1kId2xcCg7/j95f24AOF6VDYMNH4mFxF7KuaTdv627faazpOAjFzMrfJOUw==}
+    engines: {node: ^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7}
+    hasBin: true
+
+  c12@3.3.4:
+    resolution: {integrity: sha512-cM0ApFQSBXuourJejzwv/AuPRvAxordTyParRVcHjjtXirtkzM0uK2L9TTn9s0cXZbG7E55jCivRQzoxYmRAlA==}
+    peerDependencies:
+      magicast: '*'
+    peerDependenciesMeta:
+      magicast:
+        optional: true
+
+  call-bind-apply-helpers@1.0.2:
+    resolution: {integrity: sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==}
+    engines: {node: '>= 0.4'}
+
+  call-bind@1.0.9:
+    resolution: {integrity: sha512-a/hy+pNsFUTR+Iz8TCJvXudKVLAnz/DyeSUo10I5yvFDQJBFU2s9uqQpoSrJlroHUKoKqzg+epxyP9lqFdzfBQ==}
+    engines: {node: '>= 0.4'}
+
+  call-bound@1.0.4:
+    resolution: {integrity: sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==}
+    engines: {node: '>= 0.4'}
+
+  callsites@3.1.0:
+    resolution: {integrity: sha512-P8BjAsXvZS+VIDUI11hHCQEv74YT67YUi5JJFNWIqL235sBmjX4+qx9Muvls5ivyNENctx46xQLQ3aTuE7ssaQ==}
+    engines: {node: '>=6'}
+
+  caniuse-lite@1.0.30001806:
+    resolution: {integrity: sha512-72Cuvd95zbSYPKq6Fhg8eDJRlzgWDf7/mtoZv6Qe/DYNCEBdNxoA3+rZAU2ZhGCpZlns3EssFavaZomckT5Uuw==}
+
+  chai@6.2.2:
+    resolution: {integrity: sha512-NUPRluOfOiTKBKvWPtSD4PhFvWCqOi0BGStNWs57X9js7XGTprSmFoz5F0tWhR4WPjNeR9jXqdC7/UpSJTnlRg==}
+    engines: {node: '>=18'}
+
+  chalk@4.1.2:
+    resolution: {integrity: sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==}
+    engines: {node: '>=10'}
+
+  chart.js@4.5.1:
+    resolution: {integrity: sha512-GIjfiT9dbmHRiYi6Nl2yFCq7kkwdkp1W/lp2J99rX0yo9tgJGn3lKQATztIjb5tVtevcBtIdICNWqlq5+E8/Pw==}
+    engines: {pnpm: '>=8'}
+
+  chokidar@5.0.0:
+    resolution: {integrity: sha512-TQMmc3w+5AxjpL8iIiwebF73dRDF4fBIieAqGn9RGCWaEVwQ6Fb2cGe31Yns0RRIzii5goJ1Y7xbMwo1TxMplw==}
+    engines: {node: '>= 20.19.0'}
+
+  client-only@0.0.1:
+    resolution: {integrity: sha512-IV3Ou0jSMzZrd3pZ48nLkT9DA7Ag1pnPzaiQhpW7c3RbcqqzvzzVu+L8gfqMp/8IM2MQtSiqaCxrrcfu8I8rMA==}
+
+  cliui@8.0.1:
+    resolution: {integrity: sha512-BSeNnyus75C4//NQ9gQt1/csTXyo/8Sb+afLAkzAptFuMsod9HFokGNudZpi/oQV73hnVK+sR+5PVRMd+Dr7YQ==}
+    engines: {node: '>=12'}
+
+  color-convert@2.0.1:
+    resolution: {integrity: sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==}
+    engines: {node: '>=7.0.0'}
+
+  color-name@1.1.4:
+    resolution: {integrity: sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==}
+
+  concat-map@0.0.1:
+    resolution: {integrity: sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg==}
+
+  confbox@0.2.4:
+    resolution: {integrity: sha512-ysOGlgTFbN2/Y6Cg3Iye8YKulHw+R2fNXHrgSmXISQdMnomY6eNDprVdW9R5xBguEqI954+S6709UyiO7B+6OQ==}
+
+  convert-source-map@2.0.0:
+    resolution: {integrity: sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==}
+
+  cosmiconfig@8.3.6:
+    resolution: {integrity: sha512-kcZ6+W5QzcJ3P1Mt+83OUv/oHFqZHIx8DuxG6eZ5RGMERoLqp4BuGjhHLYGK+Kf5XVkQvqBSmAy/nGWN3qDgEA==}
+    engines: {node: '>=14'}
+    peerDependencies:
+      typescript: '>=4.9.5'
+    peerDependenciesMeta:
+      typescript:
+        optional: true
+
+  cross-env@10.1.0:
+    resolution: {integrity: sha512-GsYosgnACZTADcmEyJctkJIoqAhHjttw7RsFrVoJNXbsWWqaq6Ym+7kZjq6mS45O0jij6vtiReppKQEtqWy6Dw==}
+    engines: {node: '>=20'}
+    hasBin: true
+
+  cross-spawn@7.0.6:
+    resolution: {integrity: sha512-uV2QOWP2nWzsy2aMp8aRibhi9dlzF5Hgh5SHaB9OiTGEyDTiJJyx0uy51QXdyWbtAHNua4XJzUKca3OzKUd3vA==}
+    engines: {node: '>= 8'}
+
+  csstype@3.2.3:
+    resolution: {integrity: sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==}
+
+  damerau-levenshtein@1.0.8:
+    resolution: {integrity: sha512-sdQSFB7+llfUcQHUQO3+B8ERRj0Oa4w9POWMI/puGtuf7gFywGmkaLCElnudfTiKZV+NvHqL0ifzdrI8Ro7ESA==}
+
+  data-view-buffer@1.0.2:
+    resolution: {integrity: sha512-EmKO5V3OLXh1rtK2wgXRansaK1/mtVdTUEiEI0W8RkvgT05kfxaH29PliLnpLP73yYO6142Q72QNa8Wx/A5CqQ==}
+    engines: {node: '>= 0.4'}
+
+  data-view-byte-length@1.0.2:
+    resolution: {integrity: sha512-tuhGbE6CfTM9+5ANGf+oQb72Ky/0+s3xKUpHvShfiz2RxMFgFPjsXuRLBVMtvMs15awe45SRb83D6wH4ew6wlQ==}
+    engines: {node: '>= 0.4'}
+
+  data-view-byte-offset@1.0.1:
+    resolution: {integrity: sha512-BS8PfmtDGnrgYdOonGZQdLZslWIeCGFP9tpan0hi1Co2Zr2NKADsvGYA8XxuG/4UWgJ6Cjtv+YJnB6MM69QGlQ==}
+    engines: {node: '>= 0.4'}
+
+  debug@3.2.7:
+    resolution: {integrity: sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==}
+    peerDependencies:
+      supports-color: '*'
+    peerDependenciesMeta:
+      supports-color:
+        optional: true
+
+  debug@4.4.3:
+    resolution: {integrity: sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==}
+    engines: {node: '>=6.0'}
+    peerDependencies:
+      supports-color: '*'
+    peerDependenciesMeta:
+      supports-color:
+        optional: true
+
+  decimal.js@10.6.0:
+    resolution: {integrity: sha512-YpgQiITW3JXGntzdUmyUR1V812Hn8T1YVXhCu+wO3OpS4eU9l4YdD3qjyiKdV6mvV29zapkMeD390UVEf2lkUg==}
+
+  deep-is@0.1.4:
+    resolution: {integrity: sha512-oIPzksmTg4/MriiaYGO+okXDT7ztn/w3Eptv/+gSIdMdKsJo0u4CfYNFJPy+4SKMuCqGw2wxnA+URMg3t8a/bQ==}
+
+  deepmerge-ts@7.1.5:
+    resolution: {integrity: sha512-HOJkrhaYsweh+W+e74Yn7YStZOilkoPb6fycpwNLKzSPtruFs48nYis0zy5yJz1+ktUhHxoRDJ27RQAWLIJVJw==}
+    engines: {node: '>=16.0.0'}
+
+  define-data-property@1.1.4:
+    resolution: {integrity: sha512-rBMvIzlpA8v6E+SJZoo++HAYqsLrkg7MSfIinMPFhmkorw7X+dOXVJQs+QT69zGkzMyfDnIMN2Wid1+NbL3T+A==}
+    engines: {node: '>= 0.4'}
+
+  define-properties@1.2.1:
+    resolution: {integrity: sha512-8QmQKqEASLd5nx0U1B1okLElbUuuttJ/AnYmRXbbbGDWh6uS208EjD4Xqq/I9wK7u0v6O08XhTWnt5XtEbR6Dg==}
+    engines: {node: '>= 0.4'}
+
+  defu@6.1.7:
+    resolution: {integrity: sha512-7z22QmUWiQ/2d0KkdYmANbRUVABpZ9SNYyH5vx6PZ+nE5bcC0l7uFvEfHlyld/HcGBFTL536ClDt3DEcSlEJAQ==}
+
+  denque@2.1.0:
+    resolution: {integrity: sha512-HVQE3AAb/pxF8fQAoiqpvg9i3evqug3hoiwakOyZAwJm+6vZehbkYXZ0l4JxS+I3QxM97v5aaRNhj8v5oBhekw==}
+    engines: {node: '>=0.10'}
+
+  destr@2.0.5:
+    resolution: {integrity: sha512-ugFTXCtDZunbzasqBxrK93Ik/DRYsO6S/fedkWEMKqt04xZ4csmnmwGDBAb07QWNaGMAmnTIemsYZCksjATwsA==}
+
+  detect-libc@2.1.2:
+    resolution: {integrity: sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==}
+    engines: {node: '>=8'}
+
+  doctrine@2.1.0:
+    resolution: {integrity: sha512-35mSku4ZXK0vfCuHEDAwt55dg2jNajHZ1odvF+8SSr82EsZY4QmXfuWso8oEd8zRhVObSN18aM0CjSdoBX7zIw==}
+    engines: {node: '>=0.10.0'}
+
+  dotenv@17.4.2:
+    resolution: {integrity: sha512-nI4U3TottKAcAD9LLud4Cb7b2QztQMUEfHbvhTH09bqXTxnSie8WnjPALV/WMCrJZ6UV/qHJ6L03OqO3LcdYZw==}
+    engines: {node: '>=12'}
+
+  dunder-proto@1.0.1:
+    resolution: {integrity: sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==}
+    engines: {node: '>= 0.4'}
+
+  effect@3.20.0:
+    resolution: {integrity: sha512-qMLfDJscrNG8p/aw+IkT9W7fgj50Z4wG5bLBy0Txsxz8iUHjDIkOgO3SV0WZfnQbNG2VJYb0b+rDLMrhM4+Krw==}
+
+  electron-to-chromium@1.5.392:
+    resolution: {integrity: sha512-1yQq3VQCZRwsnYc67Oc+1fge6Lwtn0hzi6zmEVkB61Zx21kTbwJAW4dFLadl5Rc1tKhG/kSpYXnfiAhu0f0a1g==}
+
+  emoji-regex@8.0.0:
+    resolution: {integrity: sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==}
+
+  emoji-regex@9.2.2:
+    resolution: {integrity: sha512-L18DaJsXSUk2+42pv8mLs5jJT2hqFkFE4j21wOmgbUqsZ2hL72NsUU785g9RXgo3s0ZNgVl42TiHp3ZtOv/Vyg==}
+
+  empathic@2.0.0:
+    resolution: {integrity: sha512-i6UzDscO/XfAcNYD75CfICkmfLedpyPDdozrLMmQc5ORaQcdMoc21OnlEylMIqI7U8eniKrPMxxtj8k0vhmJhA==}
+    engines: {node: '>=14'}
+
+  enhanced-resolve@5.21.6:
+    resolution: {integrity: sha512-aNnGCvbJ/RIyWo1IuhNdVjnNF+EjH9wpzpNHt+ci/m9He9LJvUN8wrCcXjp9cWsGNAuvSpVFTx/vraAFQ8qGjQ==}
+    engines: {node: '>=10.13.0'}
+
+  env-paths@3.0.0:
+    resolution: {integrity: sha512-dtJUTepzMW3Lm/NPxRf3wP4642UWhjL2sQxc+ym2YMj1m/H2zDNQOlezafzkHwn6sMstjHTwG6iQQsctDW/b1A==}
+    engines: {node: ^12.20.0 || ^14.13.1 || >=16.0.0}
+
+  error-ex@1.3.4:
+    resolution: {integrity: sha512-sqQamAnR14VgCr1A618A3sGrygcpK+HEbenA/HiEAkkUwcZIIB/tgWqHFxWgOyDh4nB4JCRimh79dR5Ywc9MDQ==}
+
+  es-abstract-get@1.0.0:
+    resolution: {integrity: sha512-6PMWXpdhshVvFp+FoWYs1EvG1Nj0tvk0dZM+XcK0xMEM1czRVcP6ohqPWHy6qPagSpC8j4+p89WXlT+xXJs/fg==}
+    engines: {node: '>= 0.4'}
+
+  es-abstract@1.24.2:
+    resolution: {integrity: sha512-2FpH9Q5i2RRwyEP1AylXe6nYLR5OhaJTZwmlcP0dL/+JCbgg7yyEo/sEK6HeGZRf3dFpWwThaRHVApXSkW3xeg==}
+    engines: {node: '>= 0.4'}
+
+  es-define-property@1.0.1:
+    resolution: {integrity: sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==}
+    engines: {node: '>= 0.4'}
+
+  es-errors@1.3.0:
+    resolution: {integrity: sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==}
+    engines: {node: '>= 0.4'}
+
+  es-iterator-helpers@1.4.0:
+    resolution: {integrity: sha512-c/A0P0oxkACDc+cKWw8evLXK83oBKgn0qPOqCYT4x9uolpCIJAcYvJC9QYKNDRPsTeGyCrQ326jrvgZWdCdK5Q==}
+    engines: {node: '>= 0.4'}
+
+  es-module-lexer@2.3.1:
+    resolution: {integrity: sha512-shc1dbU90Yl/xq1QrC7QRtfcwURZuVRfPhZbDoldJ1cn1gzDvBaBWlv0eFolj5+0znnPJz5TXLxsN77X/12KTA==}
+
+  es-object-atoms@1.1.2:
+    resolution: {integrity: sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==}
+    engines: {node: '>= 0.4'}
+
+  es-set-tostringtag@2.1.0:
+    resolution: {integrity: sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==}
+    engines: {node: '>= 0.4'}
+
+  es-shim-unscopables@1.1.0:
+    resolution: {integrity: sha512-d9T8ucsEhh8Bi1woXCf+TIKDIROLG5WCkxg8geBCbvk22kzwC5G2OnXVMO6FUsvQlgUUXQ2itephWDLqDzbeCw==}
+    engines: {node: '>= 0.4'}
+
+  es-to-primitive@1.3.4:
+    resolution: {integrity: sha512-yPDz7wqpg1/mmHLmS3tcfTfbw5f1eryXvyghYBffGdERwe+mV7ZcWzTR8LR17Kvqt3qfPurjlonmnq3MKXIOXw==}
+    engines: {node: '>= 0.4'}
+
+  esbuild@0.28.1:
+    resolution: {integrity: sha512-HrJrvZv5ayxBzPfwphOoNzkzOIIlifzk0KJrGK2c8R4+LKpMtpYLQeUdjnwjWv/LZlkH2laZk+4w78pi99D4Vw==}
+    engines: {node: '>=18'}
+    hasBin: true
+
+  escalade@3.2.0:
+    resolution: {integrity: sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==}
+    engines: {node: '>=6'}
+
+  escape-string-regexp@4.0.0:
+    resolution: {integrity: sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==}
+    engines: {node: '>=10'}
+
+  eslint-config-next@16.2.10:
+    resolution: {integrity: sha512-HSybLOY0QKf39i4FWUqPN0xWiNDi6A6UqJmZtgDkS3zMqjXTqULvj/sueXx3cdCG0mVG+qH6k5/qdegklH1d1w==}
+    peerDependencies:
+      eslint: '>=9.0.0'
+      typescript: '>=3.3.1'
+    peerDependenciesMeta:
+      typescript:
+        optional: true
+
+  eslint-import-resolver-node@0.3.10:
+    resolution: {integrity: sha512-tRrKqFyCaKict5hOd244sL6EQFNycnMQnBe+j8uqGNXYzsImGbGUU4ibtoaBmv5FLwJwcFJNeg1GeVjQfbMrDQ==}
+
+  eslint-import-resolver-typescript@3.10.1:
+    resolution: {integrity: sha512-A1rHYb06zjMGAxdLSkN2fXPBwuSaQ0iO5M/hdyS0Ajj1VBaRp0sPD3dn1FhME3c/JluGFbwSxyCfqdSbtQLAHQ==}
+    engines: {node: ^14.18.0 || >=16.0.0}
+    peerDependencies:
+      eslint: '*'
+      eslint-plugin-import: '*'
+      eslint-plugin-import-x: '*'
+    peerDependenciesMeta:
+      eslint-plugin-import:
+        optional: true
+      eslint-plugin-import-x:
+        optional: true
+
+  eslint-module-utils@2.14.0:
+    resolution: {integrity: sha512-W2WCRZ9Dqntd+2u8jJcVMV2PKulc6RdLgUUoh/yQr3uB6lo/ZOeGx11sv60/8S4QFFKNslAlWhr9u0Ef7ZW6Ig==}
+    engines: {node: '>=4'}
+    peerDependencies:
+      '@typescript-eslint/parser': '*'
+      eslint: '*'
+      eslint-import-resolver-node: '*'
+      eslint-import-resolver-typescript: '*'
+      eslint-import-resolver-webpack: '*'
+    peerDependenciesMeta:
+      '@typescript-eslint/parser':
+        optional: true
+      eslint:
+        optional: true
+      eslint-import-resolver-node:
+        optional: true
+      eslint-import-resolver-typescript:
+        optional: true
+      eslint-import-resolver-webpack:
+        optional: true
+
+  eslint-plugin-import@2.32.0:
+    resolution: {integrity: sha512-whOE1HFo/qJDyX4SnXzP4N6zOWn79WhnCUY/iDR0mPfQZO8wcYE4JClzI2oZrhBnnMUCBCHZhO6VQyoBU95mZA==}
+    engines: {node: '>=4'}
+    peerDependencies:
+      '@typescript-eslint/parser': '*'
+      eslint: ^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9
+    peerDependenciesMeta:
+      '@typescript-eslint/parser':
+        optional: true
+
+  eslint-plugin-jsx-a11y@6.10.2:
+    resolution: {integrity: sha512-scB3nz4WmG75pV8+3eRUQOHZlNSUhFNq37xnpgRkCCELU3XMvXAxLk1eqWWyE22Ki4Q01Fnsw9BA3cJHDPgn2Q==}
+    engines: {node: '>=4.0'}
+    peerDependencies:
+      eslint: ^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9
+
+  eslint-plugin-react-hooks@7.1.1:
+    resolution: {integrity: sha512-f2I7Gw6JbvCexzIInuSbZpfdQ44D7iqdWX01FKLvrPgqxoE7oMj8clOfto8U6vYiz4yd5oKu39rRSVOe1zRu0g==}
+    engines: {node: '>=18'}
+    peerDependencies:
+      eslint: ^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0-0 || ^9.0.0 || ^10.0.0
+
+  eslint-plugin-react@7.37.5:
+    resolution: {integrity: sha512-Qteup0SqU15kdocexFNAJMvCJEfa2xUKNV4CC1xsVMrIIqEy3SQ/rqyxCWNzfrd3/ldy6HMlD2e0JDVpDg2qIA==}
+    engines: {node: '>=4'}
+    peerDependencies:
+      eslint: ^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7
+
+  eslint-scope@8.4.0:
+    resolution: {integrity: sha512-sNXOfKCn74rt8RICKMvJS7XKV/Xk9kA7DyJr8mJik3S7Cwgy3qlkkmyS2uQB3jiJg6VNdZd/pDBJu0nvG2NlTg==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  eslint-visitor-keys@3.4.3:
+    resolution: {integrity: sha512-wpc+LXeiyiisxPlEkUzU6svyS1frIO3Mgxj1fdy7Pm8Ygzguax2N3Fa/D/ag1WqbOprdI+uY6wMUl8/a2G+iag==}
+    engines: {node: ^12.22.0 || ^14.17.0 || >=16.0.0}
+
+  eslint-visitor-keys@4.2.1:
+    resolution: {integrity: sha512-Uhdk5sfqcee/9H/rCOJikYz67o0a2Tw2hGRPOG2Y1R2dg7brRe1uG0yaNQDHu+TO/uQPF/5eCapvYSmHUjt7JQ==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  eslint-visitor-keys@5.0.1:
+    resolution: {integrity: sha512-tD40eHxA35h0PEIZNeIjkHoDR4YjjJp34biM0mDvplBe//mB+IHCqHDGV7pxF+7MklTvighcCPPZC7ynWyjdTA==}
+    engines: {node: ^20.19.0 || ^22.13.0 || >=24}
+
+  eslint@9.39.5:
+    resolution: {integrity: sha512-DgZS62aPLXKlnxILS/AYCoRvHaZeXceIzlXPkkGGzJWSow1aEk0lbTlxUSlyjC8jcaKxAdOnTDz+o1JFSBsyjw==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+    hasBin: true
+    peerDependencies:
+      jiti: '*'
+    peerDependenciesMeta:
+      jiti:
+        optional: true
+
+  espree@10.4.0:
+    resolution: {integrity: sha512-j6PAQ2uUr79PZhBjP5C5fhl8e39FmRnOjsD5lGnWrFU8i2G776tBK7+nP8KuQUTTyAZUwfQqXAgrVH5MbH9CYQ==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+
+  esquery@1.7.0:
+    resolution: {integrity: sha512-Ap6G0WQwcU/LHsvLwON1fAQX9Zp0A2Y6Y/cJBl9r/JbW90Zyg4/zbG6zzKa2OTALELarYHmKu0GhpM5EO+7T0g==}
+    engines: {node: '>=0.10'}
+
+  esrecurse@4.3.0:
+    resolution: {integrity: sha512-KmfKL3b6G+RXvP8N1vr3Tq1kL/oCFgn2NYXEtqP8/L3pKapUA4G8cFVaoF3SU323CD4XypR/ffioHmkti6/Tag==}
+    engines: {node: '>=4.0'}
+
+  estraverse@5.3.0:
+    resolution: {integrity: sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA==}
+    engines: {node: '>=4.0'}
+
+  estree-walker@3.0.3:
+    resolution: {integrity: sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==}
+
+  esutils@2.0.3:
+    resolution: {integrity: sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==}
+    engines: {node: '>=0.10.0'}
+
+  expect-type@1.4.0:
+    resolution: {integrity: sha512-KfYbmpRm0VbLjEvVa9yGwCi9GI34xvi7A/HXYWQO65CSD2u3MczUJSuwXKFIxlGsgBQizV9q5J9NHj4VG0n+pA==}
+    engines: {node: '>=12.0.0'}
+
+  exsolve@1.1.0:
+    resolution: {integrity: sha512-D+42+T12DdIlJM3uepa55qGiL3sYdLBOxIl2ifQCzCHz4c7eiolaHsi3BIqEr7JxBzxv2pYZQX9kw16ziMcEmw==}
+
+  fast-check@3.23.2:
+    resolution: {integrity: sha512-h5+1OzzfCC3Ef7VbtKdcv7zsstUQwUDlYpUTvjeUsJAssPgLn7QzbboPtL5ro04Mq0rPOsMzl7q5hIbRs2wD1A==}
+    engines: {node: '>=8.0.0'}
+
+  fast-deep-equal@3.1.3:
+    resolution: {integrity: sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==}
+
+  fast-glob@3.3.1:
+    resolution: {integrity: sha512-kNFPyjhh5cKjrUltxs+wFx+ZkbRaxxmZ+X0ZU31SOsxCEtP9VPgtq2teZw1DebupL5GmDaNQ6yKMMVcM41iqDg==}
+    engines: {node: '>=8.6.0'}
+
+  fast-json-stable-stringify@2.1.0:
+    resolution: {integrity: sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==}
+
+  fast-levenshtein@2.0.6:
+    resolution: {integrity: sha512-DCXu6Ifhqcks7TZKY3Hxp3y6qphY5SJZmrWMDrKcERSOXWQdMhU9Ig/PYrzyw/ul9jOIyh0N4M0tbC5hodg8dw==}
+
+  fast-uri@3.1.3:
+    resolution: {integrity: sha512-i70LwGWUduXqzicKXWshooq+sWL1K3WUU5rKZNG/0i3a1OSoX3HqhH5WbWwTmqWfor4urUakGPiRQcleRZTwOg==}
+
+  fastq@1.20.1:
+    resolution: {integrity: sha512-GGToxJ/w1x32s/D2EKND7kTil4n8OVk/9mycTc4VDza13lOvpUZTGX3mFSCtV9ksdGBVzvsyAVLM6mHFThxXxw==}
+
+  fdir@6.5.0:
+    resolution: {integrity: sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==}
+    engines: {node: '>=12.0.0'}
+    peerDependencies:
+      picomatch: ^3 || ^4
+    peerDependenciesMeta:
+      picomatch:
+        optional: true
+
+  file-entry-cache@8.0.0:
+    resolution: {integrity: sha512-XXTUwCvisa5oacNGRP9SfNtYBNAMi+RPwBFmblZEF7N7swHYQS6/Zfk7SRwx4D5j3CH211YNRco1DEMNVfZCnQ==}
+    engines: {node: '>=16.0.0'}
+
+  fill-range@7.1.1:
+    resolution: {integrity: sha512-YsGpe3WHLK8ZYi4tWDg2Jy3ebRz2rXowDxnld4bkQB00cc/1Zw9AWnC0i9ztDJitivtQvaI9KaLyKrc+hBW0yg==}
+    engines: {node: '>=8'}
+
+  find-up@5.0.0:
+    resolution: {integrity: sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==}
+    engines: {node: '>=10'}
+
+  flat-cache@4.0.1:
+    resolution: {integrity: sha512-f7ccFPK3SXFHpx15UIGyRJ/FJQctuKZ0zVuN3frBo4HnK3cay9VEW0R6yPYFHC0AgqhukPzKjq22t5DmAyqGyw==}
+    engines: {node: '>=16'}
+
+  flatted@3.4.2:
+    resolution: {integrity: sha512-PjDse7RzhcPkIJwy5t7KPWQSZ9cAbzQXcafsetQoD7sOJRQlGikNbx7yZp2OotDnJyrDcbyRq3Ttb18iYOqkxA==}
+
+  for-each@0.3.5:
+    resolution: {integrity: sha512-dKx12eRCVIzqCxFGplyFKJMPvLEWgmNtUrpTiJIR5u97zEhRG8ySrtboPHZXx7daLxQVrl643cTzbab2tkQjxg==}
+    engines: {node: '>= 0.4'}
+
+  foreground-child@3.3.1:
+    resolution: {integrity: sha512-gIXjKqtFuWEgzFRJA9WCQeSJLZDjgJUOMCMzxtvFq/37KojM1BFGufqsCy0r4qSQmYLsZYMeyRqzIWOMup03sw==}
+    engines: {node: '>=14'}
+
+  fsevents@2.3.3:
+    resolution: {integrity: sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==}
+    engines: {node: ^8.16.0 || ^10.6.0 || >=11.0.0}
+    os: [darwin]
+
+  function-bind@1.1.2:
+    resolution: {integrity: sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==}
+
+  function.prototype.name@1.2.0:
+    resolution: {integrity: sha512-jObKIik1P2QjPHP5nz5BaOtUlfgS0fWo8IUByNXkM+o+02sJOi94em77GwJKQSJ3gfPHdgzLNrHc1uokV4P/ew==}
+    engines: {node: '>= 0.4'}
+
+  functions-have-names@1.2.3:
+    resolution: {integrity: sha512-xckBUXyTIqT97tq2x2AMb+g163b5JFysYk0x4qxNFwbfQkmNZoiRHb6sPzI9/QV33WeuvVYBUIiD4NzNIyqaRQ==}
+
+  generate-function@2.3.1:
+    resolution: {integrity: sha512-eeB5GfMNeevm/GRYq20ShmsaGcmI81kIX2K9XQx5miC8KdHaC6Jm0qQ8ZNeGOi7wYB8OsdxKs+Y2oVuTFuVwKQ==}
+
+  generator-function@2.0.1:
+    resolution: {integrity: sha512-SFdFmIJi+ybC0vjlHN0ZGVGHc3lgE0DxPAT0djjVg+kjOnSqclqmj0KQ7ykTOLP6YxoqOvuAODGdcHJn+43q3g==}
+    engines: {node: '>= 0.4'}
+
+  gensync@1.0.0-beta.2:
+    resolution: {integrity: sha512-3hN7NaskYvMDLQY55gnW3NQ+mesEAepTqlg+VEbj7zzqEMBVNhzcGYYeqFo/TlYz6eQiFcp1HcsCZO+nGgS8zg==}
+    engines: {node: '>=6.9.0'}
+
+  get-caller-file@2.0.5:
+    resolution: {integrity: sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==}
+    engines: {node: 6.* || 8.* || >= 10.*}
+
+  get-intrinsic@1.3.0:
+    resolution: {integrity: sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==}
+    engines: {node: '>= 0.4'}
+
+  get-port-please@3.2.0:
+    resolution: {integrity: sha512-I9QVvBw5U/hw3RmWpYKRumUeaDgxTPd401x364rLmWBJcOQ753eov1eTgzDqRG9bqFIfDc7gfzcQEWrUri3o1A==}
+
+  get-proto@1.0.1:
+    resolution: {integrity: sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==}
+    engines: {node: '>= 0.4'}
+
+  get-symbol-description@1.1.0:
+    resolution: {integrity: sha512-w9UMqWwJxHNOvoNzSJ2oPF5wvYcvP7jUvYzhp67yEhTi17ZDBBC1z9pTdGuzjD+EFIqLSYRweZjqfiPzQ06Ebg==}
+    engines: {node: '>= 0.4'}
+
+  get-tsconfig@4.14.0:
+    resolution: {integrity: sha512-yTb+8DXzDREzgvYmh6s9vHsSVCHeC0G3PI5bEXNBHtmshPnO+S5O7qgLEOn0I5QvMy6kpZN8K1NKGyilLb93wA==}
+
+  giget@3.3.0:
+    resolution: {integrity: sha512-gzi2D96p+AMfDcmJHGDj3KJ9NRiwvlFAU5yfa3ROwWZmFUjX4P43x3BcyRaOMMLto1vUo7C+86+MFhYTl6Ryiw==}
+    hasBin: true
+
+  glob-parent@5.1.2:
+    resolution: {integrity: sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==}
+    engines: {node: '>= 6'}
+
+  glob-parent@6.0.2:
+    resolution: {integrity: sha512-XxwI8EOhVQgWp6iDL+3b0r86f4d6AX6zSU55HfB4ydCEuXLXc5FcYeOu+nnGftS4TEju/11rt4KJPTMgbfmv4A==}
+    engines: {node: '>=10.13.0'}
+
+  globals@14.0.0:
+    resolution: {integrity: sha512-oahGvuMGQlPw/ivIYBjVSrWAfWLBeku5tpPE2fOPLi+WHffIWbuh2tCjhyQhTBPMf5E9jDEH4FOmTYgYwbKwtQ==}
+    engines: {node: '>=18'}
+
+  globals@16.4.0:
+    resolution: {integrity: sha512-ob/2LcVVaVGCYN+r14cnwnoDPUufjiYgSqRhiFD0Q1iI4Odora5RE8Iv1D24hAz5oMophRGkGz+yuvQmmUMnMw==}
+    engines: {node: '>=18'}
+
+  globalthis@1.0.4:
+    resolution: {integrity: sha512-DpLKbNU4WylpxJykQujfCcwYWiV/Jhm50Goo0wrVILAv5jOr9d+H+UR3PhSCD2rCCEIg0uc+G+muBTwD54JhDQ==}
+    engines: {node: '>= 0.4'}
+
+  gopd@1.2.0:
+    resolution: {integrity: sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==}
+    engines: {node: '>= 0.4'}
+
+  graceful-fs@4.2.11:
+    resolution: {integrity: sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==}
+
+  grammex@3.1.13:
+    resolution: {integrity: sha512-LnPnhOBLEJEVKS8WFDVaA397L9Kq55Q9oSITJiVLHVdhAclfUkWzQv74KhvZHKL2Q09Pb1XdsrOsZ4LfTFFTEg==}
+
+  graphile-config@0.0.1-beta.18:
+    resolution: {integrity: sha512-uMdF9Rt8/NwT1wVXNleYgM5ro2hHDodHiKA3efJhgdU8iP+r/hksnghOHreMva0sF5tV73f4TpiELPUR0g7O9w==}
+    engines: {node: '>=16'}
+
+  graphile-worker@0.17.3:
+    resolution: {integrity: sha512-5vX/nDit7vXDw6JauGE7CpE4uYWu8XLTDkcL3msqwVRwrtxBqawL1C55INfXGtoyV1DIkWvvPdeKtXuLRGYyLg==}
+    engines: {node: '>=14.0.0', yarn: ^1.22.22}
+    hasBin: true
+
+  graphmatch@1.1.1:
+    resolution: {integrity: sha512-5ykVn/EXM1hF0XCaWh05VbYvEiOL2lY1kBxZtaYsyvjp7cmWOU1XsAdfQBwClraEofXDT197lFbXOEVMHpvQOg==}
+
+  has-bigints@1.1.0:
+    resolution: {integrity: sha512-R3pbpkcIqv2Pm3dUwgjclDRVmWpTJW2DcMzcIhEXEx1oh/CEMObMm3KLmRJOdvhM7o4uQBnwr8pzRK2sJWIqfg==}
+    engines: {node: '>= 0.4'}
+
+  has-flag@4.0.0:
+    resolution: {integrity: sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==}
+    engines: {node: '>=8'}
+
+  has-property-descriptors@1.0.2:
+    resolution: {integrity: sha512-55JNKuIW+vq4Ke1BjOTjM2YctQIvCT7GFzHwmfZPGo5wnrgkid0YQtnAleFSqumZm4az3n2BS+erby5ipJdgrg==}
+
+  has-proto@1.2.0:
+    resolution: {integrity: sha512-KIL7eQPfHQRC8+XluaIw7BHUwwqL19bQn4hzNgdr+1wXoU0KKj6rufu47lhY7KbJR2C6T6+PfyN0Ea7wkSS+qQ==}
+    engines: {node: '>= 0.4'}
+
+  has-symbols@1.1.0:
+    resolution: {integrity: sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==}
+    engines: {node: '>= 0.4'}
+
+  has-tostringtag@1.0.2:
+    resolution: {integrity: sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==}
+    engines: {node: '>= 0.4'}
+
+  hasown@2.0.4:
+    resolution: {integrity: sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==}
+    engines: {node: '>= 0.4'}
+
+  hermes-estree@0.25.1:
+    resolution: {integrity: sha512-0wUoCcLp+5Ev5pDW2OriHC2MJCbwLwuRx+gAqMTOkGKJJiBCLjtrvy4PWUGn6MIVefecRpzoOZ/UV6iGdOr+Cw==}
+
+  hermes-parser@0.25.1:
+    resolution: {integrity: sha512-6pEjquH3rqaI6cYAXYPcz9MS4rY6R4ngRgrgfDshRptUZIc3lw0MCIJIGDj9++mfySOuPTHB4nrSW99BCvOPIA==}
+
+  hono@4.12.30:
+    resolution: {integrity: sha512-emn+JoJjrN9YTpRDS5it/UI2SO9BAE37T6I3d963RxcZ81G9A4pr2SZTEiiaiKbzx+NKRg5BZ89fCL7gCJCUog==}
+    engines: {node: '>=16.9.0'}
+
+  http-status-codes@2.3.0:
+    resolution: {integrity: sha512-RJ8XvFvpPM/Dmc5SV+dC4y5PCeOhT3x1Hq0NU3rjGeg5a/CqlhZ7uudknPwZFz4aeAXDcbAyaeP7GAo9lvngtA==}
+
+  iconv-lite@0.7.3:
+    resolution: {integrity: sha512-IKXpvIzjnC9XTAUbVBcMfGS0EPaIXtW6v+zr+RRp+hqULEpo0owZax6wyRwPOJbWbzjYspQwusTsfVr0ifh4uQ==}
+    engines: {node: '>=0.10.0'}
+
+  ignore@5.3.2:
+    resolution: {integrity: sha512-hsBTNUqQTDwkWtcdYI2i06Y/nUBEsNEDJKjWdigLvegy8kDuJAS8uRlpkkcQpyEXL0Z/pjDy5HBmMjRCJ2gq+g==}
+    engines: {node: '>= 4'}
+
+  ignore@7.0.6:
+    resolution: {integrity: sha512-BAg6QkE8W+TuQLrrw0Ugr7HegXduRuuj8/ti2kSOc+jz1dmx8/WNcjr6XGnq5YpDWxFwwaavqD0+jIUOKelTsw==}
+    engines: {node: '>= 4'}
+
+  import-fresh@3.3.1:
+    resolution: {integrity: sha512-TR3KfrTZTYLPB6jUjfx6MF9WcWrHL9su5TObK4ZkYgBdWKPOFoSoQIdEuTuR82pmtxH2spWG9h6etwfr1pLBqQ==}
+    engines: {node: '>=6'}
+
+  imurmurhash@0.1.4:
+    resolution: {integrity: sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA==}
+    engines: {node: '>=0.8.19'}
+
+  internal-slot@1.1.0:
+    resolution: {integrity: sha512-4gd7VpWNQNB4UKKCFFVcp1AVv+FMOgs9NKzjHKusc8jTMhd5eL1NqQqOpE0KzMds804/yHlglp3uxgluOqAPLw==}
+    engines: {node: '>= 0.4'}
+
+  interpret@3.1.1:
+    resolution: {integrity: sha512-6xwYfHbajpoF0xLW+iwLkhwgvLoZDfjYfoFNu8ftMoXINzwuymNLd9u/KmwtdT2GbR+/Cz66otEGEVVUHX9QLQ==}
+    engines: {node: '>=10.13.0'}
+
+  is-array-buffer@3.0.5:
+    resolution: {integrity: sha512-DDfANUiiG2wC1qawP66qlTugJeL5HyzMpfr8lLK+jMQirGzNod0B12cFB/9q838Ru27sBwfw78/rdoU7RERz6A==}
+    engines: {node: '>= 0.4'}
+
+  is-arrayish@0.2.1:
+    resolution: {integrity: sha512-zz06S8t0ozoDXMG+ube26zeCTNXcKIPJZJi8hBrF4idCLms4CG9QtK7qBl1boi5ODzFpjswb5JPmHCbMpjaYzg==}
+
+  is-async-function@2.1.1:
+    resolution: {integrity: sha512-9dgM/cZBnNvjzaMYHVoxxfPj2QXt22Ev7SuuPrs+xav0ukGB0S6d4ydZdEiM48kLx5kDV+QBPrpVnFyefL8kkQ==}
+    engines: {node: '>= 0.4'}
+
+  is-bigint@1.1.0:
+    resolution: {integrity: sha512-n4ZT37wG78iz03xPRKJrHTdZbe3IicyucEtdRsV5yglwc3GyUfbAfpSeD0FJ41NbUNSt5wbhqfp1fS+BgnvDFQ==}
+    engines: {node: '>= 0.4'}
+
+  is-boolean-object@1.2.2:
+    resolution: {integrity: sha512-wa56o2/ElJMYqjCjGkXri7it5FbebW5usLw/nPmCMs5DeZ7eziSYZhSmPRn0txqeW4LnAmQQU7FgqLpsEFKM4A==}
+    engines: {node: '>= 0.4'}
+
+  is-bun-module@2.0.0:
+    resolution: {integrity: sha512-gNCGbnnnnFAUGKeZ9PdbyeGYJqewpmc2aKHUEMO5nQPWU9lOmv7jcmQIv+qHD8fXW6W7qfuCwX4rY9LNRjXrkQ==}
+
+  is-callable@1.2.7:
+    resolution: {integrity: sha512-1BC0BVFhS/p0qtw6enp8e+8OD0UrK0oFLztSjNzhcKA3WDuJxxAPXzPuPtKkjEY9UUoEWlX/8fgKeu2S8i9JTA==}
+    engines: {node: '>= 0.4'}
+
+  is-core-module@2.16.2:
+    resolution: {integrity: sha512-evOr8xfXKxE6qSR0hSXL2r3sd7ALj8+7jQEUvPYcm5sgZFdJ+AYzT6yNmJenvIYQBgIGwfwz08sL8zoL7yq2BA==}
+    engines: {node: '>= 0.4'}
+
+  is-data-view@1.0.2:
+    resolution: {integrity: sha512-RKtWF8pGmS87i2D6gqQu/l7EYRlVdfzemCJN/P3UOs//x1QE7mfhvzHIApBTRf7axvT6DMGwSwBXYCT0nfB9xw==}
+    engines: {node: '>= 0.4'}
+
+  is-date-object@1.1.0:
+    resolution: {integrity: sha512-PwwhEakHVKTdRNVOw+/Gyh0+MzlCl4R6qKvkhuvLtPMggI1WAHt9sOwZxQLSGpUaDnrdyDsomoRgNnCfKNSXXg==}
+    engines: {node: '>= 0.4'}
+
+  is-document.all@1.0.0:
+    resolution: {integrity: sha512-+XSoyS05OdBbhFuELhgTCpFNHkpBOJqtsZfUFFpe5QTw+9Sjbh8zitxhQkYAo6wV7e1Vb8cAPvpCk9jGam/82g==}
+    engines: {node: '>= 0.4'}
+
+  is-extglob@2.1.1:
+    resolution: {integrity: sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==}
+    engines: {node: '>=0.10.0'}
+
+  is-finalizationregistry@1.1.1:
+    resolution: {integrity: sha512-1pC6N8qWJbWoPtEjgcL2xyhQOP491EQjeUo3qTKcmV8YSDDJrOepfG8pcC7h/QgnQHYSv0mJ3Z/ZWxmatVrysg==}
+    engines: {node: '>= 0.4'}
+
+  is-fullwidth-code-point@3.0.0:
+    resolution: {integrity: sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==}
+    engines: {node: '>=8'}
+
+  is-generator-function@1.1.2:
+    resolution: {integrity: sha512-upqt1SkGkODW9tsGNG5mtXTXtECizwtS2kA161M+gJPc1xdb/Ax629af6YrTwcOeQHbewrPNlE5Dx7kzvXTizA==}
+    engines: {node: '>= 0.4'}
+
+  is-glob@4.0.3:
+    resolution: {integrity: sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==}
+    engines: {node: '>=0.10.0'}
+
+  is-map@2.0.3:
+    resolution: {integrity: sha512-1Qed0/Hr2m+YqxnM09CjA2d/i6YZNfF6R2oRAOj36eUdS6qIV/huPJNSEpKbupewFs+ZsJlxsjjPbc0/afW6Lw==}
+    engines: {node: '>= 0.4'}
+
+  is-negative-zero@2.0.3:
+    resolution: {integrity: sha512-5KoIu2Ngpyek75jXodFvnafB6DJgr3u8uuK0LEZJjrU19DrMD3EVERaR8sjz8CCGgpZvxPl9SuE1GMVPFHx1mw==}
+    engines: {node: '>= 0.4'}
+
+  is-number-object@1.1.1:
+    resolution: {integrity: sha512-lZhclumE1G6VYD8VHe35wFaIif+CTy5SJIi5+3y4psDgWu4wPDoBhF8NxUOinEc7pHgiTsT6MaBb92rKhhD+Xw==}
+    engines: {node: '>= 0.4'}
+
+  is-number@7.0.0:
+    resolution: {integrity: sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==}
+    engines: {node: '>=0.12.0'}
+
+  is-property@1.0.2:
+    resolution: {integrity: sha512-Ks/IoX00TtClbGQr4TWXemAnktAQvYB7HzcCxDGqEZU6oCmb2INHuOoKxbtR+HFkmYWBKv/dOZtGRiAjDhj92g==}
+
+  is-regex@1.2.1:
+    resolution: {integrity: sha512-MjYsKHO5O7mCsmRGxWcLWheFqN9DJ/2TmngvjKXihe6efViPqc274+Fx/4fYj/r03+ESvBdTXK0V6tA3rgez1g==}
+    engines: {node: '>= 0.4'}
+
+  is-set@2.0.3:
+    resolution: {integrity: sha512-iPAjerrse27/ygGLxw+EBR9agv9Y6uLeYVJMu+QNCoouJ1/1ri0mGrcWpfCqFZuzzx3WjtwxG098X+n4OuRkPg==}
+    engines: {node: '>= 0.4'}
+
+  is-shared-array-buffer@1.0.4:
+    resolution: {integrity: sha512-ISWac8drv4ZGfwKl5slpHG9OwPNty4jOWPRIhBpxOoD+hqITiwuipOQ2bNthAzwA3B4fIjO4Nln74N0S9byq8A==}
+    engines: {node: '>= 0.4'}
+
+  is-string@1.1.1:
+    resolution: {integrity: sha512-BtEeSsoaQjlSPBemMQIrY1MY0uM6vnS1g5fmufYOtnxLGUZM2178PKbhsk7Ffv58IX+ZtcvoGwccYsh0PglkAA==}
+    engines: {node: '>= 0.4'}
+
+  is-symbol@1.1.1:
+    resolution: {integrity: sha512-9gGx6GTtCQM73BgmHQXfDmLtfjjTUDSyoxTCbp5WtoixAhfgsDirWIcVQ/IHpvI5Vgd5i/J5F7B9cN/WlVbC/w==}
+    engines: {node: '>= 0.4'}
+
+  is-typed-array@1.1.15:
+    resolution: {integrity: sha512-p3EcsicXjit7SaskXHs1hA91QxgTw46Fv6EFKKGS5DRFLD8yKnohjF3hxoju94b/OcMZoQukzpPpBE9uLVKzgQ==}
+    engines: {node: '>= 0.4'}
+
+  is-weakmap@2.0.2:
+    resolution: {integrity: sha512-K5pXYOm9wqY1RgjpL3YTkF39tni1XajUIkawTLUo9EZEVUFga5gSQJF8nNS7ZwJQ02y+1YCNYcMh+HIf1ZqE+w==}
+    engines: {node: '>= 0.4'}
+
+  is-weakref@1.1.1:
+    resolution: {integrity: sha512-6i9mGWSlqzNMEqpCp93KwRS1uUOodk2OJ6b+sq7ZPDSy2WuI5NFIxp/254TytR8ftefexkWn5xNiHUNpPOfSew==}
+    engines: {node: '>= 0.4'}
+
+  is-weakset@2.0.4:
+    resolution: {integrity: sha512-mfcwb6IzQyOKTs84CQMrOwW4gQcaTOAWJ0zzJCl2WSPDrWk/OzDaImWFH3djXhb24g4eudZfLRozAvPGw4d9hQ==}
+    engines: {node: '>= 0.4'}
+
+  isarray@2.0.5:
+    resolution: {integrity: sha512-xHjhDr3cNBK0BzdUJSPXZntQUx/mwMS5Rw4A7lPJ90XGAO6ISP/ePDNuo0vhqOZU+UD5JoodwCAAoZQd3FeAKw==}
+
+  isexe@2.0.0:
+    resolution: {integrity: sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw==}
+
+  iterator.prototype@1.1.5:
+    resolution: {integrity: sha512-H0dkQoCa3b2VEeKQBOxFph+JAbcrQdE7KC0UkqwpLmv2EC4P41QXP+rqo9wYodACiG5/WM5s9oDApTU8utwj9g==}
+    engines: {node: '>= 0.4'}
+
+  jiti@2.7.0:
+    resolution: {integrity: sha512-AC/7JofJvZGrrneWNaEnJeOLUx+JlGt7tNa0wZiRPT4MY1wmfKjt2+6O2p2uz2+skll8OZZmJMNqeke7kKbNgQ==}
+    hasBin: true
+
+  jose@6.2.3:
+    resolution: {integrity: sha512-YYVDInQKFJfR/xa3ojUTl8c2KoTwiL1R5Wg9YCydwH0x0B9grbzlg5HC7mMjCtUJjbQ/YnGEZIhI5tCgfTb4Hw==}
+
+  js-tokens@4.0.0:
+    resolution: {integrity: sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==}
+
+  js-yaml@4.3.0:
+    resolution: {integrity: sha512-1td788aAnnZ5qs7V2QIRl1owjtYpbKt749Y3xauqQgwIIGF/xXWz1wMTEBx5O3LK3lXLVuqXPdPxj2BoFHaW9Q==}
+    hasBin: true
+
+  jsesc@3.1.0:
+    resolution: {integrity: sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA==}
+    engines: {node: '>=6'}
+    hasBin: true
+
+  json-buffer@3.0.1:
+    resolution: {integrity: sha512-4bV5BfR2mqfQTJm+V5tPPdf+ZpuhiIvTuAB5g8kcrXOZpTT/QwwVRWBywX1ozr6lEuPdbHxwaJlm9G6mI2sfSQ==}
+
+  json-parse-even-better-errors@2.3.1:
+    resolution: {integrity: sha512-xyFwyhro/JEof6Ghe2iz2NcXoj2sloNsWr/XsERDK/oiPCfaNhl5ONfp+jQdAZRQQ0IJWNzH9zIZF7li91kh2w==}
+
+  json-schema-traverse@0.4.1:
+    resolution: {integrity: sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg==}
+
+  json-schema-traverse@1.0.0:
+    resolution: {integrity: sha512-NM8/P9n3XjXhIZn1lLhkFaACTOURQXjWhV4BA/RnOv8xvgqtqpAX9IO4mRQxSx1Rlo4tqzeqb0sOlruaOy3dug==}
+
+  json-stable-stringify-without-jsonify@1.0.1:
+    resolution: {integrity: sha512-Bdboy+l7tA3OGW6FjyFHWkP5LuByj1Tk33Ljyq0axyzdk9//JSi2u3fP1QSmd1KNwq6VOKYGlAu87CisVir6Pw==}
+
+  json5@1.0.2:
+    resolution: {integrity: sha512-g1MWMLBiz8FKi1e4w0UyVL3w+iJceWAFBAaBnnGKOpNa5f8TLktkbre1+s6oICydWAm+HRUGTmI+//xv2hvXYA==}
+    hasBin: true
+
+  json5@2.2.3:
+    resolution: {integrity: sha512-XmOWe7eyHYH14cLdVPoyg+GOH3rYX++KpzrylJwSW98t3Nk+U8XOl8FWKOgwtzdb8lXGf6zYwDUzeHMWfxasyg==}
+    engines: {node: '>=6'}
+    hasBin: true
+
+  jsx-ast-utils@3.3.5:
+    resolution: {integrity: sha512-ZZow9HBI5O6EPgSJLUb8n2NKgmVWTwCvHGwFuJlMjvLFqlGG6pjirPhtdsseaLZjSibD8eegzmYpUZwoIlj2cQ==}
+    engines: {node: '>=4.0'}
+
+  keyv@4.5.4:
+    resolution: {integrity: sha512-oxVHkHR/EJf2CNXnWxRLW6mg7JyCCUcG0DtEGmL2ctUo1PNTin1PUil+r/+4r5MpVgC/fn1kjsx7mjSujKqIpw==}
+
+  language-subtag-registry@0.3.23:
+    resolution: {integrity: sha512-0K65Lea881pHotoGEa5gDlMxt3pctLi2RplBb7Ezh4rRdLEOtgi7n4EwK9lamnUCkKBqaeKRVebTq6BAxSkpXQ==}
+
+  language-tags@1.0.9:
+    resolution: {integrity: sha512-MbjN408fEndfiQXbFQ1vnd+1NoLDsnQW41410oQBXiyXDMYH5z505juWa4KUE1LqxRC7DgOgZDbKLxHIwm27hA==}
+    engines: {node: '>=0.10'}
+
+  levn@0.4.1:
+    resolution: {integrity: sha512-+bT2uH4E5LGE7h/n3evcS/sQlJXCpIp6ym8OWJ5eV6+67Dsql/LaaT7qJBAt2rzfoa/5QBGBhxDix1dMt2kQKQ==}
+    engines: {node: '>= 0.8.0'}
+
+  lightningcss-android-arm64@1.32.0:
+    resolution: {integrity: sha512-YK7/ClTt4kAK0vo6w3X+Pnm0D2cf2vPHbhOXdoNti1Ga0al1P4TBZhwjATvjNwLEBCnKvjJc2jQgHXH0NEwlAg==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [arm64]
+    os: [android]
+
+  lightningcss-darwin-arm64@1.32.0:
+    resolution: {integrity: sha512-RzeG9Ju5bag2Bv1/lwlVJvBE3q6TtXskdZLLCyfg5pt+HLz9BqlICO7LZM7VHNTTn/5PRhHFBSjk5lc4cmscPQ==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [arm64]
+    os: [darwin]
+
+  lightningcss-darwin-x64@1.32.0:
+    resolution: {integrity: sha512-U+QsBp2m/s2wqpUYT/6wnlagdZbtZdndSmut/NJqlCcMLTWp5muCrID+K5UJ6jqD2BFshejCYXniPDbNh73V8w==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [x64]
+    os: [darwin]
+
+  lightningcss-freebsd-x64@1.32.0:
+    resolution: {integrity: sha512-JCTigedEksZk3tHTTthnMdVfGf61Fky8Ji2E4YjUTEQX14xiy/lTzXnu1vwiZe3bYe0q+SpsSH/CTeDXK6WHig==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [x64]
+    os: [freebsd]
+
+  lightningcss-linux-arm-gnueabihf@1.32.0:
+    resolution: {integrity: sha512-x6rnnpRa2GL0zQOkt6rts3YDPzduLpWvwAF6EMhXFVZXD4tPrBkEFqzGowzCsIWsPjqSK+tyNEODUBXeeVHSkw==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [arm]
+    os: [linux]
+
+  lightningcss-linux-arm64-gnu@1.32.0:
+    resolution: {integrity: sha512-0nnMyoyOLRJXfbMOilaSRcLH3Jw5z9HDNGfT/gwCPgaDjnx0i8w7vBzFLFR1f6CMLKF8gVbebmkUN3fa/kQJpQ==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [arm64]
+    os: [linux]
+    libc: [glibc]
+
+  lightningcss-linux-arm64-musl@1.32.0:
+    resolution: {integrity: sha512-UpQkoenr4UJEzgVIYpI80lDFvRmPVg6oqboNHfoH4CQIfNA+HOrZ7Mo7KZP02dC6LjghPQJeBsvXhJod/wnIBg==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [arm64]
+    os: [linux]
+    libc: [musl]
+
+  lightningcss-linux-x64-gnu@1.32.0:
+    resolution: {integrity: sha512-V7Qr52IhZmdKPVr+Vtw8o+WLsQJYCTd8loIfpDaMRWGUZfBOYEJeyJIkqGIDMZPwPx24pUMfwSxxI8phr/MbOA==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [x64]
+    os: [linux]
+    libc: [glibc]
+
+  lightningcss-linux-x64-musl@1.32.0:
+    resolution: {integrity: sha512-bYcLp+Vb0awsiXg/80uCRezCYHNg1/l3mt0gzHnWV9XP1W5sKa5/TCdGWaR/zBM2PeF/HbsQv/j2URNOiVuxWg==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [x64]
+    os: [linux]
+    libc: [musl]
+
+  lightningcss-win32-arm64-msvc@1.32.0:
+    resolution: {integrity: sha512-8SbC8BR40pS6baCM8sbtYDSwEVQd4JlFTOlaD3gWGHfThTcABnNDBda6eTZeqbofalIJhFx0qKzgHJmcPTnGdw==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [arm64]
+    os: [win32]
+
+  lightningcss-win32-x64-msvc@1.32.0:
+    resolution: {integrity: sha512-Amq9B/SoZYdDi1kFrojnoqPLxYhQ4Wo5XiL8EVJrVsB8ARoC1PWW6VGtT0WKCemjy8aC+louJnjS7U18x3b06Q==}
+    engines: {node: '>= 12.0.0'}
+    cpu: [x64]
+    os: [win32]
+
+  lightningcss@1.32.0:
+    resolution: {integrity: sha512-NXYBzinNrblfraPGyrbPoD19C1h9lfI/1mzgWYvXUTe414Gz/X1FD2XBZSZM7rRTrMA8JL3OtAaGifrIKhQ5yQ==}
+    engines: {node: '>= 12.0.0'}
+
+  lines-and-columns@1.2.4:
+    resolution: {integrity: sha512-7ylylesZQ/PV29jhEDl3Ufjo6ZX7gCqJr5F7PKrqc93v7fzSymt1BpwEU8nAUXs8qzzvqhbjhK5QZg6Mt/HkBg==}
+
+  locate-path@6.0.0:
+    resolution: {integrity: sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==}
+    engines: {node: '>=10'}
+
+  lodash.merge@4.6.2:
+    resolution: {integrity: sha512-0KpjqXRVvrYyCsX1swR/XTK0va6VQkQM6MNo7PqW77ByjAhoARA8EfrP1N4+KlKj8YS0ZUCtRT/YUuhyYDujIQ==}
+
+  long@5.3.2:
+    resolution: {integrity: sha512-mNAgZ1GmyNhD7AuqnTG3/VQ26o760+ZYBPKjPvugO8+nLbYfX6TVpJPseBvopbdY+qpZ/lKUnmEc1LeZYS3QAA==}
+
+  loose-envify@1.4.0:
+    resolution: {integrity: sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==}
+    hasBin: true
+
+  lru-cache@5.1.1:
+    resolution: {integrity: sha512-KpNARQA3Iwv+jTA0utUVVbrh+Jlrr1Fv0e56GGzAFOXN7dk/FviaDW8LHmK52DlcH4WP2n6gI8vN1aesBFgo9w==}
+
+  lru.min@1.1.4:
+    resolution: {integrity: sha512-DqC6n3QQ77zdFpCMASA1a3Jlb64Hv2N2DciFGkO/4L9+q/IpIAuRlKOvCXabtRW6cQf8usbmM6BE/TOPysCdIA==}
+    engines: {bun: '>=1.0.0', deno: '>=1.30.0', node: '>=8.0.0'}
+
+  magic-string@0.30.21:
+    resolution: {integrity: sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==}
+
+  math-intrinsics@1.1.0:
+    resolution: {integrity: sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==}
+    engines: {node: '>= 0.4'}
+
+  merge2@1.4.1:
+    resolution: {integrity: sha512-8q7VEgMJW4J8tcfVPy8g09NcQwZdbwFEqhe/WZkoIzjn/3TGDwtOCYtXGxA3O8tPzpczCCDgv+P2P5y00ZJOOg==}
+    engines: {node: '>= 8'}
+
+  micromatch@4.0.8:
+    resolution: {integrity: sha512-PXwfBhYu0hBCPw8Dn0E+WDYb7af3dSLVWKi3HGv84IdF4TyFoC0ysxFd0Goxw7nSv4T/PzEJQxsYsEiFCKo2BA==}
+    engines: {node: '>=8.6'}
+
+  minimatch@10.2.5:
+    resolution: {integrity: sha512-MULkVLfKGYDFYejP07QOurDLLQpcjk7Fw+7jXS2R2czRQzR56yHRveU5NDJEOviH+hETZKSkIk5c+T23GjFUMg==}
+    engines: {node: 18 || 20 || >=22}
+
+  minimatch@3.1.5:
+    resolution: {integrity: sha512-VgjWUsnnT6n+NUk6eZq77zeFdpW2LWDzP6zFGrCbHXiYNul5Dzqk2HHQ5uFH2DNW5Xbp8+jVzaeNt94ssEEl4w==}
+
+  minimist@1.2.8:
+    resolution: {integrity: sha512-2yyAR8qBkN3YuheJanUpWC5U3bb5osDywNB8RzDVlDwDHbocAJveqqj1u8+SVD7jkWT4yvsHCpWqqWqAxb0zCA==}
+
+  ms@2.1.3:
+    resolution: {integrity: sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==}
+
+  mysql2@3.15.3:
+    resolution: {integrity: sha512-FBrGau0IXmuqg4haEZRBfHNWB5mUARw6hNwPDXXGg0XzVJ50mr/9hb267lvpVMnhZ1FON3qNd4Xfcez1rbFwSg==}
+    engines: {node: '>= 8.0'}
+
+  named-placeholders@1.1.6:
+    resolution: {integrity: sha512-Tz09sEL2EEuv5fFowm419c1+a/jSMiBjI9gHxVLrVdbUkkNUUfjsVYs9pVZu5oCon/kmRh9TfLEObFtkVxmY0w==}
+    engines: {node: '>=8.0.0'}
+
+  nanoid@3.3.16:
+    resolution: {integrity: sha512-bzlKTyNJ7+LdGIIwy8ijFpIqEQIvafahV7eYykJ8Cvh42EdJeODoJ6gUJXpQJvej1BddH8OqTXZNE/KfbWAu8Q==}
+    engines: {node: ^10 || ^12 || ^13.7 || ^14 || >=15.0.1}
+    hasBin: true
+
+  napi-postinstall@0.3.4:
+    resolution: {integrity: sha512-PHI5f1O0EP5xJ9gQmFGMS6IZcrVvTjpXjz7Na41gTE7eE2hK11lg04CECCYEEjdc17EV4DO+fkGEtt7TpTaTiQ==}
+    engines: {node: ^12.20.0 || ^14.18.0 || >=16.0.0}
+    hasBin: true
+
+  natural-compare@1.4.0:
+    resolution: {integrity: sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw==}
+
+  next-auth@5.0.0-beta.31:
+    resolution: {integrity: sha512-1OBgCKPzo+S7UWWMp3xgvGvIJ0OpV7B3vR4ZDRqD9a4Ch+OT6dakLXG9ivhtmIWVa71nTSXattOHyCg8sNi8/Q==}
+    peerDependencies:
+      '@simplewebauthn/browser': ^9.0.1
+      '@simplewebauthn/server': ^9.0.2
+      next: ^14.0.0-0 || ^15.0.0 || ^16.0.0
+      nodemailer: ^7.0.7
+      react: ^18.2.0 || ^19.0.0
+    peerDependenciesMeta:
+      '@simplewebauthn/browser':
+        optional: true
+      '@simplewebauthn/server':
+        optional: true
+      nodemailer:
+        optional: true
+
+  next@16.2.10:
+    resolution: {integrity: sha512-2som5AVXb3kE6Yjine3/mNbBayYF58eguBWIVVUdr1y/L426xyVEgYxgBG+1QC34P2x5E+tcDup6XkuOAX3dCA==}
+    engines: {node: '>=20.9.0'}
+    hasBin: true
+    peerDependencies:
+      '@opentelemetry/api': ^1.1.0
+      '@playwright/test': ^1.51.1
+      babel-plugin-react-compiler: '*'
+      react: ^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0
+      react-dom: ^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0
+      sass: ^1.3.0
+    peerDependenciesMeta:
+      '@opentelemetry/api':
+        optional: true
+      '@playwright/test':
+        optional: true
+      babel-plugin-react-compiler:
+        optional: true
+      sass:
+        optional: true
+
+  node-addon-api@8.9.0:
+    resolution: {integrity: sha512-ekZMeaaIzSQTSpr7X2X3iJM7lTzgnx8ahAG9pJfT/7+14mlEM8ZYQ9cgCDvSSRbReFK0oHli3WrZdCiRsgAT9Q==}
+    engines: {node: ^18 || ^20 || >= 21}
+
+  node-exports-info@1.6.2:
+    resolution: {integrity: sha512-kXs9Go0cah0qHVV2v389IXQLdLCeE1xfFtjOAF+iobu0OIoG1pje8At2vMHyaPMiPMnG/LWP50twML21eMcAag==}
+    engines: {node: '>= 0.4'}
+
+  node-gyp-build@4.8.4:
+    resolution: {integrity: sha512-LA4ZjwlnUblHVgq0oBF3Jl/6h/Nvs5fzBLwdEF4nuxnFdsfajde4WfxtJr3CaiH+F6ewcIB/q4jQ4UzPyid+CQ==}
+    hasBin: true
+
+  node-releases@2.0.51:
+    resolution: {integrity: sha512-wRNIrw4DmVLKQlbgOMdkMx27Wrpzes2hh5Jtbi2bjPd+4wJstWIqP5A+lscnqbm0xxmT5Bpg8Lec5ItEBwx6BQ==}
+    engines: {node: '>=18'}
+
+  oauth4webapi@3.8.6:
+    resolution: {integrity: sha512-iwemM91xz8nryHti2yTmg5fhyEMVOkOXwHNqbvcATjyajb5oQxCQzrNOA6uElRHuMhQQTKUyFKV9y/CNyg25BQ==}
+
+  object-assign@4.1.1:
+    resolution: {integrity: sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==}
+    engines: {node: '>=0.10.0'}
+
+  object-inspect@1.13.4:
+    resolution: {integrity: sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==}
+    engines: {node: '>= 0.4'}
+
+  object-keys@1.1.1:
+    resolution: {integrity: sha512-NuAESUOUMrlIXOfHKzD6bpPu3tYt3xvjNdRIQ+FeT0lNb4K8WR70CaDxhuNguS2XG+GjkyMwOzsN5ZktImfhLA==}
+    engines: {node: '>= 0.4'}
+
+  object.assign@4.1.7:
+    resolution: {integrity: sha512-nK28WOo+QIjBkDduTINE4JkF/UJJKyf2EJxvJKfblDpyg0Q+pkOHNTL0Qwy6NP6FhE/EnzV73BxxqcJaXY9anw==}
+    engines: {node: '>= 0.4'}
+
+  object.entries@1.1.9:
+    resolution: {integrity: sha512-8u/hfXFRBD1O0hPUjioLhoWFHRmt6tKA4/vZPyckBr18l1KE9uHrFaFaUi8MDRTpi4uak2goyPTSNJLXX2k2Hw==}
+    engines: {node: '>= 0.4'}
+
+  object.fromentries@2.0.8:
+    resolution: {integrity: sha512-k6E21FzySsSK5a21KRADBd/NGneRegFO5pLHfdQLpRDETUNJueLXs3WCzyQ3tFRDYgbq3KHGXfTbi2bs8WQ6rQ==}
+    engines: {node: '>= 0.4'}
+
+  object.groupby@1.0.3:
+    resolution: {integrity: sha512-+Lhy3TQTuzXI5hevh8sBGqbmurHbbIjAi0Z4S63nthVLmLxfbj4T54a4CfZrXIrt9iP4mVAPYMo/v99taj3wjQ==}
+    engines: {node: '>= 0.4'}
+
+  object.values@1.2.1:
+    resolution: {integrity: sha512-gXah6aZrcUxjWg2zR2MwouP2eHlCBzdV4pygudehaKXSGW4v2AsRQUK+lwwXhii6KFZcunEnmSUoYp5CXibxtA==}
+    engines: {node: '>= 0.4'}
+
+  obug@2.1.3:
+    resolution: {integrity: sha512-9miFgM2OFba7hB+pRgvtV84pYTBaoTHohvmIgiRt6dRIzbwEOIaNaP+dIlGs2fNFoB0SeISs0Jz5WFVRid6Xyg==}
+    engines: {node: '>=12.20.0'}
+
+  ohash@2.0.11:
+    resolution: {integrity: sha512-RdR9FQrFwNBNXAr4GixM8YaRZRJ5PUWbKYbE5eOsrwAjJW0q2REGcf79oYPsLyskQCZG1PLN+S/K1V00joZAoQ==}
+
+  optionator@0.9.4:
+    resolution: {integrity: sha512-6IpQ7mKUxRcZNLIObR0hz7lxsapSSIYNZJwXPGeF0mTVqGKFIXj1DQcMoT22S3ROcLyY/rz0PWaWZ9ayWmad9g==}
+    engines: {node: '>= 0.8.0'}
+
+  own-keys@1.0.1:
+    resolution: {integrity: sha512-qFOyK5PjiWZd+QQIh+1jhdb9LpxTF0qs7Pm8o5QHYZ0M3vKqSqzsZaEB6oWlxZ+q2sJBMI/Ktgd2N5ZwQoRHfg==}
+    engines: {node: '>= 0.4'}
+
+  p-limit@3.1.0:
+    resolution: {integrity: sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==}
+    engines: {node: '>=10'}
+
+  p-locate@5.0.0:
+    resolution: {integrity: sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==}
+    engines: {node: '>=10'}
+
+  parent-module@1.0.1:
+    resolution: {integrity: sha512-GQ2EWRpQV8/o+Aw8YqtfZZPfNRWZYkbidE9k5rpl/hC3vtHHBfGm2Ifi6qWV+coDGkrUKZAxE3Lot5kcsRlh+g==}
+    engines: {node: '>=6'}
+
+  parse-json@5.2.0:
+    resolution: {integrity: sha512-ayCKvm/phCGxOkYRSCM82iDwct8/EonSEgCSxWxD7ve6jHggsFl4fZVQBPRNgQoKiuV/odhFrGzQXZwbifC8Rg==}
+    engines: {node: '>=8'}
+
+  path-exists@4.0.0:
+    resolution: {integrity: sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==}
+    engines: {node: '>=8'}
+
+  path-key@3.1.1:
+    resolution: {integrity: sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==}
+    engines: {node: '>=8'}
+
+  path-parse@1.0.7:
+    resolution: {integrity: sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==}
+
+  path-type@4.0.0:
+    resolution: {integrity: sha512-gDKb8aZMDeD/tZWs9P6+q0J9Mwkdl6xMV8TjnGP3qJVJ06bdMgkbBlLU8IdfOsIsFz2BW1rNVT3XuNEl8zPAvw==}
+    engines: {node: '>=8'}
+
+  pathe@2.0.3:
+    resolution: {integrity: sha512-WUjGcAqP1gQacoQe+OBJsFA7Ld4DyXuUIjZ5cc75cLHvJ7dtNsTugphxIADwspS+AraAUePCKrSVtPLFj/F88w==}
+
+  perfect-debounce@2.1.0:
+    resolution: {integrity: sha512-LjgdTytVFXeUgtHZr9WYViYSM/g8MkcTPYDlPa3cDqMirHjKiSZPYd6DoL7pK8AJQr+uWkQvCjHNdiMqsrJs+g==}
+
+  pg-cloudflare@1.4.0:
+    resolution: {integrity: sha512-Vo7z/6rrQYxpNRylp4Tlob2elzbh+N/MOQbxFVWCxS7oEx6jF53GTJFxK2WWpKuBRkmiin4Mt+xofFDjx09R0A==}
+
+  pg-connection-string@2.14.0:
+    resolution: {integrity: sha512-XwWDGcLRGCXAR8F/AM5bG7Q+A3Wm2s6QeEjlOKZLlH3UYcguiqCWKyWXVag5TLTIjR7oOJUY8kcADaZgWPyLeg==}
+
+  pg-int8@1.0.1:
+    resolution: {integrity: sha512-WCtabS6t3c8SkpDBUlb1kjOs7l66xsGdKpIPZsg4wR+B3+u9UAum2odSsF9tnvxg80h4ZxLWMy4pRjOsFIqQpw==}
+    engines: {node: '>=4.0.0'}
+
+  pg-pool@3.14.0:
+    resolution: {integrity: sha512-gKtPkFdQPU3DksooVLi9LsjZxrsBUZIpa+7aVx+LV5pNh0KzP4Zleud2po+ConrxbuXGBJ6Hfer6hdgpIBpBaw==}
+    peerDependencies:
+      pg: '>=8.0'
+
+  pg-protocol@1.15.0:
+    resolution: {integrity: sha512-cq9sECI5s0+uPUXjbz8ioyPJni6RzsRib0US67i5IoTZKw8fNeYlVE7u8F4dG7vEJJtc5wdD1K189lCCUwqWTQ==}
+
+  pg-types@2.2.0:
+    resolution: {integrity: sha512-qTAAlrEsl8s4OiEQY69wDvcMIdQN6wdz5ojQiOy6YRMuynxenON0O5oCpJI6lshc6scgAY8qvJ2On/p+CXY0GA==}
+    engines: {node: '>=4'}
+
+  pg@8.22.0:
+    resolution: {integrity: sha512-8wih1vVIBMxoUM2oB4soJsD9tDnDpLv4OXBJ+EJzFsvycD+lfyIreC2gGHq78f8jbLLt+bvlPTFdFZfJkOuzAA==}
+    engines: {node: '>= 16.0.0'}
+    peerDependencies:
+      pg-native: '>=3.0.1'
+    peerDependenciesMeta:
+      pg-native:
+        optional: true
+
+  pgpass@1.0.5:
+    resolution: {integrity: sha512-FdW9r/jQZhSeohs1Z3sI1yxFQNFvMcnmfuj4WBMUTxOrAyLMaTcE1aAMBiTlbMNaXvBCQuVi0R7hd8udDSP7ug==}
+
+  picocolors@1.1.1:
+    resolution: {integrity: sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==}
+
+  picomatch@2.3.2:
+    resolution: {integrity: sha512-V7+vQEJ06Z+c5tSye8S+nHUfI51xoXIXjHQ99cQtKUkQqqO1kO/KCJUfZXuB47h/YBlDhah2H3hdUGXn8ie0oA==}
+    engines: {node: '>=8.6'}
+
+  picomatch@4.0.5:
+    resolution: {integrity: sha512-RvwwcruNjI1ncT5xRakeyS9Lf8lcItv34KD+aif+VH9kduAyfYBipGh12274xtenIPZ119/R9BdTBa8gAwSh0A==}
+    engines: {node: '>=12'}
+
+  pkg-types@2.3.1:
+    resolution: {integrity: sha512-y+ichcgc2LrADuhLNAx8DFjVfgz91pRxfZdI3UDhxHvcVEZsenLO+7XaU5vOp0u/7V/wZ+plyuQxtrDlZJ+yeg==}
+
+  possible-typed-array-names@1.1.0:
+    resolution: {integrity: sha512-/+5VFTchJDoVj3bhoqi6UeymcD00DAwb1nJwamzPvHEszJ4FpF6SNNbUbOS8yI56qHzdV8eK0qEfOSiodkTdxg==}
+    engines: {node: '>= 0.4'}
+
+  postcss@8.4.31:
+    resolution: {integrity: sha512-PS08Iboia9mts/2ygV3eLpY5ghnUcfLV/EXTOW1E2qYxJKGGBUtNjN76FYHnMs36RmARn41bC0AZmn+rR0OVpQ==}
+    engines: {node: ^10 || ^12 || >=14}
+
+  postcss@8.5.19:
+    resolution: {integrity: sha512-Mz8SaolMd8nB+G13WkORcxQKHZ/NE4xXevtkJHVuG+guo9/wYKlIMTKAqGdEmYOXR2ijPjTYNHssizdaVSUNdQ==}
+    engines: {node: ^10 || ^12 || >=14}
+
+  postgres-array@2.0.0:
+    resolution: {integrity: sha512-VpZrUqU5A69eQyW2c5CA1jtLecCsN2U/bD6VilrFDWq5+5UIEVO7nazS3TEcHf1zuPYO/sqGvUvW62g86RXZuA==}
+    engines: {node: '>=4'}
+
+  postgres-array@3.0.4:
+    resolution: {integrity: sha512-nAUSGfSDGOaOAEGwqsRY27GPOea7CNipJPOA7lPbdEpx5Kg3qzdP0AaWC5MlhTWV9s4hFX39nomVZ+C4tnGOJQ==}
+    engines: {node: '>=12'}
+
+  postgres-bytea@1.0.1:
+    resolution: {integrity: sha512-5+5HqXnsZPE65IJZSMkZtURARZelel2oXUEO8rH83VS/hxH5vv1uHquPg5wZs8yMAfdv971IU+kcPUczi7NVBQ==}
+    engines: {node: '>=0.10.0'}
+
+  postgres-date@1.0.7:
+    resolution: {integrity: sha512-suDmjLVQg78nMK2UZ454hAG+OAW+HQPZ6n++TNDUX+L0+uUlLywnoxJKDou51Zm+zTCjrCl0Nq6J9C5hP9vK/Q==}
+    engines: {node: '>=0.10.0'}
+
+  postgres-interval@1.2.0:
+    resolution: {integrity: sha512-9ZhXKM/rw350N1ovuWHbGxnGh/SNJ4cnxHiM0rxE4VN41wsg8P8zWn9hv/buK00RP4WvlOyr/RBDiptyxVbkZQ==}
+    engines: {node: '>=0.10.0'}
+
+  postgres@3.4.7:
+    resolution: {integrity: sha512-Jtc2612XINuBjIl/QTWsV5UvE8UHuNblcO3vVADSrKsrc6RqGX6lOW1cEo3CM2v0XG4Nat8nI+YM7/f26VxXLw==}
+    engines: {node: '>=12'}
+
+  preact-render-to-string@6.5.11:
+    resolution: {integrity: sha512-ubnauqoGczeGISiOh6RjX0/cdaF8v/oDXIjO85XALCQjwQP+SB4RDXXtvZ6yTYSjG+PC1QRP2AhPgCEsM2EvUw==}
+    peerDependencies:
+      preact: '>=10'
+
+  preact@10.24.3:
+    resolution: {integrity: sha512-Z2dPnBnMUfyQfSQ+GBdsGa16hz35YmLmtTLhM169uW944hYL6xzTYkJjC07j+Wosz733pMWx0fgON3JNw1jJQA==}
+
+  prelude-ls@1.2.1:
+    resolution: {integrity: sha512-vkcDPrRZo1QZLbn5RLGPpg/WmIQ65qoWWhcGKf/b5eplkkarX0m9z8ppCat4mlOqUsWpyNuYgO3VRyrYHSzX5g==}
+    engines: {node: '>= 0.8.0'}
+
+  prisma@7.8.0:
+    resolution: {integrity: sha512-yfN4yrw7HV9kEJhoy1+jgah0jafEIQsf7uWouSsM8MvJtlubsk+kM7AIBWZ8+GJl74Yj3c+nbYqBkMOxtsZ3Lw==}
+    engines: {node: ^20.19 || ^22.12 || >=24.0}
+    hasBin: true
+    peerDependencies:
+      better-sqlite3: '>=9.0.0'
+      typescript: '>=5.4.0'
+    peerDependenciesMeta:
+      better-sqlite3:
+        optional: true
+      typescript:
+        optional: true
+
+  prop-types@15.8.1:
+    resolution: {integrity: sha512-oj87CgZICdulUohogVAR7AjlC0327U4el4L6eAvOqCeudMDVU0NThNaV+b9Df4dXgSP1gXMTnPdhfe/2qDH5cg==}
+
+  proper-lockfile@4.1.2:
+    resolution: {integrity: sha512-TjNPblN4BwAWMXU8s9AEz4JmQxnD1NNL7bNOY/AKUzyamc379FWASUhc/K1pL2noVb+XmZKLL68cjzLsiOAMaA==}
+
+  punycode@2.3.1:
+    resolution: {integrity: sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==}
+    engines: {node: '>=6'}
+
+  pure-rand@6.1.0:
+    resolution: {integrity: sha512-bVWawvoZoBYpp6yIoQtQXHZjmz35RSVHnUOTefl8Vcjr8snTPY1wnpSPMWekcFwbxI6gtmT7rSYPFvz71ldiOA==}
+
+  queue-microtask@1.2.3:
+    resolution: {integrity: sha512-NuaNSa6flKT5JaSYQzJok04JzTL1CA6aGhv5rfLW3PgqA+M2ChpZQnAC8h8i4ZFkBS8X5RqkDBHA7r4hej3K9A==}
+
+  rc9@3.0.1:
+    resolution: {integrity: sha512-gMDyleLWVE+i6Sgtc0QbbY6pEKqYs97NGi6isHQPqYlLemPoO8dxQ3uGi0f4NiP98c+jMW6cG1Kx9dDwfvqARQ==}
+
+  react-dom@19.2.4:
+    resolution: {integrity: sha512-AXJdLo8kgMbimY95O2aKQqsz2iWi9jMgKJhRBAxECE4IFxfcazB2LmzloIoibJI3C12IlY20+KFaLv+71bUJeQ==}
+    peerDependencies:
+      react: ^19.2.4
+
+  react-is@16.13.1:
+    resolution: {integrity: sha512-24e6ynE2H+OKt4kqsOvNd8kBpV65zoxbA4BVsEOB3ARVWQki/DHzaUoC5KuON/BiccDaCCTZBuOcfZs70kR8bQ==}
+
+  react@19.2.4:
+    resolution: {integrity: sha512-9nfp2hYpCwOjAN+8TZFGhtWEwgvWHXqESH8qT89AT/lWklpLON22Lc8pEtnpsZz7VmawabSU0gCjnj8aC0euHQ==}
+    engines: {node: '>=0.10.0'}
+
+  readdirp@5.0.0:
+    resolution: {integrity: sha512-9u/XQ1pvrQtYyMpZe7DXKv2p5CNvyVwzUB6uhLAnQwHMSgKMBR62lc7AHljaeteeHXn11XTAaLLUVZYVZyuRBQ==}
+    engines: {node: '>= 20.19.0'}
+
+  reflect.getprototypeof@1.0.10:
+    resolution: {integrity: sha512-00o4I+DVrefhv+nX0ulyi3biSHCPDe+yLv5o/p6d/UVlirijB8E16FtfwSAi4g3tcqrQ4lRAqQSoFEZJehYEcw==}
+    engines: {node: '>= 0.4'}
+
+  regexp.prototype.flags@1.5.4:
+    resolution: {integrity: sha512-dYqgNSZbDwkaJ2ceRd9ojCGjBq+mOm9LmtXnAnEGyHhN/5R7iDW2TRw3h+o/jCFxus3P2LfWIIiwowAjANm7IA==}
+    engines: {node: '>= 0.4'}
+
+  remeda@2.33.4:
+    resolution: {integrity: sha512-ygHswjlc/opg2VrtiYvUOPLjxjtdKvjGz1/plDhkG66hjNjFr1xmfrs2ClNFo/E6TyUFiwYNh53bKV26oBoMGQ==}
+
+  require-directory@2.1.1:
+    resolution: {integrity: sha512-fGxEI7+wsG9xrvdjsrlmL22OMTTiHRwAMroiEeMgq8gzoLC/PQr7RsRDSTLUg/bZAZtF+TVIkHc6/4RIKrui+Q==}
+    engines: {node: '>=0.10.0'}
+
+  require-from-string@2.0.2:
+    resolution: {integrity: sha512-Xf0nWe6RseziFMu+Ap9biiUbmplq6S9/p+7w7YXP/JBHhrUDDUhwa+vANyubuqfZWTveU//DYVGsDG7RKL/vEw==}
+    engines: {node: '>=0.10.0'}
+
+  resolve-from@4.0.0:
+    resolution: {integrity: sha512-pb/MYmXstAkysRFx8piNI1tGFNQIFA3vkE3Gq4EuA1dF6gHp/+vgZqsCGJapvy8N3Q+4o7FwvquPJcnZ7RYy4g==}
+    engines: {node: '>=4'}
+
+  resolve-pkg-maps@1.0.0:
+    resolution: {integrity: sha512-seS2Tj26TBVOC2NIc2rOe2y2ZO7efxITtLZcGSOnHHNOQ7CkiUBfw0Iw2ck6xkIhPwLhKNLS8BO+hEpngQlqzw==}
+
+  resolve@2.0.0-next.7:
+    resolution: {integrity: sha512-tqt+NBWwyaMgw3zDsnygx4CByWjQEJHOPMdslYhppaQSJUtL/D4JO9CcBBlhPoI8lz9oJIDXkwXfhF4aWqP8xQ==}
+    engines: {node: '>= 0.4'}
+    hasBin: true
+
+  retry@0.12.0:
+    resolution: {integrity: sha512-9LkiTwjUh6rT555DtE9rTX+BKByPfrMzEAtnlEtdEwr3Nkffwiihqe2bWADg+OQRjt9gl6ICdmB/ZFDCGAtSow==}
+    engines: {node: '>= 4'}
+
+  reusify@1.1.0:
+    resolution: {integrity: sha512-g6QUff04oZpHs0eG5p83rFLhHeV00ug/Yf9nZM6fLeUrPguBTkTQOdpAWWspMh55TZfVQDPaN3NQJfbVRAxdIw==}
+    engines: {iojs: '>=1.0.0', node: '>=0.10.0'}
+
+  rolldown@1.1.5:
+    resolution: {integrity: sha512-t9z29cJjXf/vxQ8dyhCSpt6H6aSwHTk8cT5I3iy6SMXuFpk5mB6PL6XfC8PCwrPTx93udwKUm9HRteAlTGBLiA==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    hasBin: true
+
+  run-parallel@1.2.0:
+    resolution: {integrity: sha512-5l4VyZR86LZ/lDxZTR6jqL8AFE2S0IFLMP26AbjsLVADxHdhB/c0GUsH+y39UfCi3dzz8OlQuPmnaJOMoDHQBA==}
+
+  safe-array-concat@1.1.4:
+    resolution: {integrity: sha512-wtZlHyOje6OZTGqAoaDKxFkgRtkF9CnHAVnCHKfuj200wAgL+bSJhdsCD2l0Qx/2ekEXjPWcyKkfGb5CPboslg==}
+    engines: {node: '>=0.4'}
+
+  safe-push-apply@1.0.0:
+    resolution: {integrity: sha512-iKE9w/Z7xCzUMIZqdBsp6pEQvwuEebH4vdpjcDWnyzaI6yl6O9FHvVpmGelvEHNsoY6wGblkxR6Zty/h00WiSA==}
+    engines: {node: '>= 0.4'}
+
+  safe-regex-test@1.1.0:
+    resolution: {integrity: sha512-x/+Cz4YrimQxQccJf5mKEbIa1NzeCRNI5Ecl/ekmlYaampdNLPalVyIcCZNNH3MvmqBugV5TMYZXv0ljslUlaw==}
+    engines: {node: '>= 0.4'}
+
+  safer-buffer@2.1.2:
+    resolution: {integrity: sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==}
+
+  scheduler@0.27.0:
+    resolution: {integrity: sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==}
+
+  semver@6.3.1:
+    resolution: {integrity: sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==}
+    hasBin: true
+
+  semver@7.8.5:
+    resolution: {integrity: sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==}
+    engines: {node: '>=10'}
+    hasBin: true
+
+  seq-queue@0.0.5:
+    resolution: {integrity: sha512-hr3Wtp/GZIc/6DAGPDcV4/9WoZhjrkXsi5B/07QgX8tsdc6ilr7BFM6PM6rbdAX1kFSDYeZGLipIZZKyQP0O5Q==}
+
+  set-function-length@1.2.2:
+    resolution: {integrity: sha512-pgRc4hJ4/sNjWCSS9AmnS40x3bNMDTknHgL5UaMBTMyJnU90EgWh1Rz+MC9eFu4BuN/UwZjKQuY/1v3rM7HMfg==}
+    engines: {node: '>= 0.4'}
+
+  set-function-name@2.0.2:
+    resolution: {integrity: sha512-7PGFlmtwsEADb0WYyvCMa1t+yke6daIG4Wirafur5kcf+MhUnPms1UeR0CKQdTZD81yESwMHbtn+TR+dMviakQ==}
+    engines: {node: '>= 0.4'}
+
+  set-proto@1.0.0:
+    resolution: {integrity: sha512-RJRdvCo6IAnPdsvP/7m6bsQqNnn1FCBX5ZNtFL98MmFF/4xAIJTIg1YbHW5DC2W5SKZanrC6i4HsJqlajw/dZw==}
+    engines: {node: '>= 0.4'}
+
+  sharp@0.34.5:
+    resolution: {integrity: sha512-Ou9I5Ft9WNcCbXrU9cMgPBcCK8LiwLqcbywW3t4oDV37n1pzpuNLsYiAV8eODnjbtQlSDwZ2cUEeQz4E54Hltg==}
+    engines: {node: ^18.17.0 || ^20.3.0 || >=21.0.0}
+
+  shebang-command@2.0.0:
+    resolution: {integrity: sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==}
+    engines: {node: '>=8'}
+
+  shebang-regex@3.0.0:
+    resolution: {integrity: sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==}
+    engines: {node: '>=8'}
+
+  side-channel-list@1.0.1:
+    resolution: {integrity: sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==}
+    engines: {node: '>= 0.4'}
+
+  side-channel-map@1.0.1:
+    resolution: {integrity: sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==}
+    engines: {node: '>= 0.4'}
+
+  side-channel-weakmap@1.0.2:
+    resolution: {integrity: sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==}
+    engines: {node: '>= 0.4'}
+
+  side-channel@1.1.1:
+    resolution: {integrity: sha512-6x6dK6zJdpTzF4sQeNYxwtvBzf6Eg4GtlesS94HOvTudUeyK2WXAaIfmDgsyslYrRBeFIlsi54AYsFGUuhmvrQ==}
+    engines: {node: '>= 0.4'}
+
+  siginfo@2.0.0:
+    resolution: {integrity: sha512-ybx0WO1/8bSBLEWXZvEd7gMW3Sn3JFlW3TvX1nREbDLRNQNaeNN8WK0meBwPdAaOI7TtRRRJn/Es1zhrrCHu7g==}
+
+  signal-exit@3.0.7:
+    resolution: {integrity: sha512-wnD2ZE+l+SPC/uoS0vXeE9L1+0wuaMqKlfz9AMUo38JsyLSBWSFcHR1Rri62LZc12vLr1gb3jl7iwQhgwpAbGQ==}
+
+  signal-exit@4.1.0:
+    resolution: {integrity: sha512-bzyZ1e88w9O1iNJbKnOlvYTrWPDl46O1bG0D3XInv+9tkPrxrN8jUUTiFlDkkmKWgn1M6CfIA13SuGqOa9Korw==}
+    engines: {node: '>=14'}
+
+  source-map-js@1.2.1:
+    resolution: {integrity: sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==}
+    engines: {node: '>=0.10.0'}
+
+  split2@4.2.0:
+    resolution: {integrity: sha512-UcjcJOWknrNkF6PLX83qcHM6KHgVKNkV62Y8a5uYDVv9ydGQVwAHMKqHdJje1VTWpljG0WYpCDhrCdAOYH4TWg==}
+    engines: {node: '>= 10.x'}
+
+  sqlstring@2.3.3:
+    resolution: {integrity: sha512-qC9iz2FlN7DQl3+wjwn3802RTyjCx7sDvfQEXchwa6CWOx07/WVfh91gBmQ9fahw8snwGEWU3xGzOt4tFyHLxg==}
+    engines: {node: '>= 0.6'}
+
+  stable-hash@0.0.5:
+    resolution: {integrity: sha512-+L3ccpzibovGXFK+Ap/f8LOS0ahMrHTf3xu7mMLSpEGU0EO9ucaysSylKo9eRDFNhWve/y275iPmIZ4z39a9iA==}
+
+  stackback@0.0.2:
+    resolution: {integrity: sha512-1XMJE5fQo1jGH6Y/7ebnwPOBEkIEnT4QF32d5R1+VXdXveM0IBMJt8zfaxX1P3QhVwrYe+576+jkANtSS2mBbw==}
+
+  std-env@3.10.0:
+    resolution: {integrity: sha512-5GS12FdOZNliM5mAOxFRg7Ir0pWz8MdpYm6AY6VPkGpbA7ZzmbzNcBJQ0GPvvyWgcY7QAhCgf9Uy89I03faLkg==}
+
+  std-env@4.2.0:
+    resolution: {integrity: sha512-oCUKSupKTHX53EyjDtuZQ64pjLJ6yYCtpmEw0goYxtjG9KpbRe8KAsl2tBUGU9DyMcJ0RwJ8GqJAFzMXcXW1Rw==}
+
+  stop-iteration-iterator@1.1.0:
+    resolution: {integrity: sha512-eLoXW/DHyl62zxY4SCaIgnRhuMr6ri4juEYARS8E6sCEqzKpOiE521Ucofdx+KnDZl5xmvGYaaKCk5FEOxJCoQ==}
+    engines: {node: '>= 0.4'}
+
+  string-width@4.2.3:
+    resolution: {integrity: sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==}
+    engines: {node: '>=8'}
+
+  string.prototype.includes@2.0.1:
+    resolution: {integrity: sha512-o7+c9bW6zpAdJHTtujeePODAhkuicdAryFsfVKwA+wGw89wJ4GTY484WTucM9hLtDEOpOvI+aHnzqnC5lHp4Rg==}
+    engines: {node: '>= 0.4'}
+
+  string.prototype.matchall@4.0.12:
+    resolution: {integrity: sha512-6CC9uyBL+/48dYizRf7H7VAYCMCNTBeM78x/VTUe9bFEaxBepPJDa1Ow99LqI/1yF7kuy7Q3cQsYMrcjGUcskA==}
+    engines: {node: '>= 0.4'}
+
+  string.prototype.repeat@1.0.0:
+    resolution: {integrity: sha512-0u/TldDbKD8bFCQ/4f5+mNRrXwZ8hg2w7ZR8wa16e8z9XpePWl3eGEcUD0OXpEH/VJH/2G3gjUtR3ZOiBe2S/w==}
+
+  string.prototype.trim@1.2.11:
+    resolution: {integrity: sha512-PwvK7BU+CMTJGYQCTZb5RWXIML92lftJLhQz1tBzgKiqGxJaMlBAa48POXaNAC2s4y8jr3EFqrkF9+44neS46w==}
+    engines: {node: '>= 0.4'}
+
+  string.prototype.trimend@1.0.10:
+    resolution: {integrity: sha512-2+3aDAOmPTmuFwjDnmJG2ctEkQKVki7vOSqaxkv42Mowj1V6PnvuwFCRrR5lChUux1TBskPjfkeTOhqczDMxTw==}
+    engines: {node: '>= 0.4'}
+
+  string.prototype.trimstart@1.0.8:
+    resolution: {integrity: sha512-UXSH262CSZY1tfu3G3Secr6uGLCFVPMhIqHjlgCUtCCcgihYc/xKs9djMTMUOb2j1mVSeU8EU6NWc/iQKU6Gfg==}
+    engines: {node: '>= 0.4'}
+
+  strip-ansi@6.0.1:
+    resolution: {integrity: sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==}
+    engines: {node: '>=8'}
+
+  strip-bom@3.0.0:
+    resolution: {integrity: sha512-vavAMRXOgBVNF6nyEEmL3DBK19iRpDcoIwW+swQ+CbGiu7lju6t+JklA1MHweoWtadgt4ISVUsXLyDq34ddcwA==}
+    engines: {node: '>=4'}
+
+  strip-json-comments@3.1.1:
+    resolution: {integrity: sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==}
+    engines: {node: '>=8'}
+
+  styled-jsx@5.1.6:
+    resolution: {integrity: sha512-qSVyDTeMotdvQYoHWLNGwRFJHC+i+ZvdBRYosOFgC+Wg1vx4frN2/RG/NA7SYqqvKNLf39P2LSRA2pu6n0XYZA==}
+    engines: {node: '>= 12.0.0'}
+    peerDependencies:
+      '@babel/core': '*'
+      babel-plugin-macros: '*'
+      react: '>= 16.8.0 || 17.x.x || ^18.0.0-0 || ^19.0.0-0'
+    peerDependenciesMeta:
+      '@babel/core':
+        optional: true
+      babel-plugin-macros:
+        optional: true
+
+  supports-color@7.2.0:
+    resolution: {integrity: sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==}
+    engines: {node: '>=8'}
+
+  supports-preserve-symlinks-flag@1.0.0:
+    resolution: {integrity: sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==}
+    engines: {node: '>= 0.4'}
+
+  tailwindcss@4.3.2:
+    resolution: {integrity: sha512-WtctNNSH8A9jlMIqxzuYumOHU5uGZyRv0Q5svQl+oEPy5w84YpBxdb7MdqyiSPQge5jTJ6zFQLq0PFygdccSBA==}
+
+  tapable@2.3.3:
+    resolution: {integrity: sha512-uxc/zpqFg6x7C8vOE7lh6Lbda8eEL9zmVm/PLeTPBRhh1xCgdWaQ+J1CUieGpIfm2HdtsUpRv+HshiasBMcc6A==}
+    engines: {node: '>=6'}
+
+  tinybench@2.9.0:
+    resolution: {integrity: sha512-0+DUvqWMValLmha6lr4kD8iAMK1HzV0/aKnCtWb9v9641TnP/MFb7Pc2bxoxQjTXAErryXVgUOfv2YqNllqGeg==}
+
+  tinyexec@1.2.4:
+    resolution: {integrity: sha512-SHf/r48b7vOrjve9PxJo3MN5v5yuyjHvdUcrQffT3WXMUfnGmHDVbC4k3sHJaJTgZCwpUplIaAo5ANtMyp3YHg==}
+    engines: {node: '>=18'}
+
+  tinyglobby@0.2.17:
+    resolution: {integrity: sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==}
+    engines: {node: '>=12.0.0'}
+
+  tinyrainbow@3.1.0:
+    resolution: {integrity: sha512-Bf+ILmBgretUrdJxzXM0SgXLZ3XfiaUuOj/IKQHuTXip+05Xn+uyEYdVg0kYDipTBcLrCVyUzAPz7QmArb0mmw==}
+    engines: {node: '>=14.0.0'}
+
+  to-regex-range@5.0.1:
+    resolution: {integrity: sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==}
+    engines: {node: '>=8.0'}
+
+  ts-api-utils@2.5.0:
+    resolution: {integrity: sha512-OJ/ibxhPlqrMM0UiNHJ/0CKQkoKF243/AEmplt3qpRgkW8VG7IfOS41h7V8TjITqdByHzrjcS/2si+y4lIh8NA==}
+    engines: {node: '>=18.12'}
+    peerDependencies:
+      typescript: '>=4.8.4'
+
+  tsconfig-paths@3.15.0:
+    resolution: {integrity: sha512-2Ac2RgzDe/cn48GvOe3M+o82pEFewD3UPbyoUHHdKasHwJKjds4fLXWf/Ux5kATBKN20oaFGu+jbElp1pos0mg==}
+
+  tslib@2.8.1:
+    resolution: {integrity: sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==}
+
+  tsx@4.23.1:
+    resolution: {integrity: sha512-GQHnkIfxyx1wYCOS/wonik5MVRZU9hi1TEZmzGZSCJB1y9YgoZ8H6itNE/u4suE+yLmOzuE4E5S4TZ/ZX2wcWQ==}
+    engines: {node: '>=18.0.0'}
+    hasBin: true
+
+  type-check@0.4.0:
+    resolution: {integrity: sha512-XleUoc9uwGXqjWwXaUTZAmzMcFZ5858QA2vvx1Ur5xIcixXIP+8LnFDgRplU30us6teqdlskFfu+ae4K79Ooew==}
+    engines: {node: '>= 0.8.0'}
+
+  typed-array-buffer@1.0.3:
+    resolution: {integrity: sha512-nAYYwfY3qnzX30IkA6AQZjVbtK6duGontcQm1WSG1MD94YLqK0515GNApXkoxKOWMusVssAHWLh9SeaoefYFGw==}
+    engines: {node: '>= 0.4'}
+
+  typed-array-byte-length@1.0.3:
+    resolution: {integrity: sha512-BaXgOuIxz8n8pIq3e7Atg/7s+DpiYrxn4vdot3w9KbnBhcRQq6o3xemQdIfynqSeXeDrF32x+WvfzmOjPiY9lg==}
+    engines: {node: '>= 0.4'}
+
+  typed-array-byte-offset@1.0.4:
+    resolution: {integrity: sha512-bTlAFB/FBYMcuX81gbL4OcpH5PmlFHqlCCpAl8AlEzMz5k53oNDvN8p1PNOWLEmI2x4orp3raOFB51tv9X+MFQ==}
+    engines: {node: '>= 0.4'}
+
+  typed-array-length@1.0.8:
+    resolution: {integrity: sha512-phPGCwqr2+Qo0fwniCE8e4pKnGu/yFb5nD5Y8bf0EEeiI5GklnACYA9GFy/DrAeRrKHXvHn+1SUsOWgJp6RO+g==}
+    engines: {node: '>= 0.4'}
+
+  typescript-eslint@8.64.0:
+    resolution: {integrity: sha512-0qg+pDNMnqYzqH9AnNK+39tejHvsShUOUUoRUgtnTGE7QuMZhiFDnozq8nHJVq+Wae6NMLKNWLg5WmkcC/ndyQ==}
+    engines: {node: ^18.18.0 || ^20.9.0 || >=21.1.0}
+    peerDependencies:
+      eslint: ^8.57.0 || ^9.0.0 || ^10.0.0
+      typescript: '>=4.8.4 <6.1.0'
+
+  typescript@5.9.3:
+    resolution: {integrity: sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==}
+    engines: {node: '>=14.17'}
+    hasBin: true
+
+  unbox-primitive@1.1.0:
+    resolution: {integrity: sha512-nWJ91DjeOkej/TA8pXQ3myruKpKEYgqvpw9lz4OPHj/NWFNluYrjbz9j01CJ8yKQd2g4jFoOkINCTW2I5LEEyw==}
+    engines: {node: '>= 0.4'}
+
+  undici-types@6.21.0:
+    resolution: {integrity: sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==}
+
+  unrs-resolver@1.12.2:
+    resolution: {integrity: sha512-dmlRxBJJayXjqTwC+JtF1HhJmgf3ftQ3YejFcZrf4+KKtJv0qDsK1pjqaaVjG7wJ5NJ6UVP1OqRMQ71Z4C3rxQ==}
+
+  update-browserslist-db@1.2.3:
+    resolution: {integrity: sha512-Js0m9cx+qOgDxo0eMiFGEueWztz+d4+M3rGlmKPT+T4IS/jP4ylw3Nwpu6cpTTP8R1MAC1kF4VbdLt3ARf209w==}
+    hasBin: true
+    peerDependencies:
+      browserslist: '>= 4.21.0'
+
+  uri-js@4.4.1:
+    resolution: {integrity: sha512-7rKUyy33Q1yc98pQ1DAmLtwX109F7TIfWlW1Ydo8Wl1ii1SeHieeh0HHfPeL2fMXK6z0s8ecKs9frCuLJvndBg==}
+
+  valibot@1.2.0:
+    resolution: {integrity: sha512-mm1rxUsmOxzrwnX5arGS+U4T25RdvpPjPN4yR0u9pUBov9+zGVtO84tif1eY4r6zWxVxu3KzIyknJy3rxfRZZg==}
+    peerDependencies:
+      typescript: '>=5'
+    peerDependenciesMeta:
+      typescript:
+        optional: true
+
+  vite@8.1.5:
+    resolution: {integrity: sha512-7ULLwsCdYx/nRyrpiEwvqb5TFHrMVZyBt+rg/OAXT7rgj/z+DtTDyKFeLAdDkubDVDKD8jOsndmy7m55XcfUsw==}
+    engines: {node: ^20.19.0 || >=22.12.0}
+    hasBin: true
+    peerDependencies:
+      '@types/node': ^20.19.0 || >=22.12.0
+      '@vitejs/devtools': ^0.3.0
+      esbuild: ^0.27.0 || ^0.28.0
+      jiti: '>=1.21.0'
+      less: ^4.0.0
+      sass: ^1.70.0
+      sass-embedded: ^1.70.0
+      stylus: '>=0.54.8'
+      sugarss: ^5.0.0
+      terser: ^5.16.0
+      tsx: ^4.8.1
+      yaml: ^2.4.2
+    peerDependenciesMeta:
+      '@types/node':
+        optional: true
+      '@vitejs/devtools':
+        optional: true
+      esbuild:
+        optional: true
+      jiti:
+        optional: true
+      less:
+        optional: true
+      sass:
+        optional: true
+      sass-embedded:
+        optional: true
+      stylus:
+        optional: true
+      sugarss:
+        optional: true
+      terser:
+        optional: true
+      tsx:
+        optional: true
+      yaml:
+        optional: true
+
+  vitest@4.1.10:
+    resolution: {integrity: sha512-R9jUTe5S4Qb0HCd4TNqpC7oGcrMssMRGXLW80ubjWsW9VH5GF8y1Y0SFLY9AbqSk6nt0PnOx4H4WNJYZ13GUPw==}
+    engines: {node: ^20.0.0 || ^22.0.0 || >=24.0.0}
+    hasBin: true
+    peerDependencies:
+      '@edge-runtime/vm': '*'
+      '@opentelemetry/api': ^1.9.0
+      '@types/node': ^20.0.0 || ^22.0.0 || >=24.0.0
+      '@vitest/browser-playwright': 4.1.10
+      '@vitest/browser-preview': 4.1.10
+      '@vitest/browser-webdriverio': 4.1.10
+      '@vitest/coverage-istanbul': 4.1.10
+      '@vitest/coverage-v8': 4.1.10
+      '@vitest/ui': 4.1.10
+      happy-dom: '*'
+      jsdom: '*'
+      vite: ^6.0.0 || ^7.0.0 || ^8.0.0
+    peerDependenciesMeta:
+      '@edge-runtime/vm':
+        optional: true
+      '@opentelemetry/api':
+        optional: true
+      '@types/node':
+        optional: true
+      '@vitest/browser-playwright':
+        optional: true
+      '@vitest/browser-preview':
+        optional: true
+      '@vitest/browser-webdriverio':
+        optional: true
+      '@vitest/coverage-istanbul':
+        optional: true
+      '@vitest/coverage-v8':
+        optional: true
+      '@vitest/ui':
+        optional: true
+      happy-dom:
+        optional: true
+      jsdom:
+        optional: true
+
+  which-boxed-primitive@1.1.1:
+    resolution: {integrity: sha512-TbX3mj8n0odCBFVlY8AxkqcHASw3L60jIuF8jFP78az3C2YhmGvqbHBpAjTRH2/xqYunrJ9g1jSyjCjpoWzIAA==}
+    engines: {node: '>= 0.4'}
+
+  which-builtin-type@1.2.1:
+    resolution: {integrity: sha512-6iBczoX+kDQ7a3+YJBnh3T+KZRxM/iYNPXicqk66/Qfm1b93iu+yOImkg0zHbj5LNOcNv1TEADiZ0xa34B4q6Q==}
+    engines: {node: '>= 0.4'}
+
+  which-collection@1.0.2:
+    resolution: {integrity: sha512-K4jVyjnBdgvc86Y6BkaLZEN933SwYOuBFkdmBu9ZfkcAbdVbpITnDmjvZ/aQjRXQrv5EPkTnD1s39GiiqbngCw==}
+    engines: {node: '>= 0.4'}
+
+  which-typed-array@1.1.22:
+    resolution: {integrity: sha512-fvO4ExWMFsqyhG3AiPAObMuY1lxaqgYcxbc49CNdWDDECOJNgQyvsOWVwbZc+qf3rzRtxojBK+CMEv0Ld5CYpw==}
+    engines: {node: '>= 0.4'}
+
+  which@2.0.2:
+    resolution: {integrity: sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==}
+    engines: {node: '>= 8'}
+    hasBin: true
+
+  why-is-node-running@2.3.0:
+    resolution: {integrity: sha512-hUrmaWBdVDcxvYqnyh09zunKzROWjbZTiNy8dBEjkS7ehEDQibXJ7XvlmtbwuTclUiIyN+CyXQD4Vmko8fNm8w==}
+    engines: {node: '>=8'}
+    hasBin: true
+
+  word-wrap@1.2.5:
+    resolution: {integrity: sha512-BN22B5eaMMI9UMtjrGd5g5eCYPpCPDUy0FJXbYsaT5zYxjFOckS53SQDE3pWkVoWpHXVb3BrYcEN4Twa55B5cA==}
+    engines: {node: '>=0.10.0'}
+
+  wrap-ansi@7.0.0:
+    resolution: {integrity: sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==}
+    engines: {node: '>=10'}
+
+  xtend@4.0.2:
+    resolution: {integrity: sha512-LKYU1iAXJXUgAXn9URjiu+MWhyUXHsvfp7mcuYm9dSUKK0/CjtrUwFAxD82/mCWbtLsGjFIad0wIsod4zrTAEQ==}
+    engines: {node: '>=0.4'}
+
+  y18n@5.0.8:
+    resolution: {integrity: sha512-0pfFzegeDWJHJIAmTLRP2DwHjdF5s7jo9tuztdQxAhINCdvS+3nGINqPd00AphqJR/0LhANUS6/+7SCb98YOfA==}
+    engines: {node: '>=10'}
+
+  yallist@3.1.1:
+    resolution: {integrity: sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==}
+
+  yargs-parser@21.1.1:
+    resolution: {integrity: sha512-tVpsJW7DdjecAiFpbIB1e3qxIQsE6NoPc5/eTdrbbIC4h0LVsWhnoa3g+m2HclBIujHzsxZ4VJVA+GUuc2/LBw==}
+    engines: {node: '>=12'}
+
+  yargs@17.7.3:
+    resolution: {integrity: sha512-GZtjxm/J/4TSxuL3FNYjCmLktBTnIw/rVmKSIyKeYAZpmJB2ig9VauCC5xsa82GNKVKDAqpOn3KVzNt0zmrU0g==}
+    engines: {node: '>=12'}
+
+  yocto-queue@0.1.0:
+    resolution: {integrity: sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==}
+    engines: {node: '>=10'}
+
+  zeptomatch@2.1.0:
+    resolution: {integrity: sha512-KiGErG2J0G82LSpniV0CtIzjlJ10E04j02VOudJsPyPwNZgGnRKQy7I1R7GMyg/QswnE4l7ohSGrQbQbjXPPDA==}
+
+  zod-validation-error@4.0.2:
+    resolution: {integrity: sha512-Q6/nZLe6jxuU80qb/4uJ4t5v2VEZ44lzQjPDhYJNztRQ4wyWc6VF3D3Kb/fAuPetZQnhS3hnajCf9CsWesghLQ==}
+    engines: {node: '>=18.0.0'}
+    peerDependencies:
+      zod: ^3.25.0 || ^4.0.0
+
+  zod@4.4.3:
+    resolution: {integrity: sha512-ytENFjIJFl2UwYglde2jchW2Hwm4GJFLDiSXWdTrJQBIN9Fcyp7n4DhxJEiWNAJMV1/BqWfW/kkg71UDcHJyTQ==}
+
+snapshots:
+
+  '@alloc/quick-lru@5.2.0': {}
+
+  '@auth/core@0.41.2':
+    dependencies:
+      '@panva/hkdf': 1.2.1
+      jose: 6.2.3
+      oauth4webapi: 3.8.6
+      preact: 10.24.3
+      preact-render-to-string: 6.5.11(preact@10.24.3)
+
+  '@babel/code-frame@7.29.7':
+    dependencies:
+      '@babel/helper-validator-identifier': 7.29.7
+      js-tokens: 4.0.0
+      picocolors: 1.1.1
+
+  '@babel/compat-data@7.29.7': {}
+
+  '@babel/core@7.29.7':
+    dependencies:
+      '@babel/code-frame': 7.29.7
+      '@babel/generator': 7.29.7
+      '@babel/helper-compilation-targets': 7.29.7
+      '@babel/helper-module-transforms': 7.29.7(@babel/core@7.29.7)
+      '@babel/helpers': 7.29.7
+      '@babel/parser': 7.29.7
+      '@babel/template': 7.29.7
+      '@babel/traverse': 7.29.7
+      '@babel/types': 7.29.7
+      '@jridgewell/remapping': 2.3.5
+      convert-source-map: 2.0.0
+      debug: 4.4.3
+      gensync: 1.0.0-beta.2
+      json5: 2.2.3
+      semver: 6.3.1
+    transitivePeerDependencies:
+      - supports-color
+
+  '@babel/generator@7.29.7':
+    dependencies:
+      '@babel/parser': 7.29.7
+      '@babel/types': 7.29.7
+      '@jridgewell/gen-mapping': 0.3.13
+      '@jridgewell/trace-mapping': 0.3.31
+      jsesc: 3.1.0
+
+  '@babel/helper-compilation-targets@7.29.7':
+    dependencies:
+      '@babel/compat-data': 7.29.7
+      '@babel/helper-validator-option': 7.29.7
+      browserslist: 4.28.6
+      lru-cache: 5.1.1
+      semver: 6.3.1
+
+  '@babel/helper-globals@7.29.7': {}
+
+  '@babel/helper-module-imports@7.29.7':
+    dependencies:
+      '@babel/traverse': 7.29.7
+      '@babel/types': 7.29.7
+    transitivePeerDependencies:
+      - supports-color
+
+  '@babel/helper-module-transforms@7.29.7(@babel/core@7.29.7)':
+    dependencies:
+      '@babel/core': 7.29.7
+      '@babel/helper-module-imports': 7.29.7
+      '@babel/helper-validator-identifier': 7.29.7
+      '@babel/traverse': 7.29.7
+    transitivePeerDependencies:
+      - supports-color
+
+  '@babel/helper-string-parser@7.29.7': {}
+
+  '@babel/helper-validator-identifier@7.29.7': {}
+
+  '@babel/helper-validator-option@7.29.7': {}
+
+  '@babel/helpers@7.29.7':
+    dependencies:
+      '@babel/template': 7.29.7
+      '@babel/types': 7.29.7
+
+  '@babel/parser@7.29.7':
+    dependencies:
+      '@babel/types': 7.29.7
+
+  '@babel/template@7.29.7':
+    dependencies:
+      '@babel/code-frame': 7.29.7
+      '@babel/parser': 7.29.7
+      '@babel/types': 7.29.7
+
+  '@babel/traverse@7.29.7':
+    dependencies:
+      '@babel/code-frame': 7.29.7
+      '@babel/generator': 7.29.7
+      '@babel/helper-globals': 7.29.7
+      '@babel/parser': 7.29.7
+      '@babel/template': 7.29.7
+      '@babel/types': 7.29.7
+      debug: 4.4.3
+    transitivePeerDependencies:
+      - supports-color
+
+  '@babel/types@7.29.7':
+    dependencies:
+      '@babel/helper-string-parser': 7.29.7
+      '@babel/helper-validator-identifier': 7.29.7
+
+  '@electric-sql/pglite-socket@0.1.1(@electric-sql/pglite@0.4.1)':
+    dependencies:
+      '@electric-sql/pglite': 0.4.1
+
+  '@electric-sql/pglite-tools@0.3.1(@electric-sql/pglite@0.4.1)':
+    dependencies:
+      '@electric-sql/pglite': 0.4.1
+
+  '@electric-sql/pglite@0.4.1': {}
+
+  '@emnapi/core@1.10.0':
+    dependencies:
+      '@emnapi/wasi-threads': 1.2.1
+      tslib: 2.8.1
+    optional: true
+
+  '@emnapi/core@1.11.1':
+    dependencies:
+      '@emnapi/wasi-threads': 1.2.2
+      tslib: 2.8.1
+    optional: true
+
+  '@emnapi/runtime@1.10.0':
+    dependencies:
+      tslib: 2.8.1
+    optional: true
+
+  '@emnapi/runtime@1.11.1':
+    dependencies:
+      tslib: 2.8.1
+    optional: true
+
+  '@emnapi/runtime@1.11.2':
+    dependencies:
+      tslib: 2.8.1
+    optional: true
+
+  '@emnapi/wasi-threads@1.2.1':
+    dependencies:
+      tslib: 2.8.1
+    optional: true
+
+  '@emnapi/wasi-threads@1.2.2':
+    dependencies:
+      tslib: 2.8.1
+    optional: true
+
+  '@epic-web/invariant@1.0.0': {}
+
+  '@esbuild/aix-ppc64@0.28.1':
+    optional: true
+
+  '@esbuild/android-arm64@0.28.1':
+    optional: true
+
+  '@esbuild/android-arm@0.28.1':
+    optional: true
+
+  '@esbuild/android-x64@0.28.1':
+    optional: true
+
+  '@esbuild/darwin-arm64@0.28.1':
+    optional: true
+
+  '@esbuild/darwin-x64@0.28.1':
+    optional: true
+
+  '@esbuild/freebsd-arm64@0.28.1':
+    optional: true
+
+  '@esbuild/freebsd-x64@0.28.1':
+    optional: true
+
+  '@esbuild/linux-arm64@0.28.1':
+    optional: true
+
+  '@esbuild/linux-arm@0.28.1':
+    optional: true
+
+  '@esbuild/linux-ia32@0.28.1':
+    optional: true
+
+  '@esbuild/linux-loong64@0.28.1':
+    optional: true
+
+  '@esbuild/linux-mips64el@0.28.1':
+    optional: true
+
+  '@esbuild/linux-ppc64@0.28.1':
+    optional: true
+
+  '@esbuild/linux-riscv64@0.28.1':
+    optional: true
+
+  '@esbuild/linux-s390x@0.28.1':
+    optional: true
+
+  '@esbuild/linux-x64@0.28.1':
+    optional: true
+
+  '@esbuild/netbsd-arm64@0.28.1':
+    optional: true
+
+  '@esbuild/netbsd-x64@0.28.1':
+    optional: true
+
+  '@esbuild/openbsd-arm64@0.28.1':
+    optional: true
+
+  '@esbuild/openbsd-x64@0.28.1':
+    optional: true
+
+  '@esbuild/openharmony-arm64@0.28.1':
+    optional: true
+
+  '@esbuild/sunos-x64@0.28.1':
+    optional: true
+
+  '@esbuild/win32-arm64@0.28.1':
+    optional: true
+
+  '@esbuild/win32-ia32@0.28.1':
+    optional: true
+
+  '@esbuild/win32-x64@0.28.1':
+    optional: true
+
+  '@eslint-community/eslint-utils@4.9.1(eslint@9.39.5(jiti@2.7.0))':
+    dependencies:
+      eslint: 9.39.5(jiti@2.7.0)
+      eslint-visitor-keys: 3.4.3
+
+  '@eslint-community/regexpp@4.12.2': {}
+
+  '@eslint/config-array@0.21.2':
+    dependencies:
+      '@eslint/object-schema': 2.1.7
+      debug: 4.4.3
+      minimatch: 3.1.5
+    transitivePeerDependencies:
+      - supports-color
+
+  '@eslint/config-helpers@0.4.2':
+    dependencies:
+      '@eslint/core': 0.17.0
+
+  '@eslint/core@0.17.0':
+    dependencies:
+      '@types/json-schema': 7.0.15
+
+  '@eslint/eslintrc@3.3.6':
+    dependencies:
+      ajv: 6.15.0
+      debug: 4.4.3
+      espree: 10.4.0
+      globals: 14.0.0
+      ignore: 5.3.2
+      import-fresh: 3.3.1
+      js-yaml: 4.3.0
+      minimatch: 3.1.5
+      strip-json-comments: 3.1.1
+    transitivePeerDependencies:
+      - supports-color
+
+  '@eslint/js@9.39.5': {}
+
+  '@eslint/object-schema@2.1.7': {}
+
+  '@eslint/plugin-kit@0.4.1':
+    dependencies:
+      '@eslint/core': 0.17.0
+      levn: 0.4.1
+
+  '@graphile/logger@0.2.0': {}
+
+  '@hono/node-server@1.19.11(hono@4.12.30)':
+    dependencies:
+      hono: 4.12.30
+
+  '@humanfs/core@0.19.2':
+    dependencies:
+      '@humanfs/types': 0.15.0
+
+  '@humanfs/node@0.16.8':
+    dependencies:
+      '@humanfs/core': 0.19.2
+      '@humanfs/types': 0.15.0
+      '@humanwhocodes/retry': 0.4.3
+
+  '@humanfs/types@0.15.0': {}
+
+  '@humanwhocodes/module-importer@1.0.1': {}
+
+  '@humanwhocodes/retry@0.4.3': {}
+
+  '@img/colour@1.1.0':
+    optional: true
+
+  '@img/sharp-darwin-arm64@0.34.5':
+    optionalDependencies:
+      '@img/sharp-libvips-darwin-arm64': 1.2.4
+    optional: true
+
+  '@img/sharp-darwin-x64@0.34.5':
+    optionalDependencies:
+      '@img/sharp-libvips-darwin-x64': 1.2.4
+    optional: true
+
+  '@img/sharp-libvips-darwin-arm64@1.2.4':
+    optional: true
+
+  '@img/sharp-libvips-darwin-x64@1.2.4':
+    optional: true
+
+  '@img/sharp-libvips-linux-arm64@1.2.4':
+    optional: true
+
+  '@img/sharp-libvips-linux-arm@1.2.4':
+    optional: true
+
+  '@img/sharp-libvips-linux-ppc64@1.2.4':
+    optional: true
+
+  '@img/sharp-libvips-linux-riscv64@1.2.4':
+    optional: true
+
+  '@img/sharp-libvips-linux-s390x@1.2.4':
+    optional: true
+
+  '@img/sharp-libvips-linux-x64@1.2.4':
+    optional: true
+
+  '@img/sharp-libvips-linuxmusl-arm64@1.2.4':
+    optional: true
+
+  '@img/sharp-libvips-linuxmusl-x64@1.2.4':
+    optional: true
+
+  '@img/sharp-linux-arm64@0.34.5':
+    optionalDependencies:
+      '@img/sharp-libvips-linux-arm64': 1.2.4
+    optional: true
+
+  '@img/sharp-linux-arm@0.34.5':
+    optionalDependencies:
+      '@img/sharp-libvips-linux-arm': 1.2.4
+    optional: true
+
+  '@img/sharp-linux-ppc64@0.34.5':
+    optionalDependencies:
+      '@img/sharp-libvips-linux-ppc64': 1.2.4
+    optional: true
+
+  '@img/sharp-linux-riscv64@0.34.5':
+    optionalDependencies:
+      '@img/sharp-libvips-linux-riscv64': 1.2.4
+    optional: true
+
+  '@img/sharp-linux-s390x@0.34.5':
+    optionalDependencies:
+      '@img/sharp-libvips-linux-s390x': 1.2.4
+    optional: true
+
+  '@img/sharp-linux-x64@0.34.5':
+    optionalDependencies:
+      '@img/sharp-libvips-linux-x64': 1.2.4
+    optional: true
+
+  '@img/sharp-linuxmusl-arm64@0.34.5':
+    optionalDependencies:
+      '@img/sharp-libvips-linuxmusl-arm64': 1.2.4
+    optional: true
+
+  '@img/sharp-linuxmusl-x64@0.34.5':
+    optionalDependencies:
+      '@img/sharp-libvips-linuxmusl-x64': 1.2.4
+    optional: true
+
+  '@img/sharp-wasm32@0.34.5':
+    dependencies:
+      '@emnapi/runtime': 1.11.2
+    optional: true
+
+  '@img/sharp-win32-arm64@0.34.5':
+    optional: true
+
+  '@img/sharp-win32-ia32@0.34.5':
+    optional: true
+
+  '@img/sharp-win32-x64@0.34.5':
+    optional: true
+
+  '@jridgewell/gen-mapping@0.3.13':
+    dependencies:
+      '@jridgewell/sourcemap-codec': 1.5.5
+      '@jridgewell/trace-mapping': 0.3.31
+
+  '@jridgewell/remapping@2.3.5':
+    dependencies:
+      '@jridgewell/gen-mapping': 0.3.13
+      '@jridgewell/trace-mapping': 0.3.31
+
+  '@jridgewell/resolve-uri@3.1.2': {}
+
+  '@jridgewell/sourcemap-codec@1.5.5': {}
+
+  '@jridgewell/trace-mapping@0.3.31':
+    dependencies:
+      '@jridgewell/resolve-uri': 3.1.2
+      '@jridgewell/sourcemap-codec': 1.5.5
+
+  '@kurkle/color@0.3.4': {}
+
+  '@napi-rs/wasm-runtime@1.1.6(@emnapi/core@1.10.0)(@emnapi/runtime@1.10.0)':
+    dependencies:
+      '@emnapi/core': 1.10.0
+      '@emnapi/runtime': 1.10.0
+      '@tybys/wasm-util': 0.10.3
+    optional: true
+
+  '@napi-rs/wasm-runtime@1.1.6(@emnapi/core@1.11.1)(@emnapi/runtime@1.11.1)':
+    dependencies:
+      '@emnapi/core': 1.11.1
+      '@emnapi/runtime': 1.11.1
+      '@tybys/wasm-util': 0.10.3
+    optional: true
+
+  '@next/env@16.2.10': {}
+
+  '@next/eslint-plugin-next@16.2.10':
+    dependencies:
+      fast-glob: 3.3.1
+
+  '@next/swc-darwin-arm64@16.2.10':
+    optional: true
+
+  '@next/swc-darwin-x64@16.2.10':
+    optional: true
+
+  '@next/swc-linux-arm64-gnu@16.2.10':
+    optional: true
+
+  '@next/swc-linux-arm64-musl@16.2.10':
+    optional: true
+
+  '@next/swc-linux-x64-gnu@16.2.10':
+    optional: true
+
+  '@next/swc-linux-x64-musl@16.2.10':
+    optional: true
+
+  '@next/swc-win32-arm64-msvc@16.2.10':
+    optional: true
+
+  '@next/swc-win32-x64-msvc@16.2.10':
+    optional: true
+
+  '@nodelib/fs.scandir@2.1.5':
+    dependencies:
+      '@nodelib/fs.stat': 2.0.5
+      run-parallel: 1.2.0
+
+  '@nodelib/fs.stat@2.0.5': {}
+
+  '@nodelib/fs.walk@1.2.8':
+    dependencies:
+      '@nodelib/fs.scandir': 2.1.5
+      fastq: 1.20.1
+
+  '@nolyfill/is-core-module@1.0.39': {}
+
+  '@oxc-project/types@0.139.0': {}
+
+  '@panva/hkdf@1.2.1': {}
+
+  '@phc/format@1.0.0': {}
+
+  '@prisma/adapter-pg@7.8.0':
+    dependencies:
+      '@prisma/driver-adapter-utils': 7.8.0
+      '@types/pg': 8.20.0
+      pg: 8.22.0
+      postgres-array: 3.0.4
+    transitivePeerDependencies:
+      - pg-native
+
+  '@prisma/client-runtime-utils@7.8.0': {}
+
+  '@prisma/client@7.8.0(prisma@7.8.0(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)(typescript@5.9.3))(typescript@5.9.3)':
+    dependencies:
+      '@prisma/client-runtime-utils': 7.8.0
+    optionalDependencies:
+      prisma: 7.8.0(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)(typescript@5.9.3)
+      typescript: 5.9.3
+
+  '@prisma/config@7.8.0':
+    dependencies:
+      c12: 3.3.4
+      deepmerge-ts: 7.1.5
+      effect: 3.20.0
+      empathic: 2.0.0
+    transitivePeerDependencies:
+      - magicast
+
+  '@prisma/debug@7.2.0': {}
+
+  '@prisma/debug@7.8.0': {}
+
+  '@prisma/dev@0.24.3(typescript@5.9.3)':
+    dependencies:
+      '@electric-sql/pglite': 0.4.1
+      '@electric-sql/pglite-socket': 0.1.1(@electric-sql/pglite@0.4.1)
+      '@electric-sql/pglite-tools': 0.3.1(@electric-sql/pglite@0.4.1)
+      '@hono/node-server': 1.19.11(hono@4.12.30)
+      '@prisma/get-platform': 7.2.0
+      '@prisma/query-plan-executor': 7.2.0
+      '@prisma/streams-local': 0.1.2
+      foreground-child: 3.3.1
+      get-port-please: 3.2.0
+      hono: 4.12.30
+      http-status-codes: 2.3.0
+      pathe: 2.0.3
+      proper-lockfile: 4.1.2
+      remeda: 2.33.4
+      std-env: 3.10.0
+      valibot: 1.2.0(typescript@5.9.3)
+      zeptomatch: 2.1.0
+    transitivePeerDependencies:
+      - typescript
+
+  '@prisma/driver-adapter-utils@7.8.0':
+    dependencies:
+      '@prisma/debug': 7.8.0
+
+  '@prisma/engines-version@7.8.0-6.3c6e192761c0362d496ed980de936e2f3cebcd3a': {}
+
+  '@prisma/engines@7.8.0':
+    dependencies:
+      '@prisma/debug': 7.8.0
+      '@prisma/engines-version': 7.8.0-6.3c6e192761c0362d496ed980de936e2f3cebcd3a
+      '@prisma/fetch-engine': 7.8.0
+      '@prisma/get-platform': 7.8.0
+
+  '@prisma/fetch-engine@7.8.0':
+    dependencies:
+      '@prisma/debug': 7.8.0
+      '@prisma/engines-version': 7.8.0-6.3c6e192761c0362d496ed980de936e2f3cebcd3a
+      '@prisma/get-platform': 7.8.0
+
+  '@prisma/get-platform@7.2.0':
+    dependencies:
+      '@prisma/debug': 7.2.0
+
+  '@prisma/get-platform@7.8.0':
+    dependencies:
+      '@prisma/debug': 7.8.0
+
+  '@prisma/query-plan-executor@7.2.0': {}
+
+  '@prisma/streams-local@0.1.2':
+    dependencies:
+      ajv: 8.20.0
+      better-result: 2.9.2
+      env-paths: 3.0.0
+      proper-lockfile: 4.1.2
+
+  '@prisma/studio-core@0.27.3(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)':
+    dependencies:
+      '@radix-ui/react-toggle': 1.1.10(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)
+      '@types/react': 19.2.17
+      chart.js: 4.5.1
+      react: 19.2.4
+      react-dom: 19.2.4(react@19.2.4)
+    transitivePeerDependencies:
+      - '@types/react-dom'
+
+  '@radix-ui/primitive@1.1.3': {}
+
+  '@radix-ui/react-compose-refs@1.1.2(@types/react@19.2.17)(react@19.2.4)':
+    dependencies:
+      react: 19.2.4
+    optionalDependencies:
+      '@types/react': 19.2.17
+
+  '@radix-ui/react-primitive@2.1.3(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)':
+    dependencies:
+      '@radix-ui/react-slot': 1.2.3(@types/react@19.2.17)(react@19.2.4)
+      react: 19.2.4
+      react-dom: 19.2.4(react@19.2.4)
+    optionalDependencies:
+      '@types/react': 19.2.17
+      '@types/react-dom': 19.2.3(@types/react@19.2.17)
+
+  '@radix-ui/react-slot@1.2.3(@types/react@19.2.17)(react@19.2.4)':
+    dependencies:
+      '@radix-ui/react-compose-refs': 1.1.2(@types/react@19.2.17)(react@19.2.4)
+      react: 19.2.4
+    optionalDependencies:
+      '@types/react': 19.2.17
+
+  '@radix-ui/react-toggle@1.1.10(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)':
+    dependencies:
+      '@radix-ui/primitive': 1.1.3
+      '@radix-ui/react-primitive': 2.1.3(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)
+      '@radix-ui/react-use-controllable-state': 1.2.2(@types/react@19.2.17)(react@19.2.4)
+      react: 19.2.4
+      react-dom: 19.2.4(react@19.2.4)
+    optionalDependencies:
+      '@types/react': 19.2.17
+      '@types/react-dom': 19.2.3(@types/react@19.2.17)
+
+  '@radix-ui/react-use-controllable-state@1.2.2(@types/react@19.2.17)(react@19.2.4)':
+    dependencies:
+      '@radix-ui/react-use-effect-event': 0.0.2(@types/react@19.2.17)(react@19.2.4)
+      '@radix-ui/react-use-layout-effect': 1.1.1(@types/react@19.2.17)(react@19.2.4)
+      react: 19.2.4
+    optionalDependencies:
+      '@types/react': 19.2.17
+
+  '@radix-ui/react-use-effect-event@0.0.2(@types/react@19.2.17)(react@19.2.4)':
+    dependencies:
+      '@radix-ui/react-use-layout-effect': 1.1.1(@types/react@19.2.17)(react@19.2.4)
+      react: 19.2.4
+    optionalDependencies:
+      '@types/react': 19.2.17
+
+  '@radix-ui/react-use-layout-effect@1.1.1(@types/react@19.2.17)(react@19.2.4)':
+    dependencies:
+      react: 19.2.4
+    optionalDependencies:
+      '@types/react': 19.2.17
+
+  '@rolldown/binding-android-arm64@1.1.5':
+    optional: true
+
+  '@rolldown/binding-darwin-arm64@1.1.5':
+    optional: true
+
+  '@rolldown/binding-darwin-x64@1.1.5':
+    optional: true
+
+  '@rolldown/binding-freebsd-x64@1.1.5':
+    optional: true
+
+  '@rolldown/binding-linux-arm-gnueabihf@1.1.5':
+    optional: true
+
+  '@rolldown/binding-linux-arm64-gnu@1.1.5':
+    optional: true
+
+  '@rolldown/binding-linux-arm64-musl@1.1.5':
+    optional: true
+
+  '@rolldown/binding-linux-ppc64-gnu@1.1.5':
+    optional: true
+
+  '@rolldown/binding-linux-s390x-gnu@1.1.5':
+    optional: true
+
+  '@rolldown/binding-linux-x64-gnu@1.1.5':
+    optional: true
+
+  '@rolldown/binding-linux-x64-musl@1.1.5':
+    optional: true
+
+  '@rolldown/binding-openharmony-arm64@1.1.5':
+    optional: true
+
+  '@rolldown/binding-wasm32-wasi@1.1.5':
+    dependencies:
+      '@emnapi/core': 1.11.1
+      '@emnapi/runtime': 1.11.1
+      '@napi-rs/wasm-runtime': 1.1.6(@emnapi/core@1.11.1)(@emnapi/runtime@1.11.1)
+    optional: true
+
+  '@rolldown/binding-win32-arm64-msvc@1.1.5':
+    optional: true
+
+  '@rolldown/binding-win32-x64-msvc@1.1.5':
+    optional: true
+
+  '@rolldown/pluginutils@1.0.1': {}
+
+  '@rtsao/scc@1.1.0': {}
+
+  '@standard-schema/spec@1.1.0': {}
+
+  '@swc/helpers@0.5.15':
+    dependencies:
+      tslib: 2.8.1
+
+  '@tailwindcss/node@4.3.2':
+    dependencies:
+      '@jridgewell/remapping': 2.3.5
+      enhanced-resolve: 5.21.6
+      jiti: 2.7.0
+      lightningcss: 1.32.0
+      magic-string: 0.30.21
+      source-map-js: 1.2.1
+      tailwindcss: 4.3.2
+
+  '@tailwindcss/oxide-android-arm64@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-darwin-arm64@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-darwin-x64@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-freebsd-x64@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-linux-arm-gnueabihf@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-linux-arm64-gnu@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-linux-arm64-musl@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-linux-x64-gnu@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-linux-x64-musl@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-wasm32-wasi@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-win32-arm64-msvc@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide-win32-x64-msvc@4.3.2':
+    optional: true
+
+  '@tailwindcss/oxide@4.3.2':
+    optionalDependencies:
+      '@tailwindcss/oxide-android-arm64': 4.3.2
+      '@tailwindcss/oxide-darwin-arm64': 4.3.2
+      '@tailwindcss/oxide-darwin-x64': 4.3.2
+      '@tailwindcss/oxide-freebsd-x64': 4.3.2
+      '@tailwindcss/oxide-linux-arm-gnueabihf': 4.3.2
+      '@tailwindcss/oxide-linux-arm64-gnu': 4.3.2
+      '@tailwindcss/oxide-linux-arm64-musl': 4.3.2
+      '@tailwindcss/oxide-linux-x64-gnu': 4.3.2
+      '@tailwindcss/oxide-linux-x64-musl': 4.3.2
+      '@tailwindcss/oxide-wasm32-wasi': 4.3.2
+      '@tailwindcss/oxide-win32-arm64-msvc': 4.3.2
+      '@tailwindcss/oxide-win32-x64-msvc': 4.3.2
+
+  '@tailwindcss/postcss@4.3.2':
+    dependencies:
+      '@alloc/quick-lru': 5.2.0
+      '@tailwindcss/node': 4.3.2
+      '@tailwindcss/oxide': 4.3.2
+      postcss: 8.5.19
+      tailwindcss: 4.3.2
+
+  '@tybys/wasm-util@0.10.3':
+    dependencies:
+      tslib: 2.8.1
+    optional: true
+
+  '@types/chai@5.2.3':
+    dependencies:
+      '@types/deep-eql': 4.0.2
+      assertion-error: 2.0.1
+
+  '@types/debug@4.1.13':
+    dependencies:
+      '@types/ms': 2.1.0
+
+  '@types/deep-eql@4.0.2': {}
+
+  '@types/estree@1.0.9': {}
+
+  '@types/interpret@1.1.4':
+    dependencies:
+      '@types/node': 20.19.43
+
+  '@types/json-schema@7.0.15': {}
+
+  '@types/json5@0.0.29': {}
+
+  '@types/ms@2.1.0': {}
+
+  '@types/node@20.19.43':
+    dependencies:
+      undici-types: 6.21.0
+
+  '@types/node@22.20.1':
+    dependencies:
+      undici-types: 6.21.0
+
+  '@types/pg@8.20.0':
+    dependencies:
+      '@types/node': 20.19.43
+      pg-protocol: 1.15.0
+      pg-types: 2.2.0
+
+  '@types/react-dom@19.2.3(@types/react@19.2.17)':
+    dependencies:
+      '@types/react': 19.2.17
+
+  '@types/react@19.2.17':
+    dependencies:
+      csstype: 3.2.3
+
+  '@types/semver@7.7.1': {}
+
+  '@typescript-eslint/eslint-plugin@8.64.0(@typescript-eslint/parser@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3))(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)':
+    dependencies:
+      '@eslint-community/regexpp': 4.12.2
+      '@typescript-eslint/parser': 8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+      '@typescript-eslint/scope-manager': 8.64.0
+      '@typescript-eslint/type-utils': 8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+      '@typescript-eslint/utils': 8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+      '@typescript-eslint/visitor-keys': 8.64.0
+      eslint: 9.39.5(jiti@2.7.0)
+      ignore: 7.0.6
+      natural-compare: 1.4.0
+      ts-api-utils: 2.5.0(typescript@5.9.3)
+      typescript: 5.9.3
+    transitivePeerDependencies:
+      - supports-color
+
+  '@typescript-eslint/parser@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)':
+    dependencies:
+      '@typescript-eslint/scope-manager': 8.64.0
+      '@typescript-eslint/types': 8.64.0
+      '@typescript-eslint/typescript-estree': 8.64.0(typescript@5.9.3)
+      '@typescript-eslint/visitor-keys': 8.64.0
+      debug: 4.4.3
+      eslint: 9.39.5(jiti@2.7.0)
+      typescript: 5.9.3
+    transitivePeerDependencies:
+      - supports-color
+
+  '@typescript-eslint/project-service@8.64.0(typescript@5.9.3)':
+    dependencies:
+      '@typescript-eslint/tsconfig-utils': 8.64.0(typescript@5.9.3)
+      '@typescript-eslint/types': 8.64.0
+      debug: 4.4.3
+      typescript: 5.9.3
+    transitivePeerDependencies:
+      - supports-color
+
+  '@typescript-eslint/scope-manager@8.64.0':
+    dependencies:
+      '@typescript-eslint/types': 8.64.0
+      '@typescript-eslint/visitor-keys': 8.64.0
+
+  '@typescript-eslint/tsconfig-utils@8.64.0(typescript@5.9.3)':
+    dependencies:
+      typescript: 5.9.3
+
+  '@typescript-eslint/type-utils@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)':
+    dependencies:
+      '@typescript-eslint/types': 8.64.0
+      '@typescript-eslint/typescript-estree': 8.64.0(typescript@5.9.3)
+      '@typescript-eslint/utils': 8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+      debug: 4.4.3
+      eslint: 9.39.5(jiti@2.7.0)
+      ts-api-utils: 2.5.0(typescript@5.9.3)
+      typescript: 5.9.3
+    transitivePeerDependencies:
+      - supports-color
+
+  '@typescript-eslint/types@8.64.0': {}
+
+  '@typescript-eslint/typescript-estree@8.64.0(typescript@5.9.3)':
+    dependencies:
+      '@typescript-eslint/project-service': 8.64.0(typescript@5.9.3)
+      '@typescript-eslint/tsconfig-utils': 8.64.0(typescript@5.9.3)
+      '@typescript-eslint/types': 8.64.0
+      '@typescript-eslint/visitor-keys': 8.64.0
+      debug: 4.4.3
+      minimatch: 10.2.5
+      semver: 7.8.5
+      tinyglobby: 0.2.17
+      ts-api-utils: 2.5.0(typescript@5.9.3)
+      typescript: 5.9.3
+    transitivePeerDependencies:
+      - supports-color
+
+  '@typescript-eslint/utils@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)':
+    dependencies:
+      '@eslint-community/eslint-utils': 4.9.1(eslint@9.39.5(jiti@2.7.0))
+      '@typescript-eslint/scope-manager': 8.64.0
+      '@typescript-eslint/types': 8.64.0
+      '@typescript-eslint/typescript-estree': 8.64.0(typescript@5.9.3)
+      eslint: 9.39.5(jiti@2.7.0)
+      typescript: 5.9.3
+    transitivePeerDependencies:
+      - supports-color
+
+  '@typescript-eslint/visitor-keys@8.64.0':
+    dependencies:
+      '@typescript-eslint/types': 8.64.0
+      eslint-visitor-keys: 5.0.1
+
+  '@unrs/resolver-binding-android-arm-eabi@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-android-arm64@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-darwin-arm64@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-darwin-x64@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-freebsd-x64@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-arm-gnueabihf@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-arm-musleabihf@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-arm64-gnu@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-arm64-musl@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-loong64-gnu@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-loong64-musl@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-ppc64-gnu@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-riscv64-gnu@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-riscv64-musl@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-s390x-gnu@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-x64-gnu@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-linux-x64-musl@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-openharmony-arm64@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-wasm32-wasi@1.12.2':
+    dependencies:
+      '@emnapi/core': 1.10.0
+      '@emnapi/runtime': 1.10.0
+      '@napi-rs/wasm-runtime': 1.1.6(@emnapi/core@1.10.0)(@emnapi/runtime@1.10.0)
+    optional: true
+
+  '@unrs/resolver-binding-win32-arm64-msvc@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-win32-ia32-msvc@1.12.2':
+    optional: true
+
+  '@unrs/resolver-binding-win32-x64-msvc@1.12.2':
+    optional: true
+
+  '@vitest/expect@4.1.10':
+    dependencies:
+      '@standard-schema/spec': 1.1.0
+      '@types/chai': 5.2.3
+      '@vitest/spy': 4.1.10
+      '@vitest/utils': 4.1.10
+      chai: 6.2.2
+      tinyrainbow: 3.1.0
+
+  '@vitest/mocker@4.1.10(vite@8.1.5(@types/node@20.19.43)(esbuild@0.28.1)(jiti@2.7.0)(tsx@4.23.1))':
+    dependencies:
+      '@vitest/spy': 4.1.10
+      estree-walker: 3.0.3
+      magic-string: 0.30.21
+    optionalDependencies:
+      vite: 8.1.5(@types/node@20.19.43)(esbuild@0.28.1)(jiti@2.7.0)(tsx@4.23.1)
+
+  '@vitest/pretty-format@4.1.10':
+    dependencies:
+      tinyrainbow: 3.1.0
+
+  '@vitest/runner@4.1.10':
+    dependencies:
+      '@vitest/utils': 4.1.10
+      pathe: 2.0.3
+
+  '@vitest/snapshot@4.1.10':
+    dependencies:
+      '@vitest/pretty-format': 4.1.10
+      '@vitest/utils': 4.1.10
+      magic-string: 0.30.21
+      pathe: 2.0.3
+
+  '@vitest/spy@4.1.10': {}
+
+  '@vitest/utils@4.1.10':
+    dependencies:
+      '@vitest/pretty-format': 4.1.10
+      convert-source-map: 2.0.0
+      tinyrainbow: 3.1.0
+
+  acorn-jsx@5.3.2(acorn@8.17.0):
+    dependencies:
+      acorn: 8.17.0
+
+  acorn@8.17.0: {}
+
+  ajv@6.15.0:
+    dependencies:
+      fast-deep-equal: 3.1.3
+      fast-json-stable-stringify: 2.1.0
+      json-schema-traverse: 0.4.1
+      uri-js: 4.4.1
+
+  ajv@8.20.0:
+    dependencies:
+      fast-deep-equal: 3.1.3
+      fast-uri: 3.1.3
+      json-schema-traverse: 1.0.0
+      require-from-string: 2.0.2
+
+  ansi-regex@5.0.1: {}
+
+  ansi-styles@4.3.0:
+    dependencies:
+      color-convert: 2.0.1
+
+  argon2@0.44.0:
+    dependencies:
+      '@phc/format': 1.0.0
+      cross-env: 10.1.0
+      node-addon-api: 8.9.0
+      node-gyp-build: 4.8.4
+
+  argparse@2.0.1: {}
+
+  aria-query@5.3.2: {}
+
+  array-buffer-byte-length@1.0.2:
+    dependencies:
+      call-bound: 1.0.4
+      is-array-buffer: 3.0.5
+
+  array-includes@3.1.9:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-object-atoms: 1.1.2
+      get-intrinsic: 1.3.0
+      is-string: 1.1.1
+      math-intrinsics: 1.1.0
+
+  array.prototype.findlast@1.2.5:
+    dependencies:
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-errors: 1.3.0
+      es-object-atoms: 1.1.2
+      es-shim-unscopables: 1.1.0
+
+  array.prototype.findlastindex@1.2.6:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-errors: 1.3.0
+      es-object-atoms: 1.1.2
+      es-shim-unscopables: 1.1.0
+
+  array.prototype.flat@1.3.3:
+    dependencies:
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-shim-unscopables: 1.1.0
+
+  array.prototype.flatmap@1.3.3:
+    dependencies:
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-shim-unscopables: 1.1.0
+
+  array.prototype.tosorted@1.1.4:
+    dependencies:
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-errors: 1.3.0
+      es-shim-unscopables: 1.1.0
+
+  arraybuffer.prototype.slice@1.0.4:
+    dependencies:
+      array-buffer-byte-length: 1.0.2
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-errors: 1.3.0
+      get-intrinsic: 1.3.0
+      is-array-buffer: 3.0.5
+
+  assertion-error@2.0.1: {}
+
+  ast-types-flow@0.0.8: {}
+
+  async-function@1.0.0: {}
+
+  available-typed-arrays@1.0.7:
+    dependencies:
+      possible-typed-array-names: 1.1.0
+
+  aws-ssl-profiles@1.1.2: {}
+
+  axe-core@4.12.1: {}
+
+  axobject-query@4.1.0: {}
+
+  balanced-match@1.0.2: {}
+
+  balanced-match@4.0.4: {}
+
+  baseline-browser-mapping@2.10.43: {}
+
+  better-result@2.9.2: {}
+
+  brace-expansion@1.1.16:
+    dependencies:
+      balanced-match: 1.0.2
+      concat-map: 0.0.1
+
+  brace-expansion@5.0.7:
+    dependencies:
+      balanced-match: 4.0.4
+
+  braces@3.0.3:
+    dependencies:
+      fill-range: 7.1.1
+
+  browserslist@4.28.6:
+    dependencies:
+      baseline-browser-mapping: 2.10.43
+      caniuse-lite: 1.0.30001806
+      electron-to-chromium: 1.5.392
+      node-releases: 2.0.51
+      update-browserslist-db: 1.2.3(browserslist@4.28.6)
+
+  c12@3.3.4:
+    dependencies:
+      chokidar: 5.0.0
+      confbox: 0.2.4
+      defu: 6.1.7
+      dotenv: 17.4.2
+      exsolve: 1.1.0
+      giget: 3.3.0
+      jiti: 2.7.0
+      ohash: 2.0.11
+      pathe: 2.0.3
+      perfect-debounce: 2.1.0
+      pkg-types: 2.3.1
+      rc9: 3.0.1
+
+  call-bind-apply-helpers@1.0.2:
+    dependencies:
+      es-errors: 1.3.0
+      function-bind: 1.1.2
+
+  call-bind@1.0.9:
+    dependencies:
+      call-bind-apply-helpers: 1.0.2
+      es-define-property: 1.0.1
+      get-intrinsic: 1.3.0
+      set-function-length: 1.2.2
+
+  call-bound@1.0.4:
+    dependencies:
+      call-bind-apply-helpers: 1.0.2
+      get-intrinsic: 1.3.0
+
+  callsites@3.1.0: {}
+
+  caniuse-lite@1.0.30001806: {}
+
+  chai@6.2.2: {}
+
+  chalk@4.1.2:
+    dependencies:
+      ansi-styles: 4.3.0
+      supports-color: 7.2.0
+
+  chart.js@4.5.1:
+    dependencies:
+      '@kurkle/color': 0.3.4
+
+  chokidar@5.0.0:
+    dependencies:
+      readdirp: 5.0.0
+
+  client-only@0.0.1: {}
+
+  cliui@8.0.1:
+    dependencies:
+      string-width: 4.2.3
+      strip-ansi: 6.0.1
+      wrap-ansi: 7.0.0
+
+  color-convert@2.0.1:
+    dependencies:
+      color-name: 1.1.4
+
+  color-name@1.1.4: {}
+
+  concat-map@0.0.1: {}
+
+  confbox@0.2.4: {}
+
+  convert-source-map@2.0.0: {}
+
+  cosmiconfig@8.3.6(typescript@5.9.3):
+    dependencies:
+      import-fresh: 3.3.1
+      js-yaml: 4.3.0
+      parse-json: 5.2.0
+      path-type: 4.0.0
+    optionalDependencies:
+      typescript: 5.9.3
+
+  cross-env@10.1.0:
+    dependencies:
+      '@epic-web/invariant': 1.0.0
+      cross-spawn: 7.0.6
+
+  cross-spawn@7.0.6:
+    dependencies:
+      path-key: 3.1.1
+      shebang-command: 2.0.0
+      which: 2.0.2
+
+  csstype@3.2.3: {}
+
+  damerau-levenshtein@1.0.8: {}
+
+  data-view-buffer@1.0.2:
+    dependencies:
+      call-bound: 1.0.4
+      es-errors: 1.3.0
+      is-data-view: 1.0.2
+
+  data-view-byte-length@1.0.2:
+    dependencies:
+      call-bound: 1.0.4
+      es-errors: 1.3.0
+      is-data-view: 1.0.2
+
+  data-view-byte-offset@1.0.1:
+    dependencies:
+      call-bound: 1.0.4
+      es-errors: 1.3.0
+      is-data-view: 1.0.2
+
+  debug@3.2.7:
+    dependencies:
+      ms: 2.1.3
+
+  debug@4.4.3:
+    dependencies:
+      ms: 2.1.3
+
+  decimal.js@10.6.0: {}
+
+  deep-is@0.1.4: {}
+
+  deepmerge-ts@7.1.5: {}
+
+  define-data-property@1.1.4:
+    dependencies:
+      es-define-property: 1.0.1
+      es-errors: 1.3.0
+      gopd: 1.2.0
+
+  define-properties@1.2.1:
+    dependencies:
+      define-data-property: 1.1.4
+      has-property-descriptors: 1.0.2
+      object-keys: 1.1.1
+
+  defu@6.1.7: {}
+
+  denque@2.1.0: {}
+
+  destr@2.0.5: {}
+
+  detect-libc@2.1.2: {}
+
+  doctrine@2.1.0:
+    dependencies:
+      esutils: 2.0.3
+
+  dotenv@17.4.2: {}
+
+  dunder-proto@1.0.1:
+    dependencies:
+      call-bind-apply-helpers: 1.0.2
+      es-errors: 1.3.0
+      gopd: 1.2.0
+
+  effect@3.20.0:
+    dependencies:
+      '@standard-schema/spec': 1.1.0
+      fast-check: 3.23.2
+
+  electron-to-chromium@1.5.392: {}
+
+  emoji-regex@8.0.0: {}
+
+  emoji-regex@9.2.2: {}
+
+  empathic@2.0.0: {}
+
+  enhanced-resolve@5.21.6:
+    dependencies:
+      graceful-fs: 4.2.11
+      tapable: 2.3.3
+
+  env-paths@3.0.0: {}
+
+  error-ex@1.3.4:
+    dependencies:
+      is-arrayish: 0.2.1
+
+  es-abstract-get@1.0.0:
+    dependencies:
+      es-errors: 1.3.0
+      es-object-atoms: 1.1.2
+      is-callable: 1.2.7
+      object-inspect: 1.13.4
+
+  es-abstract@1.24.2:
+    dependencies:
+      array-buffer-byte-length: 1.0.2
+      arraybuffer.prototype.slice: 1.0.4
+      available-typed-arrays: 1.0.7
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      data-view-buffer: 1.0.2
+      data-view-byte-length: 1.0.2
+      data-view-byte-offset: 1.0.1
+      es-define-property: 1.0.1
+      es-errors: 1.3.0
+      es-object-atoms: 1.1.2
+      es-set-tostringtag: 2.1.0
+      es-to-primitive: 1.3.4
+      function.prototype.name: 1.2.0
+      get-intrinsic: 1.3.0
+      get-proto: 1.0.1
+      get-symbol-description: 1.1.0
+      globalthis: 1.0.4
+      gopd: 1.2.0
+      has-property-descriptors: 1.0.2
+      has-proto: 1.2.0
+      has-symbols: 1.1.0
+      hasown: 2.0.4
+      internal-slot: 1.1.0
+      is-array-buffer: 3.0.5
+      is-callable: 1.2.7
+      is-data-view: 1.0.2
+      is-negative-zero: 2.0.3
+      is-regex: 1.2.1
+      is-set: 2.0.3
+      is-shared-array-buffer: 1.0.4
+      is-string: 1.1.1
+      is-typed-array: 1.1.15
+      is-weakref: 1.1.1
+      math-intrinsics: 1.1.0
+      object-inspect: 1.13.4
+      object-keys: 1.1.1
+      object.assign: 4.1.7
+      own-keys: 1.0.1
+      regexp.prototype.flags: 1.5.4
+      safe-array-concat: 1.1.4
+      safe-push-apply: 1.0.0
+      safe-regex-test: 1.1.0
+      set-proto: 1.0.0
+      stop-iteration-iterator: 1.1.0
+      string.prototype.trim: 1.2.11
+      string.prototype.trimend: 1.0.10
+      string.prototype.trimstart: 1.0.8
+      typed-array-buffer: 1.0.3
+      typed-array-byte-length: 1.0.3
+      typed-array-byte-offset: 1.0.4
+      typed-array-length: 1.0.8
+      unbox-primitive: 1.1.0
+      which-typed-array: 1.1.22
+
+  es-define-property@1.0.1: {}
+
+  es-errors@1.3.0: {}
+
+  es-iterator-helpers@1.4.0:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-errors: 1.3.0
+      es-set-tostringtag: 2.1.0
+      function-bind: 1.1.2
+      get-intrinsic: 1.3.0
+      globalthis: 1.0.4
+      gopd: 1.2.0
+      has-property-descriptors: 1.0.2
+      has-proto: 1.2.0
+      has-symbols: 1.1.0
+      internal-slot: 1.1.0
+      iterator.prototype: 1.1.5
+      math-intrinsics: 1.1.0
+
+  es-module-lexer@2.3.1: {}
+
+  es-object-atoms@1.1.2:
+    dependencies:
+      es-errors: 1.3.0
+
+  es-set-tostringtag@2.1.0:
+    dependencies:
+      es-errors: 1.3.0
+      get-intrinsic: 1.3.0
+      has-tostringtag: 1.0.2
+      hasown: 2.0.4
+
+  es-shim-unscopables@1.1.0:
+    dependencies:
+      hasown: 2.0.4
+
+  es-to-primitive@1.3.4:
+    dependencies:
+      es-abstract-get: 1.0.0
+      es-define-property: 1.0.1
+      es-errors: 1.3.0
+      is-callable: 1.2.7
+      is-date-object: 1.1.0
+      is-symbol: 1.1.1
+
+  esbuild@0.28.1:
+    optionalDependencies:
+      '@esbuild/aix-ppc64': 0.28.1
+      '@esbuild/android-arm': 0.28.1
+      '@esbuild/android-arm64': 0.28.1
+      '@esbuild/android-x64': 0.28.1
+      '@esbuild/darwin-arm64': 0.28.1
+      '@esbuild/darwin-x64': 0.28.1
+      '@esbuild/freebsd-arm64': 0.28.1
+      '@esbuild/freebsd-x64': 0.28.1
+      '@esbuild/linux-arm': 0.28.1
+      '@esbuild/linux-arm64': 0.28.1
+      '@esbuild/linux-ia32': 0.28.1
+      '@esbuild/linux-loong64': 0.28.1
+      '@esbuild/linux-mips64el': 0.28.1
+      '@esbuild/linux-ppc64': 0.28.1
+      '@esbuild/linux-riscv64': 0.28.1
+      '@esbuild/linux-s390x': 0.28.1
+      '@esbuild/linux-x64': 0.28.1
+      '@esbuild/netbsd-arm64': 0.28.1
+      '@esbuild/netbsd-x64': 0.28.1
+      '@esbuild/openbsd-arm64': 0.28.1
+      '@esbuild/openbsd-x64': 0.28.1
+      '@esbuild/openharmony-arm64': 0.28.1
+      '@esbuild/sunos-x64': 0.28.1
+      '@esbuild/win32-arm64': 0.28.1
+      '@esbuild/win32-ia32': 0.28.1
+      '@esbuild/win32-x64': 0.28.1
+
+  escalade@3.2.0: {}
+
+  escape-string-regexp@4.0.0: {}
+
+  eslint-config-next@16.2.10(@typescript-eslint/parser@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3))(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3):
+    dependencies:
+      '@next/eslint-plugin-next': 16.2.10
+      eslint: 9.39.5(jiti@2.7.0)
+      eslint-import-resolver-node: 0.3.10
+      eslint-import-resolver-typescript: 3.10.1(eslint-plugin-import@2.32.0)(eslint@9.39.5(jiti@2.7.0))
+      eslint-plugin-import: 2.32.0(@typescript-eslint/parser@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3))(eslint-import-resolver-typescript@3.10.1)(eslint@9.39.5(jiti@2.7.0))
+      eslint-plugin-jsx-a11y: 6.10.2(eslint@9.39.5(jiti@2.7.0))
+      eslint-plugin-react: 7.37.5(eslint@9.39.5(jiti@2.7.0))
+      eslint-plugin-react-hooks: 7.1.1(eslint@9.39.5(jiti@2.7.0))
+      globals: 16.4.0
+      typescript-eslint: 8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+    optionalDependencies:
+      typescript: 5.9.3
+    transitivePeerDependencies:
+      - '@typescript-eslint/parser'
+      - eslint-import-resolver-webpack
+      - eslint-plugin-import-x
+      - supports-color
+
+  eslint-import-resolver-node@0.3.10:
+    dependencies:
+      debug: 3.2.7
+      is-core-module: 2.16.2
+      resolve: 2.0.0-next.7
+    transitivePeerDependencies:
+      - supports-color
+
+  eslint-import-resolver-typescript@3.10.1(eslint-plugin-import@2.32.0)(eslint@9.39.5(jiti@2.7.0)):
+    dependencies:
+      '@nolyfill/is-core-module': 1.0.39
+      debug: 4.4.3
+      eslint: 9.39.5(jiti@2.7.0)
+      get-tsconfig: 4.14.0
+      is-bun-module: 2.0.0
+      stable-hash: 0.0.5
+      tinyglobby: 0.2.17
+      unrs-resolver: 1.12.2
+    optionalDependencies:
+      eslint-plugin-import: 2.32.0(@typescript-eslint/parser@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3))(eslint-import-resolver-typescript@3.10.1)(eslint@9.39.5(jiti@2.7.0))
+    transitivePeerDependencies:
+      - supports-color
+
+  eslint-module-utils@2.14.0(@typescript-eslint/parser@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3))(eslint-import-resolver-node@0.3.10)(eslint-import-resolver-typescript@3.10.1)(eslint@9.39.5(jiti@2.7.0)):
+    dependencies:
+      debug: 3.2.7
+    optionalDependencies:
+      '@typescript-eslint/parser': 8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+      eslint: 9.39.5(jiti@2.7.0)
+      eslint-import-resolver-node: 0.3.10
+      eslint-import-resolver-typescript: 3.10.1(eslint-plugin-import@2.32.0)(eslint@9.39.5(jiti@2.7.0))
+    transitivePeerDependencies:
+      - supports-color
+
+  eslint-plugin-import@2.32.0(@typescript-eslint/parser@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3))(eslint-import-resolver-typescript@3.10.1)(eslint@9.39.5(jiti@2.7.0)):
+    dependencies:
+      '@rtsao/scc': 1.1.0
+      array-includes: 3.1.9
+      array.prototype.findlastindex: 1.2.6
+      array.prototype.flat: 1.3.3
+      array.prototype.flatmap: 1.3.3
+      debug: 3.2.7
+      doctrine: 2.1.0
+      eslint: 9.39.5(jiti@2.7.0)
+      eslint-import-resolver-node: 0.3.10
+      eslint-module-utils: 2.14.0(@typescript-eslint/parser@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3))(eslint-import-resolver-node@0.3.10)(eslint-import-resolver-typescript@3.10.1)(eslint@9.39.5(jiti@2.7.0))
+      hasown: 2.0.4
+      is-core-module: 2.16.2
+      is-glob: 4.0.3
+      minimatch: 3.1.5
+      object.fromentries: 2.0.8
+      object.groupby: 1.0.3
+      object.values: 1.2.1
+      semver: 6.3.1
+      string.prototype.trimend: 1.0.10
+      tsconfig-paths: 3.15.0
+    optionalDependencies:
+      '@typescript-eslint/parser': 8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+    transitivePeerDependencies:
+      - eslint-import-resolver-typescript
+      - eslint-import-resolver-webpack
+      - supports-color
+
+  eslint-plugin-jsx-a11y@6.10.2(eslint@9.39.5(jiti@2.7.0)):
+    dependencies:
+      aria-query: 5.3.2
+      array-includes: 3.1.9
+      array.prototype.flatmap: 1.3.3
+      ast-types-flow: 0.0.8
+      axe-core: 4.12.1
+      axobject-query: 4.1.0
+      damerau-levenshtein: 1.0.8
+      emoji-regex: 9.2.2
+      eslint: 9.39.5(jiti@2.7.0)
+      hasown: 2.0.4
+      jsx-ast-utils: 3.3.5
+      language-tags: 1.0.9
+      minimatch: 3.1.5
+      object.fromentries: 2.0.8
+      safe-regex-test: 1.1.0
+      string.prototype.includes: 2.0.1
+
+  eslint-plugin-react-hooks@7.1.1(eslint@9.39.5(jiti@2.7.0)):
+    dependencies:
+      '@babel/core': 7.29.7
+      '@babel/parser': 7.29.7
+      eslint: 9.39.5(jiti@2.7.0)
+      hermes-parser: 0.25.1
+      zod: 4.4.3
+      zod-validation-error: 4.0.2(zod@4.4.3)
+    transitivePeerDependencies:
+      - supports-color
+
+  eslint-plugin-react@7.37.5(eslint@9.39.5(jiti@2.7.0)):
+    dependencies:
+      array-includes: 3.1.9
+      array.prototype.findlast: 1.2.5
+      array.prototype.flatmap: 1.3.3
+      array.prototype.tosorted: 1.1.4
+      doctrine: 2.1.0
+      es-iterator-helpers: 1.4.0
+      eslint: 9.39.5(jiti@2.7.0)
+      estraverse: 5.3.0
+      hasown: 2.0.4
+      jsx-ast-utils: 3.3.5
+      minimatch: 3.1.5
+      object.entries: 1.1.9
+      object.fromentries: 2.0.8
+      object.values: 1.2.1
+      prop-types: 15.8.1
+      resolve: 2.0.0-next.7
+      semver: 6.3.1
+      string.prototype.matchall: 4.0.12
+      string.prototype.repeat: 1.0.0
+
+  eslint-scope@8.4.0:
+    dependencies:
+      esrecurse: 4.3.0
+      estraverse: 5.3.0
+
+  eslint-visitor-keys@3.4.3: {}
+
+  eslint-visitor-keys@4.2.1: {}
+
+  eslint-visitor-keys@5.0.1: {}
+
+  eslint@9.39.5(jiti@2.7.0):
+    dependencies:
+      '@eslint-community/eslint-utils': 4.9.1(eslint@9.39.5(jiti@2.7.0))
+      '@eslint-community/regexpp': 4.12.2
+      '@eslint/config-array': 0.21.2
+      '@eslint/config-helpers': 0.4.2
+      '@eslint/core': 0.17.0
+      '@eslint/eslintrc': 3.3.6
+      '@eslint/js': 9.39.5
+      '@eslint/plugin-kit': 0.4.1
+      '@humanfs/node': 0.16.8
+      '@humanwhocodes/module-importer': 1.0.1
+      '@humanwhocodes/retry': 0.4.3
+      '@types/estree': 1.0.9
+      ajv: 6.15.0
+      chalk: 4.1.2
+      cross-spawn: 7.0.6
+      debug: 4.4.3
+      escape-string-regexp: 4.0.0
+      eslint-scope: 8.4.0
+      eslint-visitor-keys: 4.2.1
+      espree: 10.4.0
+      esquery: 1.7.0
+      esutils: 2.0.3
+      fast-deep-equal: 3.1.3
+      file-entry-cache: 8.0.0
+      find-up: 5.0.0
+      glob-parent: 6.0.2
+      ignore: 5.3.2
+      imurmurhash: 0.1.4
+      is-glob: 4.0.3
+      json-stable-stringify-without-jsonify: 1.0.1
+      lodash.merge: 4.6.2
+      minimatch: 3.1.5
+      natural-compare: 1.4.0
+      optionator: 0.9.4
+    optionalDependencies:
+      jiti: 2.7.0
+    transitivePeerDependencies:
+      - supports-color
+
+  espree@10.4.0:
+    dependencies:
+      acorn: 8.17.0
+      acorn-jsx: 5.3.2(acorn@8.17.0)
+      eslint-visitor-keys: 4.2.1
+
+  esquery@1.7.0:
+    dependencies:
+      estraverse: 5.3.0
+
+  esrecurse@4.3.0:
+    dependencies:
+      estraverse: 5.3.0
+
+  estraverse@5.3.0: {}
+
+  estree-walker@3.0.3:
+    dependencies:
+      '@types/estree': 1.0.9
+
+  esutils@2.0.3: {}
+
+  expect-type@1.4.0: {}
+
+  exsolve@1.1.0: {}
+
+  fast-check@3.23.2:
+    dependencies:
+      pure-rand: 6.1.0
+
+  fast-deep-equal@3.1.3: {}
+
+  fast-glob@3.3.1:
+    dependencies:
+      '@nodelib/fs.stat': 2.0.5
+      '@nodelib/fs.walk': 1.2.8
+      glob-parent: 5.1.2
+      merge2: 1.4.1
+      micromatch: 4.0.8
+
+  fast-json-stable-stringify@2.1.0: {}
+
+  fast-levenshtein@2.0.6: {}
+
+  fast-uri@3.1.3: {}
+
+  fastq@1.20.1:
+    dependencies:
+      reusify: 1.1.0
+
+  fdir@6.5.0(picomatch@4.0.5):
+    optionalDependencies:
+      picomatch: 4.0.5
+
+  file-entry-cache@8.0.0:
+    dependencies:
+      flat-cache: 4.0.1
+
+  fill-range@7.1.1:
+    dependencies:
+      to-regex-range: 5.0.1
+
+  find-up@5.0.0:
+    dependencies:
+      locate-path: 6.0.0
+      path-exists: 4.0.0
+
+  flat-cache@4.0.1:
+    dependencies:
+      flatted: 3.4.2
+      keyv: 4.5.4
+
+  flatted@3.4.2: {}
+
+  for-each@0.3.5:
+    dependencies:
+      is-callable: 1.2.7
+
+  foreground-child@3.3.1:
+    dependencies:
+      cross-spawn: 7.0.6
+      signal-exit: 4.1.0
+
+  fsevents@2.3.3:
+    optional: true
+
+  function-bind@1.1.2: {}
+
+  function.prototype.name@1.2.0:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      es-define-property: 1.0.1
+      es-errors: 1.3.0
+      functions-have-names: 1.2.3
+      has-property-descriptors: 1.0.2
+      hasown: 2.0.4
+      is-callable: 1.2.7
+      is-document.all: 1.0.0
+
+  functions-have-names@1.2.3: {}
+
+  generate-function@2.3.1:
+    dependencies:
+      is-property: 1.0.2
+
+  generator-function@2.0.1: {}
+
+  gensync@1.0.0-beta.2: {}
+
+  get-caller-file@2.0.5: {}
+
+  get-intrinsic@1.3.0:
+    dependencies:
+      call-bind-apply-helpers: 1.0.2
+      es-define-property: 1.0.1
+      es-errors: 1.3.0
+      es-object-atoms: 1.1.2
+      function-bind: 1.1.2
+      get-proto: 1.0.1
+      gopd: 1.2.0
+      has-symbols: 1.1.0
+      hasown: 2.0.4
+      math-intrinsics: 1.1.0
+
+  get-port-please@3.2.0: {}
+
+  get-proto@1.0.1:
+    dependencies:
+      dunder-proto: 1.0.1
+      es-object-atoms: 1.1.2
+
+  get-symbol-description@1.1.0:
+    dependencies:
+      call-bound: 1.0.4
+      es-errors: 1.3.0
+      get-intrinsic: 1.3.0
+
+  get-tsconfig@4.14.0:
+    dependencies:
+      resolve-pkg-maps: 1.0.0
+
+  giget@3.3.0: {}
+
+  glob-parent@5.1.2:
+    dependencies:
+      is-glob: 4.0.3
+
+  glob-parent@6.0.2:
+    dependencies:
+      is-glob: 4.0.3
+
+  globals@14.0.0: {}
+
+  globals@16.4.0: {}
+
+  globalthis@1.0.4:
+    dependencies:
+      define-properties: 1.2.1
+      gopd: 1.2.0
+
+  gopd@1.2.0: {}
+
+  graceful-fs@4.2.11: {}
+
+  grammex@3.1.13: {}
+
+  graphile-config@0.0.1-beta.18:
+    dependencies:
+      '@types/interpret': 1.1.4
+      '@types/node': 22.20.1
+      '@types/semver': 7.7.1
+      chalk: 4.1.2
+      debug: 4.4.3
+      interpret: 3.1.1
+      semver: 7.8.5
+      tslib: 2.8.1
+      yargs: 17.7.3
+    transitivePeerDependencies:
+      - supports-color
+
+  graphile-worker@0.17.3(typescript@5.9.3):
+    dependencies:
+      '@graphile/logger': 0.2.0
+      '@types/debug': 4.1.13
+      '@types/pg': 8.20.0
+      cosmiconfig: 8.3.6(typescript@5.9.3)
+      graphile-config: 0.0.1-beta.18
+      json5: 2.2.3
+      pg: 8.22.0
+      tslib: 2.8.1
+      yargs: 17.7.3
+    transitivePeerDependencies:
+      - pg-native
+      - supports-color
+      - typescript
+
+  graphmatch@1.1.1: {}
+
+  has-bigints@1.1.0: {}
+
+  has-flag@4.0.0: {}
+
+  has-property-descriptors@1.0.2:
+    dependencies:
+      es-define-property: 1.0.1
+
+  has-proto@1.2.0:
+    dependencies:
+      dunder-proto: 1.0.1
+
+  has-symbols@1.1.0: {}
+
+  has-tostringtag@1.0.2:
+    dependencies:
+      has-symbols: 1.1.0
+
+  hasown@2.0.4:
+    dependencies:
+      function-bind: 1.1.2
+
+  hermes-estree@0.25.1: {}
+
+  hermes-parser@0.25.1:
+    dependencies:
+      hermes-estree: 0.25.1
+
+  hono@4.12.30: {}
+
+  http-status-codes@2.3.0: {}
+
+  iconv-lite@0.7.3:
+    dependencies:
+      safer-buffer: 2.1.2
+
+  ignore@5.3.2: {}
+
+  ignore@7.0.6: {}
+
+  import-fresh@3.3.1:
+    dependencies:
+      parent-module: 1.0.1
+      resolve-from: 4.0.0
+
+  imurmurhash@0.1.4: {}
+
+  internal-slot@1.1.0:
+    dependencies:
+      es-errors: 1.3.0
+      hasown: 2.0.4
+      side-channel: 1.1.1
+
+  interpret@3.1.1: {}
+
+  is-array-buffer@3.0.5:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      get-intrinsic: 1.3.0
+
+  is-arrayish@0.2.1: {}
+
+  is-async-function@2.1.1:
+    dependencies:
+      async-function: 1.0.0
+      call-bound: 1.0.4
+      get-proto: 1.0.1
+      has-tostringtag: 1.0.2
+      safe-regex-test: 1.1.0
+
+  is-bigint@1.1.0:
+    dependencies:
+      has-bigints: 1.1.0
+
+  is-boolean-object@1.2.2:
+    dependencies:
+      call-bound: 1.0.4
+      has-tostringtag: 1.0.2
+
+  is-bun-module@2.0.0:
+    dependencies:
+      semver: 7.8.5
+
+  is-callable@1.2.7: {}
+
+  is-core-module@2.16.2:
+    dependencies:
+      hasown: 2.0.4
+
+  is-data-view@1.0.2:
+    dependencies:
+      call-bound: 1.0.4
+      get-intrinsic: 1.3.0
+      is-typed-array: 1.1.15
+
+  is-date-object@1.1.0:
+    dependencies:
+      call-bound: 1.0.4
+      has-tostringtag: 1.0.2
+
+  is-document.all@1.0.0:
+    dependencies:
+      call-bound: 1.0.4
+
+  is-extglob@2.1.1: {}
+
+  is-finalizationregistry@1.1.1:
+    dependencies:
+      call-bound: 1.0.4
+
+  is-fullwidth-code-point@3.0.0: {}
+
+  is-generator-function@1.1.2:
+    dependencies:
+      call-bound: 1.0.4
+      generator-function: 2.0.1
+      get-proto: 1.0.1
+      has-tostringtag: 1.0.2
+      safe-regex-test: 1.1.0
+
+  is-glob@4.0.3:
+    dependencies:
+      is-extglob: 2.1.1
+
+  is-map@2.0.3: {}
+
+  is-negative-zero@2.0.3: {}
+
+  is-number-object@1.1.1:
+    dependencies:
+      call-bound: 1.0.4
+      has-tostringtag: 1.0.2
+
+  is-number@7.0.0: {}
+
+  is-property@1.0.2: {}
+
+  is-regex@1.2.1:
+    dependencies:
+      call-bound: 1.0.4
+      gopd: 1.2.0
+      has-tostringtag: 1.0.2
+      hasown: 2.0.4
+
+  is-set@2.0.3: {}
+
+  is-shared-array-buffer@1.0.4:
+    dependencies:
+      call-bound: 1.0.4
+
+  is-string@1.1.1:
+    dependencies:
+      call-bound: 1.0.4
+      has-tostringtag: 1.0.2
+
+  is-symbol@1.1.1:
+    dependencies:
+      call-bound: 1.0.4
+      has-symbols: 1.1.0
+      safe-regex-test: 1.1.0
+
+  is-typed-array@1.1.15:
+    dependencies:
+      which-typed-array: 1.1.22
+
+  is-weakmap@2.0.2: {}
+
+  is-weakref@1.1.1:
+    dependencies:
+      call-bound: 1.0.4
+
+  is-weakset@2.0.4:
+    dependencies:
+      call-bound: 1.0.4
+      get-intrinsic: 1.3.0
+
+  isarray@2.0.5: {}
+
+  isexe@2.0.0: {}
+
+  iterator.prototype@1.1.5:
+    dependencies:
+      define-data-property: 1.1.4
+      es-object-atoms: 1.1.2
+      get-intrinsic: 1.3.0
+      get-proto: 1.0.1
+      has-symbols: 1.1.0
+      set-function-name: 2.0.2
+
+  jiti@2.7.0: {}
+
+  jose@6.2.3: {}
+
+  js-tokens@4.0.0: {}
+
+  js-yaml@4.3.0:
+    dependencies:
+      argparse: 2.0.1
+
+  jsesc@3.1.0: {}
+
+  json-buffer@3.0.1: {}
+
+  json-parse-even-better-errors@2.3.1: {}
+
+  json-schema-traverse@0.4.1: {}
+
+  json-schema-traverse@1.0.0: {}
+
+  json-stable-stringify-without-jsonify@1.0.1: {}
+
+  json5@1.0.2:
+    dependencies:
+      minimist: 1.2.8
+
+  json5@2.2.3: {}
+
+  jsx-ast-utils@3.3.5:
+    dependencies:
+      array-includes: 3.1.9
+      array.prototype.flat: 1.3.3
+      object.assign: 4.1.7
+      object.values: 1.2.1
+
+  keyv@4.5.4:
+    dependencies:
+      json-buffer: 3.0.1
+
+  language-subtag-registry@0.3.23: {}
+
+  language-tags@1.0.9:
+    dependencies:
+      language-subtag-registry: 0.3.23
+
+  levn@0.4.1:
+    dependencies:
+      prelude-ls: 1.2.1
+      type-check: 0.4.0
+
+  lightningcss-android-arm64@1.32.0:
+    optional: true
+
+  lightningcss-darwin-arm64@1.32.0:
+    optional: true
+
+  lightningcss-darwin-x64@1.32.0:
+    optional: true
+
+  lightningcss-freebsd-x64@1.32.0:
+    optional: true
+
+  lightningcss-linux-arm-gnueabihf@1.32.0:
+    optional: true
+
+  lightningcss-linux-arm64-gnu@1.32.0:
+    optional: true
+
+  lightningcss-linux-arm64-musl@1.32.0:
+    optional: true
+
+  lightningcss-linux-x64-gnu@1.32.0:
+    optional: true
+
+  lightningcss-linux-x64-musl@1.32.0:
+    optional: true
+
+  lightningcss-win32-arm64-msvc@1.32.0:
+    optional: true
+
+  lightningcss-win32-x64-msvc@1.32.0:
+    optional: true
+
+  lightningcss@1.32.0:
+    dependencies:
+      detect-libc: 2.1.2
+    optionalDependencies:
+      lightningcss-android-arm64: 1.32.0
+      lightningcss-darwin-arm64: 1.32.0
+      lightningcss-darwin-x64: 1.32.0
+      lightningcss-freebsd-x64: 1.32.0
+      lightningcss-linux-arm-gnueabihf: 1.32.0
+      lightningcss-linux-arm64-gnu: 1.32.0
+      lightningcss-linux-arm64-musl: 1.32.0
+      lightningcss-linux-x64-gnu: 1.32.0
+      lightningcss-linux-x64-musl: 1.32.0
+      lightningcss-win32-arm64-msvc: 1.32.0
+      lightningcss-win32-x64-msvc: 1.32.0
+
+  lines-and-columns@1.2.4: {}
+
+  locate-path@6.0.0:
+    dependencies:
+      p-locate: 5.0.0
+
+  lodash.merge@4.6.2: {}
+
+  long@5.3.2: {}
+
+  loose-envify@1.4.0:
+    dependencies:
+      js-tokens: 4.0.0
+
+  lru-cache@5.1.1:
+    dependencies:
+      yallist: 3.1.1
+
+  lru.min@1.1.4: {}
+
+  magic-string@0.30.21:
+    dependencies:
+      '@jridgewell/sourcemap-codec': 1.5.5
+
+  math-intrinsics@1.1.0: {}
+
+  merge2@1.4.1: {}
+
+  micromatch@4.0.8:
+    dependencies:
+      braces: 3.0.3
+      picomatch: 2.3.2
+
+  minimatch@10.2.5:
+    dependencies:
+      brace-expansion: 5.0.7
+
+  minimatch@3.1.5:
+    dependencies:
+      brace-expansion: 1.1.16
+
+  minimist@1.2.8: {}
+
+  ms@2.1.3: {}
+
+  mysql2@3.15.3:
+    dependencies:
+      aws-ssl-profiles: 1.1.2
+      denque: 2.1.0
+      generate-function: 2.3.1
+      iconv-lite: 0.7.3
+      long: 5.3.2
+      lru.min: 1.1.4
+      named-placeholders: 1.1.6
+      seq-queue: 0.0.5
+      sqlstring: 2.3.3
+
+  named-placeholders@1.1.6:
+    dependencies:
+      lru.min: 1.1.4
+
+  nanoid@3.3.16: {}
+
+  napi-postinstall@0.3.4: {}
+
+  natural-compare@1.4.0: {}
+
+  next-auth@5.0.0-beta.31(next@16.2.10(@babel/core@7.29.7)(react-dom@19.2.4(react@19.2.4))(react@19.2.4))(react@19.2.4):
+    dependencies:
+      '@auth/core': 0.41.2
+      next: 16.2.10(@babel/core@7.29.7)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)
+      react: 19.2.4
+
+  next@16.2.10(@babel/core@7.29.7)(react-dom@19.2.4(react@19.2.4))(react@19.2.4):
+    dependencies:
+      '@next/env': 16.2.10
+      '@swc/helpers': 0.5.15
+      baseline-browser-mapping: 2.10.43
+      caniuse-lite: 1.0.30001806
+      postcss: 8.4.31
+      react: 19.2.4
+      react-dom: 19.2.4(react@19.2.4)
+      styled-jsx: 5.1.6(@babel/core@7.29.7)(react@19.2.4)
+    optionalDependencies:
+      '@next/swc-darwin-arm64': 16.2.10
+      '@next/swc-darwin-x64': 16.2.10
+      '@next/swc-linux-arm64-gnu': 16.2.10
+      '@next/swc-linux-arm64-musl': 16.2.10
+      '@next/swc-linux-x64-gnu': 16.2.10
+      '@next/swc-linux-x64-musl': 16.2.10
+      '@next/swc-win32-arm64-msvc': 16.2.10
+      '@next/swc-win32-x64-msvc': 16.2.10
+      sharp: 0.34.5
+    transitivePeerDependencies:
+      - '@babel/core'
+      - babel-plugin-macros
+
+  node-addon-api@8.9.0: {}
+
+  node-exports-info@1.6.2:
+    dependencies:
+      array.prototype.flatmap: 1.3.3
+      es-errors: 1.3.0
+      object.entries: 1.1.9
+      semver: 6.3.1
+
+  node-gyp-build@4.8.4: {}
+
+  node-releases@2.0.51: {}
+
+  oauth4webapi@3.8.6: {}
+
+  object-assign@4.1.1: {}
+
+  object-inspect@1.13.4: {}
+
+  object-keys@1.1.1: {}
+
+  object.assign@4.1.7:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      define-properties: 1.2.1
+      es-object-atoms: 1.1.2
+      has-symbols: 1.1.0
+      object-keys: 1.1.1
+
+  object.entries@1.1.9:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      define-properties: 1.2.1
+      es-object-atoms: 1.1.2
+
+  object.fromentries@2.0.8:
+    dependencies:
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-object-atoms: 1.1.2
+
+  object.groupby@1.0.3:
+    dependencies:
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+
+  object.values@1.2.1:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      define-properties: 1.2.1
+      es-object-atoms: 1.1.2
+
+  obug@2.1.3: {}
+
+  ohash@2.0.11: {}
+
+  optionator@0.9.4:
+    dependencies:
+      deep-is: 0.1.4
+      fast-levenshtein: 2.0.6
+      levn: 0.4.1
+      prelude-ls: 1.2.1
+      type-check: 0.4.0
+      word-wrap: 1.2.5
+
+  own-keys@1.0.1:
+    dependencies:
+      get-intrinsic: 1.3.0
+      object-keys: 1.1.1
+      safe-push-apply: 1.0.0
+
+  p-limit@3.1.0:
+    dependencies:
+      yocto-queue: 0.1.0
+
+  p-locate@5.0.0:
+    dependencies:
+      p-limit: 3.1.0
+
+  parent-module@1.0.1:
+    dependencies:
+      callsites: 3.1.0
+
+  parse-json@5.2.0:
+    dependencies:
+      '@babel/code-frame': 7.29.7
+      error-ex: 1.3.4
+      json-parse-even-better-errors: 2.3.1
+      lines-and-columns: 1.2.4
+
+  path-exists@4.0.0: {}
+
+  path-key@3.1.1: {}
+
+  path-parse@1.0.7: {}
+
+  path-type@4.0.0: {}
+
+  pathe@2.0.3: {}
+
+  perfect-debounce@2.1.0: {}
+
+  pg-cloudflare@1.4.0:
+    optional: true
+
+  pg-connection-string@2.14.0: {}
+
+  pg-int8@1.0.1: {}
+
+  pg-pool@3.14.0(pg@8.22.0):
+    dependencies:
+      pg: 8.22.0
+
+  pg-protocol@1.15.0: {}
+
+  pg-types@2.2.0:
+    dependencies:
+      pg-int8: 1.0.1
+      postgres-array: 2.0.0
+      postgres-bytea: 1.0.1
+      postgres-date: 1.0.7
+      postgres-interval: 1.2.0
+
+  pg@8.22.0:
+    dependencies:
+      pg-connection-string: 2.14.0
+      pg-pool: 3.14.0(pg@8.22.0)
+      pg-protocol: 1.15.0
+      pg-types: 2.2.0
+      pgpass: 1.0.5
+    optionalDependencies:
+      pg-cloudflare: 1.4.0
+
+  pgpass@1.0.5:
+    dependencies:
+      split2: 4.2.0
+
+  picocolors@1.1.1: {}
+
+  picomatch@2.3.2: {}
+
+  picomatch@4.0.5: {}
+
+  pkg-types@2.3.1:
+    dependencies:
+      confbox: 0.2.4
+      exsolve: 1.1.0
+      pathe: 2.0.3
+
+  possible-typed-array-names@1.1.0: {}
+
+  postcss@8.4.31:
+    dependencies:
+      nanoid: 3.3.16
+      picocolors: 1.1.1
+      source-map-js: 1.2.1
+
+  postcss@8.5.19:
+    dependencies:
+      nanoid: 3.3.16
+      picocolors: 1.1.1
+      source-map-js: 1.2.1
+
+  postgres-array@2.0.0: {}
+
+  postgres-array@3.0.4: {}
+
+  postgres-bytea@1.0.1: {}
+
+  postgres-date@1.0.7: {}
+
+  postgres-interval@1.2.0:
+    dependencies:
+      xtend: 4.0.2
+
+  postgres@3.4.7: {}
+
+  preact-render-to-string@6.5.11(preact@10.24.3):
+    dependencies:
+      preact: 10.24.3
+
+  preact@10.24.3: {}
+
+  prelude-ls@1.2.1: {}
+
+  prisma@7.8.0(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)(typescript@5.9.3):
+    dependencies:
+      '@prisma/config': 7.8.0
+      '@prisma/dev': 0.24.3(typescript@5.9.3)
+      '@prisma/engines': 7.8.0
+      '@prisma/studio-core': 0.27.3(@types/react-dom@19.2.3(@types/react@19.2.17))(@types/react@19.2.17)(react-dom@19.2.4(react@19.2.4))(react@19.2.4)
+      mysql2: 3.15.3
+      postgres: 3.4.7
+    optionalDependencies:
+      typescript: 5.9.3
+    transitivePeerDependencies:
+      - '@types/react'
+      - '@types/react-dom'
+      - magicast
+      - react
+      - react-dom
+
+  prop-types@15.8.1:
+    dependencies:
+      loose-envify: 1.4.0
+      object-assign: 4.1.1
+      react-is: 16.13.1
+
+  proper-lockfile@4.1.2:
+    dependencies:
+      graceful-fs: 4.2.11
+      retry: 0.12.0
+      signal-exit: 3.0.7
+
+  punycode@2.3.1: {}
+
+  pure-rand@6.1.0: {}
+
+  queue-microtask@1.2.3: {}
+
+  rc9@3.0.1:
+    dependencies:
+      defu: 6.1.7
+      destr: 2.0.5
+
+  react-dom@19.2.4(react@19.2.4):
+    dependencies:
+      react: 19.2.4
+      scheduler: 0.27.0
+
+  react-is@16.13.1: {}
+
+  react@19.2.4: {}
+
+  readdirp@5.0.0: {}
+
+  reflect.getprototypeof@1.0.10:
+    dependencies:
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-errors: 1.3.0
+      es-object-atoms: 1.1.2
+      get-intrinsic: 1.3.0
+      get-proto: 1.0.1
+      which-builtin-type: 1.2.1
+
+  regexp.prototype.flags@1.5.4:
+    dependencies:
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-errors: 1.3.0
+      get-proto: 1.0.1
+      gopd: 1.2.0
+      set-function-name: 2.0.2
+
+  remeda@2.33.4: {}
+
+  require-directory@2.1.1: {}
+
+  require-from-string@2.0.2: {}
+
+  resolve-from@4.0.0: {}
+
+  resolve-pkg-maps@1.0.0: {}
+
+  resolve@2.0.0-next.7:
+    dependencies:
+      es-errors: 1.3.0
+      is-core-module: 2.16.2
+      node-exports-info: 1.6.2
+      object-keys: 1.1.1
+      path-parse: 1.0.7
+      supports-preserve-symlinks-flag: 1.0.0
+
+  retry@0.12.0: {}
+
+  reusify@1.1.0: {}
+
+  rolldown@1.1.5:
+    dependencies:
+      '@oxc-project/types': 0.139.0
+      '@rolldown/pluginutils': 1.0.1
+    optionalDependencies:
+      '@rolldown/binding-android-arm64': 1.1.5
+      '@rolldown/binding-darwin-arm64': 1.1.5
+      '@rolldown/binding-darwin-x64': 1.1.5
+      '@rolldown/binding-freebsd-x64': 1.1.5
+      '@rolldown/binding-linux-arm-gnueabihf': 1.1.5
+      '@rolldown/binding-linux-arm64-gnu': 1.1.5
+      '@rolldown/binding-linux-arm64-musl': 1.1.5
+      '@rolldown/binding-linux-ppc64-gnu': 1.1.5
+      '@rolldown/binding-linux-s390x-gnu': 1.1.5
+      '@rolldown/binding-linux-x64-gnu': 1.1.5
+      '@rolldown/binding-linux-x64-musl': 1.1.5
+      '@rolldown/binding-openharmony-arm64': 1.1.5
+      '@rolldown/binding-wasm32-wasi': 1.1.5
+      '@rolldown/binding-win32-arm64-msvc': 1.1.5
+      '@rolldown/binding-win32-x64-msvc': 1.1.5
+
+  run-parallel@1.2.0:
+    dependencies:
+      queue-microtask: 1.2.3
+
+  safe-array-concat@1.1.4:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      get-intrinsic: 1.3.0
+      has-symbols: 1.1.0
+      isarray: 2.0.5
+
+  safe-push-apply@1.0.0:
+    dependencies:
+      es-errors: 1.3.0
+      isarray: 2.0.5
+
+  safe-regex-test@1.1.0:
+    dependencies:
+      call-bound: 1.0.4
+      es-errors: 1.3.0
+      is-regex: 1.2.1
+
+  safer-buffer@2.1.2: {}
+
+  scheduler@0.27.0: {}
+
+  semver@6.3.1: {}
+
+  semver@7.8.5: {}
+
+  seq-queue@0.0.5: {}
+
+  set-function-length@1.2.2:
+    dependencies:
+      define-data-property: 1.1.4
+      es-errors: 1.3.0
+      function-bind: 1.1.2
+      get-intrinsic: 1.3.0
+      gopd: 1.2.0
+      has-property-descriptors: 1.0.2
+
+  set-function-name@2.0.2:
+    dependencies:
+      define-data-property: 1.1.4
+      es-errors: 1.3.0
+      functions-have-names: 1.2.3
+      has-property-descriptors: 1.0.2
+
+  set-proto@1.0.0:
+    dependencies:
+      dunder-proto: 1.0.1
+      es-errors: 1.3.0
+      es-object-atoms: 1.1.2
+
+  sharp@0.34.5:
+    dependencies:
+      '@img/colour': 1.1.0
+      detect-libc: 2.1.2
+      semver: 7.8.5
+    optionalDependencies:
+      '@img/sharp-darwin-arm64': 0.34.5
+      '@img/sharp-darwin-x64': 0.34.5
+      '@img/sharp-libvips-darwin-arm64': 1.2.4
+      '@img/sharp-libvips-darwin-x64': 1.2.4
+      '@img/sharp-libvips-linux-arm': 1.2.4
+      '@img/sharp-libvips-linux-arm64': 1.2.4
+      '@img/sharp-libvips-linux-ppc64': 1.2.4
+      '@img/sharp-libvips-linux-riscv64': 1.2.4
+      '@img/sharp-libvips-linux-s390x': 1.2.4
+      '@img/sharp-libvips-linux-x64': 1.2.4
+      '@img/sharp-libvips-linuxmusl-arm64': 1.2.4
+      '@img/sharp-libvips-linuxmusl-x64': 1.2.4
+      '@img/sharp-linux-arm': 0.34.5
+      '@img/sharp-linux-arm64': 0.34.5
+      '@img/sharp-linux-ppc64': 0.34.5
+      '@img/sharp-linux-riscv64': 0.34.5
+      '@img/sharp-linux-s390x': 0.34.5
+      '@img/sharp-linux-x64': 0.34.5
+      '@img/sharp-linuxmusl-arm64': 0.34.5
+      '@img/sharp-linuxmusl-x64': 0.34.5
+      '@img/sharp-wasm32': 0.34.5
+      '@img/sharp-win32-arm64': 0.34.5
+      '@img/sharp-win32-ia32': 0.34.5
+      '@img/sharp-win32-x64': 0.34.5
+    optional: true
+
+  shebang-command@2.0.0:
+    dependencies:
+      shebang-regex: 3.0.0
+
+  shebang-regex@3.0.0: {}
+
+  side-channel-list@1.0.1:
+    dependencies:
+      es-errors: 1.3.0
+      object-inspect: 1.13.4
+
+  side-channel-map@1.0.1:
+    dependencies:
+      call-bound: 1.0.4
+      es-errors: 1.3.0
+      get-intrinsic: 1.3.0
+      object-inspect: 1.13.4
+
+  side-channel-weakmap@1.0.2:
+    dependencies:
+      call-bound: 1.0.4
+      es-errors: 1.3.0
+      get-intrinsic: 1.3.0
+      object-inspect: 1.13.4
+      side-channel-map: 1.0.1
+
+  side-channel@1.1.1:
+    dependencies:
+      es-errors: 1.3.0
+      object-inspect: 1.13.4
+      side-channel-list: 1.0.1
+      side-channel-map: 1.0.1
+      side-channel-weakmap: 1.0.2
+
+  siginfo@2.0.0: {}
+
+  signal-exit@3.0.7: {}
+
+  signal-exit@4.1.0: {}
+
+  source-map-js@1.2.1: {}
+
+  split2@4.2.0: {}
+
+  sqlstring@2.3.3: {}
+
+  stable-hash@0.0.5: {}
+
+  stackback@0.0.2: {}
+
+  std-env@3.10.0: {}
+
+  std-env@4.2.0: {}
+
+  stop-iteration-iterator@1.1.0:
+    dependencies:
+      es-errors: 1.3.0
+      internal-slot: 1.1.0
+
+  string-width@4.2.3:
+    dependencies:
+      emoji-regex: 8.0.0
+      is-fullwidth-code-point: 3.0.0
+      strip-ansi: 6.0.1
+
+  string.prototype.includes@2.0.1:
+    dependencies:
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+
+  string.prototype.matchall@4.0.12:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-errors: 1.3.0
+      es-object-atoms: 1.1.2
+      get-intrinsic: 1.3.0
+      gopd: 1.2.0
+      has-symbols: 1.1.0
+      internal-slot: 1.1.0
+      regexp.prototype.flags: 1.5.4
+      set-function-name: 2.0.2
+      side-channel: 1.1.1
+
+  string.prototype.repeat@1.0.0:
+    dependencies:
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+
+  string.prototype.trim@1.2.11:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      define-data-property: 1.1.4
+      define-properties: 1.2.1
+      es-abstract: 1.24.2
+      es-object-atoms: 1.1.2
+      has-property-descriptors: 1.0.2
+      safe-regex-test: 1.1.0
+
+  string.prototype.trimend@1.0.10:
+    dependencies:
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      define-properties: 1.2.1
+      es-object-atoms: 1.1.2
+
+  string.prototype.trimstart@1.0.8:
+    dependencies:
+      call-bind: 1.0.9
+      define-properties: 1.2.1
+      es-object-atoms: 1.1.2
+
+  strip-ansi@6.0.1:
+    dependencies:
+      ansi-regex: 5.0.1
+
+  strip-bom@3.0.0: {}
+
+  strip-json-comments@3.1.1: {}
+
+  styled-jsx@5.1.6(@babel/core@7.29.7)(react@19.2.4):
+    dependencies:
+      client-only: 0.0.1
+      react: 19.2.4
+    optionalDependencies:
+      '@babel/core': 7.29.7
+
+  supports-color@7.2.0:
+    dependencies:
+      has-flag: 4.0.0
+
+  supports-preserve-symlinks-flag@1.0.0: {}
+
+  tailwindcss@4.3.2: {}
+
+  tapable@2.3.3: {}
+
+  tinybench@2.9.0: {}
+
+  tinyexec@1.2.4: {}
+
+  tinyglobby@0.2.17:
+    dependencies:
+      fdir: 6.5.0(picomatch@4.0.5)
+      picomatch: 4.0.5
+
+  tinyrainbow@3.1.0: {}
+
+  to-regex-range@5.0.1:
+    dependencies:
+      is-number: 7.0.0
+
+  ts-api-utils@2.5.0(typescript@5.9.3):
+    dependencies:
+      typescript: 5.9.3
+
+  tsconfig-paths@3.15.0:
+    dependencies:
+      '@types/json5': 0.0.29
+      json5: 1.0.2
+      minimist: 1.2.8
+      strip-bom: 3.0.0
+
+  tslib@2.8.1: {}
+
+  tsx@4.23.1:
+    dependencies:
+      esbuild: 0.28.1
+    optionalDependencies:
+      fsevents: 2.3.3
+
+  type-check@0.4.0:
+    dependencies:
+      prelude-ls: 1.2.1
+
+  typed-array-buffer@1.0.3:
+    dependencies:
+      call-bound: 1.0.4
+      es-errors: 1.3.0
+      is-typed-array: 1.1.15
+
+  typed-array-byte-length@1.0.3:
+    dependencies:
+      call-bind: 1.0.9
+      for-each: 0.3.5
+      gopd: 1.2.0
+      has-proto: 1.2.0
+      is-typed-array: 1.1.15
+
+  typed-array-byte-offset@1.0.4:
+    dependencies:
+      available-typed-arrays: 1.0.7
+      call-bind: 1.0.9
+      for-each: 0.3.5
+      gopd: 1.2.0
+      has-proto: 1.2.0
+      is-typed-array: 1.1.15
+      reflect.getprototypeof: 1.0.10
+
+  typed-array-length@1.0.8:
+    dependencies:
+      call-bind: 1.0.9
+      for-each: 0.3.5
+      gopd: 1.2.0
+      is-typed-array: 1.1.15
+      possible-typed-array-names: 1.1.0
+      reflect.getprototypeof: 1.0.10
+
+  typescript-eslint@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3):
+    dependencies:
+      '@typescript-eslint/eslint-plugin': 8.64.0(@typescript-eslint/parser@8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3))(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+      '@typescript-eslint/parser': 8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+      '@typescript-eslint/typescript-estree': 8.64.0(typescript@5.9.3)
+      '@typescript-eslint/utils': 8.64.0(eslint@9.39.5(jiti@2.7.0))(typescript@5.9.3)
+      eslint: 9.39.5(jiti@2.7.0)
+      typescript: 5.9.3
+    transitivePeerDependencies:
+      - supports-color
+
+  typescript@5.9.3: {}
+
+  unbox-primitive@1.1.0:
+    dependencies:
+      call-bound: 1.0.4
+      has-bigints: 1.1.0
+      has-symbols: 1.1.0
+      which-boxed-primitive: 1.1.1
+
+  undici-types@6.21.0: {}
+
+  unrs-resolver@1.12.2:
+    dependencies:
+      napi-postinstall: 0.3.4
+    optionalDependencies:
+      '@unrs/resolver-binding-android-arm-eabi': 1.12.2
+      '@unrs/resolver-binding-android-arm64': 1.12.2
+      '@unrs/resolver-binding-darwin-arm64': 1.12.2
+      '@unrs/resolver-binding-darwin-x64': 1.12.2
+      '@unrs/resolver-binding-freebsd-x64': 1.12.2
+      '@unrs/resolver-binding-linux-arm-gnueabihf': 1.12.2
+      '@unrs/resolver-binding-linux-arm-musleabihf': 1.12.2
+      '@unrs/resolver-binding-linux-arm64-gnu': 1.12.2
+      '@unrs/resolver-binding-linux-arm64-musl': 1.12.2
+      '@unrs/resolver-binding-linux-loong64-gnu': 1.12.2
+      '@unrs/resolver-binding-linux-loong64-musl': 1.12.2
+      '@unrs/resolver-binding-linux-ppc64-gnu': 1.12.2
+      '@unrs/resolver-binding-linux-riscv64-gnu': 1.12.2
+      '@unrs/resolver-binding-linux-riscv64-musl': 1.12.2
+      '@unrs/resolver-binding-linux-s390x-gnu': 1.12.2
+      '@unrs/resolver-binding-linux-x64-gnu': 1.12.2
+      '@unrs/resolver-binding-linux-x64-musl': 1.12.2
+      '@unrs/resolver-binding-openharmony-arm64': 1.12.2
+      '@unrs/resolver-binding-wasm32-wasi': 1.12.2
+      '@unrs/resolver-binding-win32-arm64-msvc': 1.12.2
+      '@unrs/resolver-binding-win32-ia32-msvc': 1.12.2
+      '@unrs/resolver-binding-win32-x64-msvc': 1.12.2
+
+  update-browserslist-db@1.2.3(browserslist@4.28.6):
+    dependencies:
+      browserslist: 4.28.6
+      escalade: 3.2.0
+      picocolors: 1.1.1
+
+  uri-js@4.4.1:
+    dependencies:
+      punycode: 2.3.1
+
+  valibot@1.2.0(typescript@5.9.3):
+    optionalDependencies:
+      typescript: 5.9.3
+
+  vite@8.1.5(@types/node@20.19.43)(esbuild@0.28.1)(jiti@2.7.0)(tsx@4.23.1):
+    dependencies:
+      lightningcss: 1.32.0
+      picomatch: 4.0.5
+      postcss: 8.5.19
+      rolldown: 1.1.5
+      tinyglobby: 0.2.17
+    optionalDependencies:
+      '@types/node': 20.19.43
+      esbuild: 0.28.1
+      fsevents: 2.3.3
+      jiti: 2.7.0
+      tsx: 4.23.1
+
+  vitest@4.1.10(@types/node@20.19.43)(vite@8.1.5(@types/node@20.19.43)(esbuild@0.28.1)(jiti@2.7.0)(tsx@4.23.1)):
+    dependencies:
+      '@vitest/expect': 4.1.10
+      '@vitest/mocker': 4.1.10(vite@8.1.5(@types/node@20.19.43)(esbuild@0.28.1)(jiti@2.7.0)(tsx@4.23.1))
+      '@vitest/pretty-format': 4.1.10
+      '@vitest/runner': 4.1.10
+      '@vitest/snapshot': 4.1.10
+      '@vitest/spy': 4.1.10
+      '@vitest/utils': 4.1.10
+      es-module-lexer: 2.3.1
+      expect-type: 1.4.0
+      magic-string: 0.30.21
+      obug: 2.1.3
+      pathe: 2.0.3
+      picomatch: 4.0.5
+      std-env: 4.2.0
+      tinybench: 2.9.0
+      tinyexec: 1.2.4
+      tinyglobby: 0.2.17
+      tinyrainbow: 3.1.0
+      vite: 8.1.5(@types/node@20.19.43)(esbuild@0.28.1)(jiti@2.7.0)(tsx@4.23.1)
+      why-is-node-running: 2.3.0
+    optionalDependencies:
+      '@types/node': 20.19.43
+    transitivePeerDependencies:
+      - msw
+
+  which-boxed-primitive@1.1.1:
+    dependencies:
+      is-bigint: 1.1.0
+      is-boolean-object: 1.2.2
+      is-number-object: 1.1.1
+      is-string: 1.1.1
+      is-symbol: 1.1.1
+
+  which-builtin-type@1.2.1:
+    dependencies:
+      call-bound: 1.0.4
+      function.prototype.name: 1.2.0
+      has-tostringtag: 1.0.2
+      is-async-function: 2.1.1
+      is-date-object: 1.1.0
+      is-finalizationregistry: 1.1.1
+      is-generator-function: 1.1.2
+      is-regex: 1.2.1
+      is-weakref: 1.1.1
+      isarray: 2.0.5
+      which-boxed-primitive: 1.1.1
+      which-collection: 1.0.2
+      which-typed-array: 1.1.22
+
+  which-collection@1.0.2:
+    dependencies:
+      is-map: 2.0.3
+      is-set: 2.0.3
+      is-weakmap: 2.0.2
+      is-weakset: 2.0.4
+
+  which-typed-array@1.1.22:
+    dependencies:
+      available-typed-arrays: 1.0.7
+      call-bind: 1.0.9
+      call-bound: 1.0.4
+      for-each: 0.3.5
+      get-proto: 1.0.1
+      gopd: 1.2.0
+      has-tostringtag: 1.0.2
+
+  which@2.0.2:
+    dependencies:
+      isexe: 2.0.0
+
+  why-is-node-running@2.3.0:
+    dependencies:
+      siginfo: 2.0.0
+      stackback: 0.0.2
+
+  word-wrap@1.2.5: {}
+
+  wrap-ansi@7.0.0:
+    dependencies:
+      ansi-styles: 4.3.0
+      string-width: 4.2.3
+      strip-ansi: 6.0.1
+
+  xtend@4.0.2: {}
+
+  y18n@5.0.8: {}
+
+  yallist@3.1.1: {}
+
+  yargs-parser@21.1.1: {}
+
+  yargs@17.7.3:
+    dependencies:
+      cliui: 8.0.1
+      escalade: 3.2.0
+      get-caller-file: 2.0.5
+      require-directory: 2.1.1
+      string-width: 4.2.3
+      y18n: 5.0.8
+      yargs-parser: 21.1.1
+
+  yocto-queue@0.1.0: {}
+
+  zeptomatch@2.1.0:
+    dependencies:
+      grammex: 3.1.13
+      graphmatch: 1.1.1
+
+  zod-validation-error@4.0.2(zod@4.4.3):
+    dependencies:
+      zod: 4.4.3
+
+  zod@4.4.3: {}
diff --git a/pnpm-workspace.yaml b/pnpm-workspace.yaml
new file mode 100644
index 0000000..17ddbde
--- /dev/null
+++ b/pnpm-workspace.yaml
@@ -0,0 +1,7 @@
+allowBuilds:
+  '@prisma/engines': true
+  argon2: true
+  esbuild: true
+  prisma: true
+  sharp: true
+  unrs-resolver: true
diff --git a/postcss.config.mjs b/postcss.config.mjs
new file mode 100644
index 0000000..61e3684
--- /dev/null
+++ b/postcss.config.mjs
@@ -0,0 +1,7 @@
+const config = {
+  plugins: {
+    "@tailwindcss/postcss": {},
+  },
+};
+
+export default config;
diff --git a/prisma.config.ts b/prisma.config.ts
new file mode 100644
index 0000000..8cd6739
--- /dev/null
+++ b/prisma.config.ts
@@ -0,0 +1,14 @@
+import "dotenv/config";
+
+import { defineConfig, env } from "prisma/config";
+
+export default defineConfig({
+  schema: "prisma/schema.prisma",
+  migrations: {
+    path: "prisma/migrations",
+    seed: "tsx prisma/seed.ts",
+  },
+  datasource: {
+    url: env("DATABASE_URL"),
+  },
+});
diff --git a/prisma/migrations/20260717173000_initial/migration.sql b/prisma/migrations/20260717173000_initial/migration.sql
new file mode 100644
index 0000000..d8370b8
--- /dev/null
+++ b/prisma/migrations/20260717173000_initial/migration.sql
@@ -0,0 +1,1158 @@
+-- CreateSchema
+CREATE SCHEMA IF NOT EXISTS "public";
+
+-- CreateEnum
+CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');
+
+-- CreateEnum
+CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
+
+-- CreateEnum
+CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST');
+
+-- CreateEnum
+CREATE TYPE "OpportunityStage" AS ENUM ('QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
+
+-- CreateEnum
+CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');
+
+-- CreateEnum
+CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PURCHASING', 'FULFILLING', 'SHIPPED', 'COMPLETED', 'CANCELLED');
+
+-- CreateEnum
+CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');
+
+-- CreateEnum
+CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');
+
+-- CreateEnum
+CREATE TYPE "InventoryTransactionType" AS ENUM ('RECEIPT', 'ISSUE', 'RESERVATION', 'RELEASE', 'TRANSFER', 'COUNT', 'DAMAGE', 'RETURN');
+
+-- CreateEnum
+CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'CONDITIONAL');
+
+-- CreateEnum
+CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'BOOKED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
+
+-- CreateEnum
+CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
+
+-- CreateTable
+CREATE TABLE "User" (
+    "id" UUID NOT NULL,
+    "email" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "passwordHash" TEXT NOT NULL,
+    "locale" TEXT NOT NULL DEFAULT 'en',
+    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
+    "lastLoginAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Role" (
+    "id" UUID NOT NULL,
+    "code" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "description" TEXT,
+    "isSystem" BOOLEAN NOT NULL DEFAULT false,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Permission" (
+    "id" UUID NOT NULL,
+    "code" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "description" TEXT,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "UserRole" (
+    "userId" UUID NOT NULL,
+    "roleId" UUID NOT NULL,
+    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
+);
+
+-- CreateTable
+CREATE TABLE "RolePermission" (
+    "roleId" UUID NOT NULL,
+    "permissionId" UUID NOT NULL,
+
+    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
+);
+
+-- CreateTable
+CREATE TABLE "LoginAttempt" (
+    "id" UUID NOT NULL,
+    "userId" UUID,
+    "email" TEXT NOT NULL,
+    "success" BOOLEAN NOT NULL,
+    "ipAddress" TEXT,
+    "userAgent" TEXT,
+    "reason" TEXT,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "AuditLog" (
+    "id" UUID NOT NULL,
+    "actorId" UUID,
+    "action" TEXT NOT NULL,
+    "entityType" TEXT NOT NULL,
+    "entityId" TEXT,
+    "before" JSONB,
+    "after" JSONB,
+    "metadata" JSONB,
+    "ipAddress" TEXT,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Customer" (
+    "id" UUID NOT NULL,
+    "companyName" TEXT NOT NULL,
+    "legalName" TEXT,
+    "countryCode" TEXT NOT NULL,
+    "website" TEXT,
+    "email" TEXT,
+    "phone" TEXT,
+    "taxId" TEXT,
+    "billingAddress" JSONB,
+    "shippingAddress" JSONB,
+    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
+    "ownerId" UUID NOT NULL,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Contact" (
+    "id" UUID NOT NULL,
+    "customerId" UUID NOT NULL,
+    "firstName" TEXT NOT NULL,
+    "lastName" TEXT NOT NULL,
+    "title" TEXT,
+    "email" TEXT,
+    "phone" TEXT,
+    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
+    "language" TEXT NOT NULL DEFAULT 'en',
+    "timezone" TEXT,
+    "decisionRole" TEXT,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Lead" (
+    "id" UUID NOT NULL,
+    "companyName" TEXT NOT NULL,
+    "contactName" TEXT NOT NULL,
+    "email" TEXT,
+    "phone" TEXT,
+    "countryCode" TEXT NOT NULL,
+    "source" TEXT NOT NULL,
+    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
+    "notes" TEXT,
+    "ownerId" UUID NOT NULL,
+    "convertedCustomerId" UUID,
+    "convertedOpportunityId" UUID,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "FollowUp" (
+    "id" UUID NOT NULL,
+    "leadId" UUID,
+    "opportunityId" UUID,
+    "type" TEXT NOT NULL,
+    "summary" TEXT NOT NULL,
+    "occurredAt" TIMESTAMP(3) NOT NULL,
+    "nextActionAt" TIMESTAMP(3),
+    "createdById" UUID NOT NULL,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Opportunity" (
+    "id" UUID NOT NULL,
+    "customerId" UUID NOT NULL,
+    "name" TEXT NOT NULL,
+    "stage" "OpportunityStage" NOT NULL DEFAULT 'QUALIFICATION',
+    "value" DECIMAL(19,4) NOT NULL,
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "valueUsd" DECIMAL(19,4) NOT NULL,
+    "probability" INTEGER NOT NULL DEFAULT 10,
+    "expectedCloseAt" TIMESTAMP(3),
+    "ownerId" UUID NOT NULL,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "ProductCategory" (
+    "id" UUID NOT NULL,
+    "name" TEXT NOT NULL,
+    "slug" TEXT NOT NULL,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Product" (
+    "id" UUID NOT NULL,
+    "sku" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "description" TEXT,
+    "categoryId" UUID NOT NULL,
+    "brand" TEXT,
+    "model" TEXT,
+    "specifications" JSONB,
+    "serialized" BOOLEAN NOT NULL DEFAULT true,
+    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "ProductVariant" (
+    "id" UUID NOT NULL,
+    "productId" UUID NOT NULL,
+    "sku" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "configuration" JSONB NOT NULL,
+    "cost" DECIMAL(19,4),
+    "currencyCode" TEXT,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Quote" (
+    "id" UUID NOT NULL,
+    "quoteNumber" TEXT NOT NULL,
+    "customerId" UUID NOT NULL,
+    "opportunityId" UUID,
+    "ownerId" UUID NOT NULL,
+    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
+    "currentVersion" INTEGER NOT NULL DEFAULT 1,
+    "validUntil" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "QuoteVersion" (
+    "id" UUID NOT NULL,
+    "quoteId" UUID NOT NULL,
+    "number" INTEGER NOT NULL,
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "subtotal" DECIMAL(19,4) NOT NULL,
+    "shipping" DECIMAL(19,4) NOT NULL DEFAULT 0,
+    "insurance" DECIMAL(19,4) NOT NULL DEFAULT 0,
+    "tax" DECIMAL(19,4) NOT NULL DEFAULT 0,
+    "bankFees" DECIMAL(19,4) NOT NULL DEFAULT 0,
+    "total" DECIMAL(19,4) NOT NULL,
+    "totalUsd" DECIMAL(19,4) NOT NULL,
+    "incoterm" TEXT,
+    "paymentTerms" TEXT,
+    "deliveryTerms" TEXT,
+    "warrantyTerms" TEXT,
+    "remarks" TEXT,
+    "immutableAt" TIMESTAMP(3),
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "QuoteVersion_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "QuoteItem" (
+    "id" UUID NOT NULL,
+    "quoteVersionId" UUID NOT NULL,
+    "productId" UUID,
+    "description" TEXT NOT NULL,
+    "configuration" JSONB,
+    "quantity" INTEGER NOT NULL,
+    "unitPrice" DECIMAL(19,4) NOT NULL,
+    "discount" DECIMAL(19,4) NOT NULL DEFAULT 0,
+    "lineTotal" DECIMAL(19,4) NOT NULL,
+    "estimatedCostUsd" DECIMAL(19,4),
+
+    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "SalesOrder" (
+    "id" UUID NOT NULL,
+    "orderNumber" TEXT NOT NULL,
+    "customerId" UUID NOT NULL,
+    "quoteId" UUID,
+    "ownerId" UUID NOT NULL,
+    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "total" DECIMAL(19,4) NOT NULL,
+    "totalUsd" DECIMAL(19,4) NOT NULL,
+    "paymentTerms" TEXT NOT NULL,
+    "purchaseOverrideReason" TEXT,
+    "purchaseOverriddenAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "SalesOrderItem" (
+    "id" UUID NOT NULL,
+    "salesOrderId" UUID NOT NULL,
+    "productId" UUID,
+    "description" TEXT NOT NULL,
+    "configuration" JSONB,
+    "quantity" INTEGER NOT NULL,
+    "unitPrice" DECIMAL(19,4) NOT NULL,
+    "lineTotal" DECIMAL(19,4) NOT NULL,
+
+    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Payment" (
+    "id" UUID NOT NULL,
+    "salesOrderId" UUID NOT NULL,
+    "reference" TEXT,
+    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
+    "amount" DECIMAL(19,4) NOT NULL,
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "amountUsd" DECIMAL(19,4) NOT NULL,
+    "receivedAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Refund" (
+    "id" UUID NOT NULL,
+    "salesOrderId" UUID NOT NULL,
+    "paymentId" UUID,
+    "amount" DECIMAL(19,4) NOT NULL,
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "amountUsd" DECIMAL(19,4) NOT NULL,
+    "reason" TEXT NOT NULL,
+    "refundedAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Cost" (
+    "id" UUID NOT NULL,
+    "salesOrderId" UUID NOT NULL,
+    "category" TEXT NOT NULL,
+    "description" TEXT NOT NULL,
+    "amount" DECIMAL(19,4) NOT NULL,
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "amountUsd" DECIMAL(19,4) NOT NULL,
+    "incurredAt" TIMESTAMP(3) NOT NULL,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Cost_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Supplier" (
+    "id" UUID NOT NULL,
+    "code" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "countryCode" TEXT NOT NULL,
+    "contactName" TEXT,
+    "email" TEXT,
+    "phone" TEXT,
+    "address" JSONB,
+    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "SupplierProduct" (
+    "supplierId" UUID NOT NULL,
+    "productId" UUID NOT NULL,
+    "supplierSku" TEXT,
+    "leadTimeDays" INTEGER,
+    "lastCost" DECIMAL(19,4),
+    "currencyCode" TEXT,
+
+    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("supplierId","productId")
+);
+
+-- CreateTable
+CREATE TABLE "PurchaseOrder" (
+    "id" UUID NOT NULL,
+    "purchaseOrderNumber" TEXT NOT NULL,
+    "supplierId" UUID NOT NULL,
+    "salesOrderId" UUID,
+    "buyerId" UUID NOT NULL,
+    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
+    "currencyCode" TEXT NOT NULL,
+    "exchangeRateToUsd" DECIMAL(24,12) NOT NULL,
+    "total" DECIMAL(19,4) NOT NULL,
+    "totalUsd" DECIMAL(19,4) NOT NULL,
+    "expectedAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "PurchaseOrderItem" (
+    "id" UUID NOT NULL,
+    "purchaseOrderId" UUID NOT NULL,
+    "salesOrderItemId" UUID,
+    "description" TEXT NOT NULL,
+    "quantity" INTEGER NOT NULL,
+    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
+    "unitCost" DECIMAL(19,4) NOT NULL,
+    "lineTotal" DECIMAL(19,4) NOT NULL,
+
+    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Warehouse" (
+    "id" UUID NOT NULL,
+    "code" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "address" JSONB,
+    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "WarehouseLocation" (
+    "id" UUID NOT NULL,
+    "warehouseId" UUID NOT NULL,
+    "code" TEXT NOT NULL,
+    "name" TEXT NOT NULL,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "WarehouseLocation_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "InventoryItem" (
+    "id" UUID NOT NULL,
+    "productId" UUID NOT NULL,
+    "locationId" UUID NOT NULL,
+    "purchaseOrderItemId" UUID,
+    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
+    "quantityReserved" INTEGER NOT NULL DEFAULT 0,
+    "unitCostUsd" DECIMAL(19,4),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "InventorySerial" (
+    "id" UUID NOT NULL,
+    "inventoryItemId" UUID NOT NULL,
+    "serialNumber" TEXT NOT NULL,
+    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
+    "receivedAt" TIMESTAMP(3),
+    "issuedAt" TIMESTAMP(3),
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "InventorySerial_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "InventoryTransaction" (
+    "id" UUID NOT NULL,
+    "inventoryItemId" UUID NOT NULL,
+    "type" "InventoryTransactionType" NOT NULL,
+    "quantity" INTEGER NOT NULL,
+    "fromLocationId" UUID,
+    "toLocationId" UUID,
+    "referenceType" TEXT,
+    "referenceId" TEXT,
+    "notes" TEXT,
+    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "createdById" UUID NOT NULL,
+
+    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "QualityInspection" (
+    "id" UUID NOT NULL,
+    "inventoryItemId" UUID NOT NULL,
+    "inspectorId" UUID NOT NULL,
+    "status" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
+    "checklist" JSONB,
+    "notes" TEXT,
+    "inspectedAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "QualityInspection_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Shipment" (
+    "id" UUID NOT NULL,
+    "shipmentNumber" TEXT NOT NULL,
+    "salesOrderId" UUID NOT NULL,
+    "coordinatorId" UUID NOT NULL,
+    "status" "ShipmentStatus" NOT NULL DEFAULT 'DRAFT',
+    "carrier" TEXT,
+    "trackingNumber" TEXT,
+    "incoterm" TEXT,
+    "origin" TEXT,
+    "destination" TEXT,
+    "shippedAt" TIMESTAMP(3),
+    "deliveredAt" TIMESTAMP(3),
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "ShipmentItem" (
+    "id" UUID NOT NULL,
+    "shipmentId" UUID NOT NULL,
+    "salesOrderItemId" UUID NOT NULL,
+    "quantity" INTEGER NOT NULL,
+
+    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "AfterSalesTicket" (
+    "id" UUID NOT NULL,
+    "ticketNumber" TEXT NOT NULL,
+    "customerId" UUID NOT NULL,
+    "salesOrderId" UUID,
+    "assignedToId" UUID,
+    "subject" TEXT NOT NULL,
+    "description" TEXT NOT NULL,
+    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
+    "status" TEXT NOT NULL DEFAULT 'OPEN',
+    "resolution" TEXT,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "closedAt" TIMESTAMP(3),
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "AfterSalesTicket_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Task" (
+    "id" UUID NOT NULL,
+    "title" TEXT NOT NULL,
+    "description" TEXT,
+    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
+    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
+    "dueAt" TIMESTAMP(3),
+    "assigneeId" UUID NOT NULL,
+    "creatorId" UUID NOT NULL,
+    "entityType" TEXT,
+    "entityId" TEXT,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+    "completedAt" TIMESTAMP(3),
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Notification" (
+    "id" UUID NOT NULL,
+    "userId" UUID NOT NULL,
+    "type" TEXT NOT NULL,
+    "title" TEXT NOT NULL,
+    "message" TEXT NOT NULL,
+    "link" TEXT,
+    "readAt" TIMESTAMP(3),
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "FileAsset" (
+    "id" UUID NOT NULL,
+    "bucket" TEXT NOT NULL,
+    "objectKey" TEXT NOT NULL,
+    "fileName" TEXT NOT NULL,
+    "contentType" TEXT NOT NULL,
+    "sizeBytes" BIGINT NOT NULL,
+    "checksum" TEXT,
+    "entityType" TEXT,
+    "entityId" TEXT,
+    "uploaderId" UUID NOT NULL,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "deletedAt" TIMESTAMP(3),
+
+    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Currency" (
+    "code" CHAR(3) NOT NULL,
+    "name" TEXT NOT NULL,
+    "symbol" TEXT NOT NULL,
+    "decimals" INTEGER NOT NULL DEFAULT 2,
+    "isActive" BOOLEAN NOT NULL DEFAULT true,
+    "isBase" BOOLEAN NOT NULL DEFAULT false,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "Currency_pkey" PRIMARY KEY ("code")
+);
+
+-- CreateTable
+CREATE TABLE "ExchangeRate" (
+    "id" UUID NOT NULL,
+    "currencyCode" CHAR(3) NOT NULL,
+    "rateToUsd" DECIMAL(24,12) NOT NULL,
+    "effectiveAt" TIMESTAMP(3) NOT NULL,
+    "source" TEXT NOT NULL DEFAULT 'MANUAL',
+    "createdById" UUID,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+
+    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Setting" (
+    "id" UUID NOT NULL,
+    "namespace" TEXT NOT NULL,
+    "key" TEXT NOT NULL,
+    "value" JSONB NOT NULL,
+    "isSecret" BOOLEAN NOT NULL DEFAULT false,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateTable
+CREATE TABLE "Sequence" (
+    "id" UUID NOT NULL,
+    "key" TEXT NOT NULL,
+    "prefix" TEXT NOT NULL,
+    "nextValue" BIGINT NOT NULL DEFAULT 1,
+    "padding" INTEGER NOT NULL DEFAULT 6,
+    "version" INTEGER NOT NULL DEFAULT 1,
+    "updatedAt" TIMESTAMP(3) NOT NULL,
+
+    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
+);
+
+-- CreateIndex
+CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
+
+-- CreateIndex
+CREATE INDEX "User_status_deletedAt_idx" ON "User"("status", "deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");
+
+-- CreateIndex
+CREATE INDEX "Role_deletedAt_idx" ON "Role"("deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
+
+-- CreateIndex
+CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");
+
+-- CreateIndex
+CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");
+
+-- CreateIndex
+CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");
+
+-- CreateIndex
+CREATE INDEX "LoginAttempt_userId_createdAt_idx" ON "LoginAttempt"("userId", "createdAt");
+
+-- CreateIndex
+CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
+
+-- CreateIndex
+CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
+
+-- CreateIndex
+CREATE INDEX "Customer_ownerId_status_deletedAt_idx" ON "Customer"("ownerId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Customer_countryCode_idx" ON "Customer"("countryCode");
+
+-- CreateIndex
+CREATE INDEX "Contact_customerId_deletedAt_idx" ON "Contact"("customerId", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Contact_email_idx" ON "Contact"("email");
+
+-- CreateIndex
+CREATE INDEX "Lead_ownerId_status_deletedAt_idx" ON "Lead"("ownerId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Lead_countryCode_source_idx" ON "Lead"("countryCode", "source");
+
+-- CreateIndex
+CREATE INDEX "FollowUp_leadId_occurredAt_idx" ON "FollowUp"("leadId", "occurredAt");
+
+-- CreateIndex
+CREATE INDEX "FollowUp_opportunityId_occurredAt_idx" ON "FollowUp"("opportunityId", "occurredAt");
+
+-- CreateIndex
+CREATE INDEX "FollowUp_nextActionAt_idx" ON "FollowUp"("nextActionAt");
+
+-- CreateIndex
+CREATE INDEX "Opportunity_ownerId_stage_deletedAt_idx" ON "Opportunity"("ownerId", "stage", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Opportunity_customerId_idx" ON "Opportunity"("customerId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
+
+-- CreateIndex
+CREATE INDEX "Product_categoryId_status_deletedAt_idx" ON "Product"("categoryId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
+
+-- CreateIndex
+CREATE INDEX "ProductVariant_productId_deletedAt_idx" ON "ProductVariant"("productId", "deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
+
+-- CreateIndex
+CREATE INDEX "Quote_ownerId_status_deletedAt_idx" ON "Quote"("ownerId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");
+
+-- CreateIndex
+CREATE INDEX "QuoteVersion_quoteId_createdAt_idx" ON "QuoteVersion"("quoteId", "createdAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "QuoteVersion_quoteId_number_key" ON "QuoteVersion"("quoteId", "number");
+
+-- CreateIndex
+CREATE INDEX "QuoteItem_quoteVersionId_idx" ON "QuoteItem"("quoteVersionId");
+
+-- CreateIndex
+CREATE INDEX "QuoteItem_productId_idx" ON "QuoteItem"("productId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "SalesOrder_orderNumber_key" ON "SalesOrder"("orderNumber");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "SalesOrder_quoteId_key" ON "SalesOrder"("quoteId");
+
+-- CreateIndex
+CREATE INDEX "SalesOrder_ownerId_status_deletedAt_idx" ON "SalesOrder"("ownerId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");
+
+-- CreateIndex
+CREATE INDEX "SalesOrderItem_salesOrderId_idx" ON "SalesOrderItem"("salesOrderId");
+
+-- CreateIndex
+CREATE INDEX "Payment_salesOrderId_status_deletedAt_idx" ON "Payment"("salesOrderId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Refund_salesOrderId_deletedAt_idx" ON "Refund"("salesOrderId", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");
+
+-- CreateIndex
+CREATE INDEX "Cost_salesOrderId_category_deletedAt_idx" ON "Cost"("salesOrderId", "category", "deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");
+
+-- CreateIndex
+CREATE INDEX "Supplier_status_deletedAt_idx" ON "Supplier"("status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Supplier_countryCode_idx" ON "Supplier"("countryCode");
+
+-- CreateIndex
+CREATE INDEX "SupplierProduct_productId_idx" ON "SupplierProduct"("productId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "PurchaseOrder_purchaseOrderNumber_key" ON "PurchaseOrder"("purchaseOrderNumber");
+
+-- CreateIndex
+CREATE INDEX "PurchaseOrder_supplierId_status_deletedAt_idx" ON "PurchaseOrder"("supplierId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "PurchaseOrder_salesOrderId_idx" ON "PurchaseOrder"("salesOrderId");
+
+-- CreateIndex
+CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");
+
+-- CreateIndex
+CREATE INDEX "PurchaseOrderItem_salesOrderItemId_idx" ON "PurchaseOrderItem"("salesOrderItemId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "WarehouseLocation_warehouseId_code_key" ON "WarehouseLocation"("warehouseId", "code");
+
+-- CreateIndex
+CREATE INDEX "InventoryItem_locationId_deletedAt_idx" ON "InventoryItem"("locationId", "deletedAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "InventoryItem_productId_locationId_purchaseOrderItemId_key" ON "InventoryItem"("productId", "locationId", "purchaseOrderItemId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "InventorySerial_serialNumber_key" ON "InventorySerial"("serialNumber");
+
+-- CreateIndex
+CREATE INDEX "InventorySerial_inventoryItemId_status_idx" ON "InventorySerial"("inventoryItemId", "status");
+
+-- CreateIndex
+CREATE INDEX "InventoryTransaction_inventoryItemId_occurredAt_idx" ON "InventoryTransaction"("inventoryItemId", "occurredAt");
+
+-- CreateIndex
+CREATE INDEX "InventoryTransaction_referenceType_referenceId_idx" ON "InventoryTransaction"("referenceType", "referenceId");
+
+-- CreateIndex
+CREATE INDEX "QualityInspection_inventoryItemId_status_idx" ON "QualityInspection"("inventoryItemId", "status");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");
+
+-- CreateIndex
+CREATE INDEX "Shipment_salesOrderId_status_deletedAt_idx" ON "Shipment"("salesOrderId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "ShipmentItem_shipmentId_salesOrderItemId_key" ON "ShipmentItem"("shipmentId", "salesOrderItemId");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "AfterSalesTicket_ticketNumber_key" ON "AfterSalesTicket"("ticketNumber");
+
+-- CreateIndex
+CREATE INDEX "AfterSalesTicket_assignedToId_status_deletedAt_idx" ON "AfterSalesTicket"("assignedToId", "status", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "AfterSalesTicket_customerId_idx" ON "AfterSalesTicket"("customerId");
+
+-- CreateIndex
+CREATE INDEX "Task_assigneeId_status_dueAt_deletedAt_idx" ON "Task"("assigneeId", "status", "dueAt", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "Task_entityType_entityId_idx" ON "Task"("entityType", "entityId");
+
+-- CreateIndex
+CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "FileAsset_objectKey_key" ON "FileAsset"("objectKey");
+
+-- CreateIndex
+CREATE INDEX "FileAsset_entityType_entityId_deletedAt_idx" ON "FileAsset"("entityType", "entityId", "deletedAt");
+
+-- CreateIndex
+CREATE INDEX "ExchangeRate_effectiveAt_idx" ON "ExchangeRate"("effectiveAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "ExchangeRate_currencyCode_effectiveAt_key" ON "ExchangeRate"("currencyCode", "effectiveAt");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Setting_namespace_key_key" ON "Setting"("namespace", "key");
+
+-- CreateIndex
+CREATE UNIQUE INDEX "Sequence_key_key" ON "Sequence"("key");
+
+-- AddForeignKey
+ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Customer" ADD CONSTRAINT "Customer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Contact" ADD CONSTRAINT "Contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Quote" ADD CONSTRAINT "Quote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Quote" ADD CONSTRAINT "Quote_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Payment" ADD CONSTRAINT "Payment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Refund" ADD CONSTRAINT "Refund_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Cost" ADD CONSTRAINT "Cost_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "WarehouseLocation" ADD CONSTRAINT "WarehouseLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventorySerial" ADD CONSTRAINT "InventorySerial_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "QualityInspection" ADD CONSTRAINT "QualityInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "AfterSalesTicket" ADD CONSTRAINT "AfterSalesTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "AfterSalesTicket" ADD CONSTRAINT "AfterSalesTicket_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "AfterSalesTicket" ADD CONSTRAINT "AfterSalesTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
+
+-- AddForeignKey
+ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
diff --git a/prisma/migrations/migration_lock.toml b/prisma/migrations/migration_lock.toml
new file mode 100644
index 0000000..1eed3a5
--- /dev/null
+++ b/prisma/migrations/migration_lock.toml
@@ -0,0 +1,2 @@
+# Please do not edit this file manually
+provider = "postgresql"
diff --git a/prisma/schema.prisma b/prisma/schema.prisma
new file mode 100644
index 0000000..0f905c2
--- /dev/null
+++ b/prisma/schema.prisma
@@ -0,0 +1,910 @@
+generator client {
+  provider = "prisma-client"
+  output   = "../src/generated/prisma"
+}
+
+datasource db {
+  provider = "postgresql"
+}
+
+enum UserStatus {
+  ACTIVE
+  INACTIVE
+  LOCKED
+}
+
+enum RecordStatus {
+  ACTIVE
+  INACTIVE
+  ARCHIVED
+}
+
+enum LeadStatus {
+  NEW
+  CONTACTED
+  QUALIFIED
+  CONVERTED
+  LOST
+}
+
+enum OpportunityStage {
+  QUALIFICATION
+  DISCOVERY
+  PROPOSAL
+  NEGOTIATION
+  WON
+  LOST
+}
+
+enum QuoteStatus {
+  DRAFT
+  PENDING_APPROVAL
+  APPROVED
+  SENT
+  VIEWED
+  ACCEPTED
+  REJECTED
+  EXPIRED
+  CONVERTED
+}
+
+enum OrderStatus {
+  DRAFT
+  CONFIRMED
+  PURCHASING
+  FULFILLING
+  SHIPPED
+  COMPLETED
+  CANCELLED
+}
+
+enum PaymentStatus {
+  PENDING
+  CONFIRMED
+  FAILED
+  CANCELLED
+}
+
+enum PurchaseOrderStatus {
+  DRAFT
+  APPROVED
+  SENT
+  PARTIALLY_RECEIVED
+  RECEIVED
+  CANCELLED
+}
+
+enum InventoryTransactionType {
+  RECEIPT
+  ISSUE
+  RESERVATION
+  RELEASE
+  TRANSFER
+  COUNT
+  DAMAGE
+  RETURN
+}
+
+enum InspectionStatus {
+  PENDING
+  PASSED
+  FAILED
+  CONDITIONAL
+}
+
+enum ShipmentStatus {
+  DRAFT
+  BOOKED
+  IN_TRANSIT
+  DELIVERED
+  CANCELLED
+}
+
+enum TaskStatus {
+  OPEN
+  IN_PROGRESS
+  COMPLETED
+  CANCELLED
+}
+
+model User {
+  id                 String              @id @default(uuid()) @db.Uuid
+  email              String              @unique
+  name               String
+  passwordHash       String
+  locale             String              @default("en")
+  status             UserStatus          @default(ACTIVE)
+  lastLoginAt        DateTime?
+  version            Int                 @default(1)
+  createdAt          DateTime            @default(now())
+  updatedAt          DateTime            @updatedAt
+  deletedAt          DateTime?
+  roles              UserRole[]
+  loginAttempts      LoginAttempt[]
+  auditLogs          AuditLog[]          @relation("AuditActor")
+  ownedCustomers     Customer[]          @relation("CustomerOwner")
+  ownedLeads         Lead[]              @relation("LeadOwner")
+  ownedOpportunities Opportunity[]       @relation("OpportunityOwner")
+  ownedQuotes        Quote[]             @relation("QuoteOwner")
+  ownedOrders        SalesOrder[]        @relation("OrderOwner")
+  purchaseOrders     PurchaseOrder[]     @relation("PurchaseBuyer")
+  inspections        QualityInspection[] @relation("InspectionInspector")
+  shipments          Shipment[]          @relation("ShipmentCoordinator")
+  assignedTickets    AfterSalesTicket[]  @relation("TicketAssignee")
+  assignedTasks      Task[]              @relation("TaskAssignee")
+  createdTasks       Task[]              @relation("TaskCreator")
+  notifications      Notification[]
+  uploadedFiles      FileAsset[]         @relation("FileUploader")
+
+  @@index([status, deletedAt])
+}
+
+model Role {
+  id          String           @id @default(uuid()) @db.Uuid
+  code        String           @unique
+  name        String
+  description String?
+  isSystem    Boolean          @default(false)
+  version     Int              @default(1)
+  createdAt   DateTime         @default(now())
+  updatedAt   DateTime         @updatedAt
+  deletedAt   DateTime?
+  users       UserRole[]
+  permissions RolePermission[]
+
+  @@index([deletedAt])
+}
+
+model Permission {
+  id          String           @id @default(uuid()) @db.Uuid
+  code        String           @unique
+  name        String
+  description String?
+  createdAt   DateTime         @default(now())
+  updatedAt   DateTime         @updatedAt
+  roles       RolePermission[]
+}
+
+model UserRole {
+  userId     String   @db.Uuid
+  roleId     String   @db.Uuid
+  assignedAt DateTime @default(now())
+  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
+  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
+
+  @@id([userId, roleId])
+  @@index([roleId])
+}
+
+model RolePermission {
+  roleId       String     @db.Uuid
+  permissionId String     @db.Uuid
+  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
+  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
+
+  @@id([roleId, permissionId])
+  @@index([permissionId])
+}
+
+model LoginAttempt {
+  id        String   @id @default(uuid()) @db.Uuid
+  userId    String?  @db.Uuid
+  email     String
+  success   Boolean
+  ipAddress String?
+  userAgent String?
+  reason    String?
+  createdAt DateTime @default(now())
+  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
+
+  @@index([email, createdAt])
+  @@index([userId, createdAt])
+}
+
+model AuditLog {
+  id         String   @id @default(uuid()) @db.Uuid
+  actorId    String?  @db.Uuid
+  action     String
+  entityType String
+  entityId   String?
+  before     Json?
+  after      Json?
+  metadata   Json?
+  ipAddress  String?
+  createdAt  DateTime @default(now())
+  actor      User?    @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)
+
+  @@index([entityType, entityId, createdAt])
+  @@index([actorId, createdAt])
+}
+
+model Customer {
+  id              String             @id @default(uuid()) @db.Uuid
+  companyName     String
+  legalName       String?
+  countryCode     String
+  website         String?
+  email           String?
+  phone           String?
+  taxId           String?
+  billingAddress  Json?
+  shippingAddress Json?
+  status          RecordStatus       @default(ACTIVE)
+  ownerId         String             @db.Uuid
+  version         Int                @default(1)
+  createdAt       DateTime           @default(now())
+  updatedAt       DateTime           @updatedAt
+  deletedAt       DateTime?
+  owner           User               @relation("CustomerOwner", fields: [ownerId], references: [id])
+  contacts        Contact[]
+  opportunities   Opportunity[]
+  quotes          Quote[]
+  orders          SalesOrder[]
+  tickets         AfterSalesTicket[]
+
+  @@index([ownerId, status, deletedAt])
+  @@index([countryCode])
+}
+
+model Contact {
+  id           String    @id @default(uuid()) @db.Uuid
+  customerId   String    @db.Uuid
+  firstName    String
+  lastName     String
+  title        String?
+  email        String?
+  phone        String?
+  isPrimary    Boolean   @default(false)
+  language     String    @default("en")
+  timezone     String?
+  decisionRole String?
+  version      Int       @default(1)
+  createdAt    DateTime  @default(now())
+  updatedAt    DateTime  @updatedAt
+  deletedAt    DateTime?
+  customer     Customer  @relation(fields: [customerId], references: [id])
+
+  @@index([customerId, deletedAt])
+  @@index([email])
+}
+
+model Lead {
+  id                     String     @id @default(uuid()) @db.Uuid
+  companyName            String
+  contactName            String
+  email                  String?
+  phone                  String?
+  countryCode            String
+  source                 String
+  status                 LeadStatus @default(NEW)
+  notes                  String?
+  ownerId                String     @db.Uuid
+  convertedCustomerId    String?    @db.Uuid
+  convertedOpportunityId String?    @db.Uuid
+  version                Int        @default(1)
+  createdAt              DateTime   @default(now())
+  updatedAt              DateTime   @updatedAt
+  deletedAt              DateTime?
+  owner                  User       @relation("LeadOwner", fields: [ownerId], references: [id])
+  followUps              FollowUp[]
+
+  @@index([ownerId, status, deletedAt])
+  @@index([countryCode, source])
+}
+
+model FollowUp {
+  id            String       @id @default(uuid()) @db.Uuid
+  leadId        String?      @db.Uuid
+  opportunityId String?      @db.Uuid
+  type          String
+  summary       String
+  occurredAt    DateTime
+  nextActionAt  DateTime?
+  createdById   String       @db.Uuid
+  createdAt     DateTime     @default(now())
+  updatedAt     DateTime     @updatedAt
+  deletedAt     DateTime?
+  lead          Lead?        @relation(fields: [leadId], references: [id])
+  opportunity   Opportunity? @relation(fields: [opportunityId], references: [id])
+
+  @@index([leadId, occurredAt])
+  @@index([opportunityId, occurredAt])
+  @@index([nextActionAt])
+}
+
+model Opportunity {
+  id                String           @id @default(uuid()) @db.Uuid
+  customerId        String           @db.Uuid
+  name              String
+  stage             OpportunityStage @default(QUALIFICATION)
+  value             Decimal          @db.Decimal(19, 4)
+  currencyCode      String
+  exchangeRateToUsd Decimal          @db.Decimal(24, 12)
+  valueUsd          Decimal          @db.Decimal(19, 4)
+  probability       Int              @default(10)
+  expectedCloseAt   DateTime?
+  ownerId           String           @db.Uuid
+  version           Int              @default(1)
+  createdAt         DateTime         @default(now())
+  updatedAt         DateTime         @updatedAt
+  deletedAt         DateTime?
+  customer          Customer         @relation(fields: [customerId], references: [id])
+  owner             User             @relation("OpportunityOwner", fields: [ownerId], references: [id])
+  followUps         FollowUp[]
+  quotes            Quote[]
+
+  @@index([ownerId, stage, deletedAt])
+  @@index([customerId])
+}
+
+model ProductCategory {
+  id        String    @id @default(uuid()) @db.Uuid
+  name      String
+  slug      String    @unique
+  createdAt DateTime  @default(now())
+  updatedAt DateTime  @updatedAt
+  deletedAt DateTime?
+  products  Product[]
+}
+
+model Product {
+  id               String            @id @default(uuid()) @db.Uuid
+  sku              String            @unique
+  name             String
+  description      String?
+  categoryId       String            @db.Uuid
+  brand            String?
+  model            String?
+  specifications   Json?
+  serialized       Boolean           @default(true)
+  status           RecordStatus      @default(ACTIVE)
+  version          Int               @default(1)
+  createdAt        DateTime          @default(now())
+  updatedAt        DateTime          @updatedAt
+  deletedAt        DateTime?
+  category         ProductCategory   @relation(fields: [categoryId], references: [id])
+  variants         ProductVariant[]
+  quoteItems       QuoteItem[]
+  orderItems       SalesOrderItem[]
+  supplierProducts SupplierProduct[]
+  inventoryItems   InventoryItem[]
+
+  @@index([categoryId, status, deletedAt])
+}
+
+model ProductVariant {
+  id            String    @id @default(uuid()) @db.Uuid
+  productId     String    @db.Uuid
+  sku           String    @unique
+  name          String
+  configuration Json
+  cost          Decimal?  @db.Decimal(19, 4)
+  currencyCode  String?
+  version       Int       @default(1)
+  createdAt     DateTime  @default(now())
+  updatedAt     DateTime  @updatedAt
+  deletedAt     DateTime?
+  product       Product   @relation(fields: [productId], references: [id])
+
+  @@index([productId, deletedAt])
+}
+
+model Quote {
+  id             String         @id @default(uuid()) @db.Uuid
+  quoteNumber    String         @unique
+  customerId     String         @db.Uuid
+  opportunityId  String?        @db.Uuid
+  ownerId        String         @db.Uuid
+  status         QuoteStatus    @default(DRAFT)
+  currentVersion Int            @default(1)
+  validUntil     DateTime?
+  version        Int            @default(1)
+  createdAt      DateTime       @default(now())
+  updatedAt      DateTime       @updatedAt
+  deletedAt      DateTime?
+  customer       Customer       @relation(fields: [customerId], references: [id])
+  opportunity    Opportunity?   @relation(fields: [opportunityId], references: [id])
+  owner          User           @relation("QuoteOwner", fields: [ownerId], references: [id])
+  versions       QuoteVersion[]
+  order          SalesOrder?
+
+  @@index([ownerId, status, deletedAt])
+  @@index([customerId])
+}
+
+model QuoteVersion {
+  id                String      @id @default(uuid()) @db.Uuid
+  quoteId           String      @db.Uuid
+  number            Int
+  currencyCode      String
+  exchangeRateToUsd Decimal     @db.Decimal(24, 12)
+  subtotal          Decimal     @db.Decimal(19, 4)
+  shipping          Decimal     @default(0) @db.Decimal(19, 4)
+  insurance         Decimal     @default(0) @db.Decimal(19, 4)
+  tax               Decimal     @default(0) @db.Decimal(19, 4)
+  bankFees          Decimal     @default(0) @db.Decimal(19, 4)
+  total             Decimal     @db.Decimal(19, 4)
+  totalUsd          Decimal     @db.Decimal(19, 4)
+  incoterm          String?
+  paymentTerms      String?
+  deliveryTerms     String?
+  warrantyTerms     String?
+  remarks           String?
+  immutableAt       DateTime?
+  createdAt         DateTime    @default(now())
+  quote             Quote       @relation(fields: [quoteId], references: [id])
+  items             QuoteItem[]
+
+  @@unique([quoteId, number])
+  @@index([quoteId, createdAt])
+}
+
+model QuoteItem {
+  id               String       @id @default(uuid()) @db.Uuid
+  quoteVersionId   String       @db.Uuid
+  productId        String?      @db.Uuid
+  description      String
+  configuration    Json?
+  quantity         Int
+  unitPrice        Decimal      @db.Decimal(19, 4)
+  discount         Decimal      @default(0) @db.Decimal(19, 4)
+  lineTotal        Decimal      @db.Decimal(19, 4)
+  estimatedCostUsd Decimal?     @db.Decimal(19, 4)
+  quoteVersion     QuoteVersion @relation(fields: [quoteVersionId], references: [id], onDelete: Cascade)
+  product          Product?     @relation(fields: [productId], references: [id])
+
+  @@index([quoteVersionId])
+  @@index([productId])
+}
+
+model SalesOrder {
+  id                     String             @id @default(uuid()) @db.Uuid
+  orderNumber            String             @unique
+  customerId             String             @db.Uuid
+  quoteId                String?            @unique @db.Uuid
+  ownerId                String             @db.Uuid
+  status                 OrderStatus        @default(DRAFT)
+  currencyCode           String
+  exchangeRateToUsd      Decimal            @db.Decimal(24, 12)
+  total                  Decimal            @db.Decimal(19, 4)
+  totalUsd               Decimal            @db.Decimal(19, 4)
+  paymentTerms           String
+  purchaseOverrideReason String?
+  purchaseOverriddenAt   DateTime?
+  version                Int                @default(1)
+  createdAt              DateTime           @default(now())
+  updatedAt              DateTime           @updatedAt
+  deletedAt              DateTime?
+  customer               Customer           @relation(fields: [customerId], references: [id])
+  quote                  Quote?             @relation(fields: [quoteId], references: [id])
+  owner                  User               @relation("OrderOwner", fields: [ownerId], references: [id])
+  items                  SalesOrderItem[]
+  payments               Payment[]
+  refunds                Refund[]
+  costs                  Cost[]
+  purchaseOrders         PurchaseOrder[]
+  shipments              Shipment[]
+  tickets                AfterSalesTicket[]
+
+  @@index([ownerId, status, deletedAt])
+  @@index([customerId])
+}
+
+model SalesOrderItem {
+  id            String              @id @default(uuid()) @db.Uuid
+  salesOrderId  String              @db.Uuid
+  productId     String?             @db.Uuid
+  description   String
+  configuration Json?
+  quantity      Int
+  unitPrice     Decimal             @db.Decimal(19, 4)
+  lineTotal     Decimal             @db.Decimal(19, 4)
+  salesOrder    SalesOrder          @relation(fields: [salesOrderId], references: [id], onDelete: Cascade)
+  product       Product?            @relation(fields: [productId], references: [id])
+  purchaseItems PurchaseOrderItem[]
+  shipmentItems ShipmentItem[]
+
+  @@index([salesOrderId])
+}
+
+model Payment {
+  id                String        @id @default(uuid()) @db.Uuid
+  salesOrderId      String        @db.Uuid
+  reference         String?
+  status            PaymentStatus @default(PENDING)
+  amount            Decimal       @db.Decimal(19, 4)
+  currencyCode      String
+  exchangeRateToUsd Decimal       @db.Decimal(24, 12)
+  amountUsd         Decimal       @db.Decimal(19, 4)
+  receivedAt        DateTime?
+  version           Int           @default(1)
+  createdAt         DateTime      @default(now())
+  updatedAt         DateTime      @updatedAt
+  deletedAt         DateTime?
+  salesOrder        SalesOrder    @relation(fields: [salesOrderId], references: [id])
+  refunds           Refund[]
+
+  @@index([salesOrderId, status, deletedAt])
+}
+
+model Refund {
+  id                String     @id @default(uuid()) @db.Uuid
+  salesOrderId      String     @db.Uuid
+  paymentId         String?    @db.Uuid
+  amount            Decimal    @db.Decimal(19, 4)
+  currencyCode      String
+  exchangeRateToUsd Decimal    @db.Decimal(24, 12)
+  amountUsd         Decimal    @db.Decimal(19, 4)
+  reason            String
+  refundedAt        DateTime?
+  version           Int        @default(1)
+  createdAt         DateTime   @default(now())
+  updatedAt         DateTime   @updatedAt
+  deletedAt         DateTime?
+  salesOrder        SalesOrder @relation(fields: [salesOrderId], references: [id])
+  payment           Payment?   @relation(fields: [paymentId], references: [id])
+
+  @@index([salesOrderId, deletedAt])
+  @@index([paymentId])
+}
+
+model Cost {
+  id                String     @id @default(uuid()) @db.Uuid
+  salesOrderId      String     @db.Uuid
+  category          String
+  description       String
+  amount            Decimal    @db.Decimal(19, 4)
+  currencyCode      String
+  exchangeRateToUsd Decimal    @db.Decimal(24, 12)
+  amountUsd         Decimal    @db.Decimal(19, 4)
+  incurredAt        DateTime
+  version           Int        @default(1)
+  createdAt         DateTime   @default(now())
+  updatedAt         DateTime   @updatedAt
+  deletedAt         DateTime?
+  salesOrder        SalesOrder @relation(fields: [salesOrderId], references: [id])
+
+  @@index([salesOrderId, category, deletedAt])
+}
+
+model Supplier {
+  id             String            @id @default(uuid()) @db.Uuid
+  code           String            @unique
+  name           String
+  countryCode    String
+  contactName    String?
+  email          String?
+  phone          String?
+  address        Json?
+  status         RecordStatus      @default(ACTIVE)
+  version        Int               @default(1)
+  createdAt      DateTime          @default(now())
+  updatedAt      DateTime          @updatedAt
+  deletedAt      DateTime?
+  products       SupplierProduct[]
+  purchaseOrders PurchaseOrder[]
+
+  @@index([status, deletedAt])
+  @@index([countryCode])
+}
+
+model SupplierProduct {
+  supplierId   String   @db.Uuid
+  productId    String   @db.Uuid
+  supplierSku  String?
+  leadTimeDays Int?
+  lastCost     Decimal? @db.Decimal(19, 4)
+  currencyCode String?
+  supplier     Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
+  product      Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
+
+  @@id([supplierId, productId])
+  @@index([productId])
+}
+
+model PurchaseOrder {
+  id                  String              @id @default(uuid()) @db.Uuid
+  purchaseOrderNumber String              @unique
+  supplierId          String              @db.Uuid
+  salesOrderId        String?             @db.Uuid
+  buyerId             String              @db.Uuid
+  status              PurchaseOrderStatus @default(DRAFT)
+  currencyCode        String
+  exchangeRateToUsd   Decimal             @db.Decimal(24, 12)
+  total               Decimal             @db.Decimal(19, 4)
+  totalUsd            Decimal             @db.Decimal(19, 4)
+  expectedAt          DateTime?
+  version             Int                 @default(1)
+  createdAt           DateTime            @default(now())
+  updatedAt           DateTime            @updatedAt
+  deletedAt           DateTime?
+  supplier            Supplier            @relation(fields: [supplierId], references: [id])
+  salesOrder          SalesOrder?         @relation(fields: [salesOrderId], references: [id])
+  buyer               User                @relation("PurchaseBuyer", fields: [buyerId], references: [id])
+  items               PurchaseOrderItem[]
+
+  @@index([supplierId, status, deletedAt])
+  @@index([salesOrderId])
+}
+
+model PurchaseOrderItem {
+  id               String          @id @default(uuid()) @db.Uuid
+  purchaseOrderId  String          @db.Uuid
+  salesOrderItemId String?         @db.Uuid
+  description      String
+  quantity         Int
+  receivedQuantity Int             @default(0)
+  unitCost         Decimal         @db.Decimal(19, 4)
+  lineTotal        Decimal         @db.Decimal(19, 4)
+  purchaseOrder    PurchaseOrder   @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
+  salesOrderItem   SalesOrderItem? @relation(fields: [salesOrderItemId], references: [id])
+  inventoryItems   InventoryItem[]
+
+  @@index([purchaseOrderId])
+  @@index([salesOrderItemId])
+}
+
+model Warehouse {
+  id        String              @id @default(uuid()) @db.Uuid
+  code      String              @unique
+  name      String
+  address   Json?
+  status    RecordStatus        @default(ACTIVE)
+  createdAt DateTime            @default(now())
+  updatedAt DateTime            @updatedAt
+  deletedAt DateTime?
+  locations WarehouseLocation[]
+}
+
+model WarehouseLocation {
+  id               String                 @id @default(uuid()) @db.Uuid
+  warehouseId      String                 @db.Uuid
+  code             String
+  name             String
+  createdAt        DateTime               @default(now())
+  updatedAt        DateTime               @updatedAt
+  warehouse        Warehouse              @relation(fields: [warehouseId], references: [id])
+  inventoryItems   InventoryItem[]
+  transactionsFrom InventoryTransaction[] @relation("TransactionFromLocation")
+  transactionsTo   InventoryTransaction[] @relation("TransactionToLocation")
+
+  @@unique([warehouseId, code])
+}
+
+model InventoryItem {
+  id                  String                 @id @default(uuid()) @db.Uuid
+  productId           String                 @db.Uuid
+  locationId          String                 @db.Uuid
+  purchaseOrderItemId String?                @db.Uuid
+  quantityOnHand      Int                    @default(0)
+  quantityReserved    Int                    @default(0)
+  unitCostUsd         Decimal?               @db.Decimal(19, 4)
+  version             Int                    @default(1)
+  createdAt           DateTime               @default(now())
+  updatedAt           DateTime               @updatedAt
+  deletedAt           DateTime?
+  product             Product                @relation(fields: [productId], references: [id])
+  location            WarehouseLocation      @relation(fields: [locationId], references: [id])
+  purchaseOrderItem   PurchaseOrderItem?     @relation(fields: [purchaseOrderItemId], references: [id])
+  serials             InventorySerial[]
+  transactions        InventoryTransaction[]
+  inspections         QualityInspection[]
+
+  @@unique([productId, locationId, purchaseOrderItemId])
+  @@index([locationId, deletedAt])
+}
+
+model InventorySerial {
+  id              String        @id @default(uuid()) @db.Uuid
+  inventoryItemId String        @db.Uuid
+  serialNumber    String        @unique
+  status          String        @default("AVAILABLE")
+  receivedAt      DateTime?
+  issuedAt        DateTime?
+  createdAt       DateTime      @default(now())
+  updatedAt       DateTime      @updatedAt
+  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
+
+  @@index([inventoryItemId, status])
+}
+
+model InventoryTransaction {
+  id              String                   @id @default(uuid()) @db.Uuid
+  inventoryItemId String                   @db.Uuid
+  type            InventoryTransactionType
+  quantity        Int
+  fromLocationId  String?                  @db.Uuid
+  toLocationId    String?                  @db.Uuid
+  referenceType   String?
+  referenceId     String?
+  notes           String?
+  occurredAt      DateTime                 @default(now())
+  createdById     String                   @db.Uuid
+  inventoryItem   InventoryItem            @relation(fields: [inventoryItemId], references: [id])
+  fromLocation    WarehouseLocation?       @relation("TransactionFromLocation", fields: [fromLocationId], references: [id])
+  toLocation      WarehouseLocation?       @relation("TransactionToLocation", fields: [toLocationId], references: [id])
+
+  @@index([inventoryItemId, occurredAt])
+  @@index([referenceType, referenceId])
+}
+
+model QualityInspection {
+  id              String           @id @default(uuid()) @db.Uuid
+  inventoryItemId String           @db.Uuid
+  inspectorId     String           @db.Uuid
+  status          InspectionStatus @default(PENDING)
+  checklist       Json?
+  notes           String?
+  inspectedAt     DateTime?
+  version         Int              @default(1)
+  createdAt       DateTime         @default(now())
+  updatedAt       DateTime         @updatedAt
+  inventoryItem   InventoryItem    @relation(fields: [inventoryItemId], references: [id])
+  inspector       User             @relation("InspectionInspector", fields: [inspectorId], references: [id])
+
+  @@index([inventoryItemId, status])
+}
+
+model Shipment {
+  id             String         @id @default(uuid()) @db.Uuid
+  shipmentNumber String         @unique
+  salesOrderId   String         @db.Uuid
+  coordinatorId  String         @db.Uuid
+  status         ShipmentStatus @default(DRAFT)
+  carrier        String?
+  trackingNumber String?
+  incoterm       String?
+  origin         String?
+  destination    String?
+  shippedAt      DateTime?
+  deliveredAt    DateTime?
+  version        Int            @default(1)
+  createdAt      DateTime       @default(now())
+  updatedAt      DateTime       @updatedAt
+  deletedAt      DateTime?
+  salesOrder     SalesOrder     @relation(fields: [salesOrderId], references: [id])
+  coordinator    User           @relation("ShipmentCoordinator", fields: [coordinatorId], references: [id])
+  items          ShipmentItem[]
+
+  @@index([salesOrderId, status, deletedAt])
+  @@index([trackingNumber])
+}
+
+model ShipmentItem {
+  id               String         @id @default(uuid()) @db.Uuid
+  shipmentId       String         @db.Uuid
+  salesOrderItemId String         @db.Uuid
+  quantity         Int
+  shipment         Shipment       @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
+  salesOrderItem   SalesOrderItem @relation(fields: [salesOrderItemId], references: [id])
+
+  @@unique([shipmentId, salesOrderItemId])
+}
+
+model AfterSalesTicket {
+  id           String      @id @default(uuid()) @db.Uuid
+  ticketNumber String      @unique
+  customerId   String      @db.Uuid
+  salesOrderId String?     @db.Uuid
+  assignedToId String?     @db.Uuid
+  subject      String
+  description  String
+  priority     String      @default("NORMAL")
+  status       String      @default("OPEN")
+  resolution   String?
+  version      Int         @default(1)
+  createdAt    DateTime    @default(now())
+  updatedAt    DateTime    @updatedAt
+  closedAt     DateTime?
+  deletedAt    DateTime?
+  customer     Customer    @relation(fields: [customerId], references: [id])
+  salesOrder   SalesOrder? @relation(fields: [salesOrderId], references: [id])
+  assignedTo   User?       @relation("TicketAssignee", fields: [assignedToId], references: [id])
+
+  @@index([assignedToId, status, deletedAt])
+  @@index([customerId])
+}
+
+model Task {
+  id          String     @id @default(uuid()) @db.Uuid
+  title       String
+  description String?
+  status      TaskStatus @default(OPEN)
+  priority    String     @default("NORMAL")
+  dueAt       DateTime?
+  assigneeId  String     @db.Uuid
+  creatorId   String     @db.Uuid
+  entityType  String?
+  entityId    String?
+  version     Int        @default(1)
+  createdAt   DateTime   @default(now())
+  updatedAt   DateTime   @updatedAt
+  completedAt DateTime?
+  deletedAt   DateTime?
+  assignee    User       @relation("TaskAssignee", fields: [assigneeId], references: [id])
+  creator     User       @relation("TaskCreator", fields: [creatorId], references: [id])
+
+  @@index([assigneeId, status, dueAt, deletedAt])
+  @@index([entityType, entityId])
+}
+
+model Notification {
+  id        String    @id @default(uuid()) @db.Uuid
+  userId    String    @db.Uuid
+  type      String
+  title     String
+  message   String
+  link      String?
+  readAt    DateTime?
+  createdAt DateTime  @default(now())
+  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
+
+  @@index([userId, readAt, createdAt])
+}
+
+model FileAsset {
+  id          String    @id @default(uuid()) @db.Uuid
+  bucket      String
+  objectKey   String    @unique
+  fileName    String
+  contentType String
+  sizeBytes   BigInt
+  checksum    String?
+  entityType  String?
+  entityId    String?
+  uploaderId  String    @db.Uuid
+  createdAt   DateTime  @default(now())
+  deletedAt   DateTime?
+  uploader    User      @relation("FileUploader", fields: [uploaderId], references: [id])
+
+  @@index([entityType, entityId, deletedAt])
+}
+
+model Currency {
+  code      String         @id @db.Char(3)
+  name      String
+  symbol    String
+  decimals  Int            @default(2)
+  isActive  Boolean        @default(true)
+  isBase    Boolean        @default(false)
+  createdAt DateTime       @default(now())
+  updatedAt DateTime       @updatedAt
+  rates     ExchangeRate[]
+}
+
+model ExchangeRate {
+  id           String   @id @default(uuid()) @db.Uuid
+  currencyCode String   @db.Char(3)
+  rateToUsd    Decimal  @db.Decimal(24, 12)
+  effectiveAt  DateTime
+  source       String   @default("MANUAL")
+  createdById  String?  @db.Uuid
+  createdAt    DateTime @default(now())
+  currency     Currency @relation(fields: [currencyCode], references: [code])
+
+  @@unique([currencyCode, effectiveAt])
+  @@index([effectiveAt])
+}
+
+model Setting {
+  id        String   @id @default(uuid()) @db.Uuid
+  namespace String
+  key       String
+  value     Json
+  isSecret  Boolean  @default(false)
+  version   Int      @default(1)
+  createdAt DateTime @default(now())
+  updatedAt DateTime @updatedAt
+
+  @@unique([namespace, key])
+}
+
+model Sequence {
+  id        String   @id @default(uuid()) @db.Uuid
+  key       String   @unique
+  prefix    String
+  nextValue BigInt   @default(1)
+  padding   Int      @default(6)
+  version   Int      @default(1)
+  updatedAt DateTime @updatedAt
+}
diff --git a/prisma/seed.ts b/prisma/seed.ts
new file mode 100644
index 0000000..2ba0b86
--- /dev/null
+++ b/prisma/seed.ts
@@ -0,0 +1,295 @@
+import { PrismaPg } from "@prisma/adapter-pg";
+
+import { PrismaClient } from "../src/generated/prisma/client";
+import { hashPassword } from "../src/lib/password";
+
+const connectionString = process.env.DATABASE_URL;
+if (!connectionString) throw new Error("DATABASE_URL is required");
+
+const prisma = new PrismaClient({
+  adapter: new PrismaPg({ connectionString }),
+});
+
+const DEVELOPMENT_PASSWORD = "ChangeMe123!";
+
+const permissions = [
+  "dashboard.read",
+  "user.read",
+  "user.create",
+  "user.update",
+  "role.read",
+  "role.create",
+  "role.update",
+  "customer.read",
+  "customer.create",
+  "customer.update",
+  "customer.delete",
+  "lead.read",
+  "lead.create",
+  "lead.update",
+  "opportunity.read",
+  "opportunity.create",
+  "opportunity.update",
+  "product.read",
+  "product.create",
+  "product.update",
+  "quote.read",
+  "quote.create",
+  "quote.update",
+  "quote.approve",
+  "order.read",
+  "order.create",
+  "order.update",
+  "payment.read",
+  "payment.create",
+  "refund.create",
+  "finance.profit.read",
+  "supplier.read",
+  "supplier.create",
+  "supplier.update",
+  "purchase.read",
+  "purchase.create",
+  "purchase.update",
+  "purchase.cost.read",
+  "inventory.read",
+  "inventory.update",
+  "quality.read",
+  "quality.update",
+  "shipment.read",
+  "shipment.update",
+  "after_sales.read",
+  "after_sales.update",
+  "task.read",
+  "task.update",
+  "report.read",
+  "settings.read",
+  "settings.update",
+  "audit.read",
+] as const;
+
+const roleDefinitions = [
+  {
+    code: "SUPER_ADMIN",
+    name: "Super Admin",
+    description: "Complete system access",
+    permissions: ["*"],
+  },
+  {
+    code: "SALES_MANAGER",
+    name: "Sales Manager",
+    description: "Sales team and commercial workflow management",
+    permissions: permissions.filter(
+      (code) =>
+        /^(dashboard|customer|lead|opportunity|product|quote|order|task|report)\./.test(
+          code,
+        ) && code !== "finance.profit.read",
+    ),
+  },
+  {
+    code: "SALES_REP",
+    name: "Sales Representative",
+    description: "Owned sales accounts and transactions",
+    permissions: permissions.filter(
+      (code) =>
+        /^(dashboard|customer|lead|opportunity|product|quote|order|task)\./.test(
+          code,
+        ) && !code.endsWith(".delete"),
+    ),
+  },
+  {
+    code: "FINANCE",
+    name: "Finance",
+    description: "Payments, refunds, costs and financial reporting",
+    permissions: permissions.filter(
+      (code) =>
+        code === "order.read" ||
+        ["dashboard.", "payment.", "refund.", "finance.", "purchase.cost.", "report."].some(
+          (prefix) => code.startsWith(prefix),
+        ),
+    ),
+  },
+  {
+    code: "PROCUREMENT",
+    name: "Procurement",
+    description: "Suppliers and purchasing",
+    permissions: permissions.filter(
+      (code) =>
+        ["product.read", "order.read", "inventory.read"].includes(code) ||
+        ["dashboard.", "supplier.", "purchase.", "task."].some((prefix) =>
+          code.startsWith(prefix),
+        ),
+    ),
+  },
+  {
+    code: "OPERATIONS",
+    name: "Operations",
+    description: "Warehouse, quality, shipments and after-sales",
+    permissions: permissions.filter(
+      (code) =>
+        ["product.read", "order.read"].includes(code) ||
+        [
+          "dashboard.",
+          "inventory.",
+          "quality.",
+          "shipment.",
+          "after_sales.",
+          "task.",
+        ].some((prefix) => code.startsWith(prefix)),
+    ),
+  },
+] as const;
+
+const users = [
+  ["admin@atlascrm.dev", "Ada Admin", "SUPER_ADMIN"],
+  ["sales.manager@atlascrm.dev", "Marcus Chen", "SALES_MANAGER"],
+  ["sales.asia@atlascrm.dev", "Lina Wu", "SALES_REP"],
+  ["sales.emea@atlascrm.dev", "Oliver Grant", "SALES_REP"],
+  ["finance@atlascrm.dev", "Sofia Patel", "FINANCE"],
+  ["procurement@atlascrm.dev", "Noah Zhang", "PROCUREMENT"],
+  ["warehouse@atlascrm.dev", "Mia Liu", "OPERATIONS"],
+  ["logistics@atlascrm.dev", "Ethan Brooks", "OPERATIONS"],
+  ["support@atlascrm.dev", "Grace Kim", "OPERATIONS"],
+] as const;
+
+function deterministicId(group: number, index: number) {
+  return `00000000-0000-4000-8${group.toString(16).padStart(3, "0")}-${index
+    .toString(16)
+    .padStart(12, "0")}`;
+}
+
+async function main() {
+  const passwordHash = await hashPassword(DEVELOPMENT_PASSWORD);
+
+  for (const [index, code] of permissions.entries()) {
+    await prisma.permission.upsert({
+      where: { code },
+      update: { name: code },
+      create: {
+        id: deterministicId(1, index + 1),
+        code,
+        name: code,
+      },
+    });
+  }
+
+  await prisma.permission.upsert({
+    where: { code: "*" },
+    update: { name: "All permissions" },
+    create: {
+      id: deterministicId(1, 999),
+      code: "*",
+      name: "All permissions",
+    },
+  });
+
+  const permissionRows = await prisma.permission.findMany();
+  const permissionIds = new Map(
+    permissionRows.map((permission) => [permission.code, permission.id]),
+  );
+
+  for (const [index, definition] of roleDefinitions.entries()) {
+    const role = await prisma.role.upsert({
+      where: { code: definition.code },
+      update: {
+        name: definition.name,
+        description: definition.description,
+        isSystem: true,
+        deletedAt: null,
+      },
+      create: {
+        id: deterministicId(2, index + 1),
+        code: definition.code,
+        name: definition.name,
+        description: definition.description,
+        isSystem: true,
+      },
+    });
+    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
+    await prisma.rolePermission.createMany({
+      data: definition.permissions.map((code) => ({
+        roleId: role.id,
+        permissionId: permissionIds.get(code)!,
+      })),
+    });
+  }
+
+  const roleRows = await prisma.role.findMany();
+  const roleIds = new Map(roleRows.map((role) => [role.code, role.id]));
+
+  for (const [index, [email, name, roleCode]] of users.entries()) {
+    const user = await prisma.user.upsert({
+      where: { email },
+      update: {
+        name,
+        passwordHash,
+        status: "ACTIVE",
+        deletedAt: null,
+      },
+      create: {
+        id: deterministicId(3, index + 1),
+        email,
+        name,
+        passwordHash,
+        status: "ACTIVE",
+      },
+    });
+    await prisma.userRole.deleteMany({ where: { userId: user.id } });
+    await prisma.userRole.create({
+      data: { userId: user.id, roleId: roleIds.get(roleCode)! },
+    });
+  }
+
+  for (const [code, name, symbol, isBase] of [
+    ["USD", "US Dollar", "$", true],
+    ["CNY", "Chinese Yuan", "¥", false],
+    ["EUR", "Euro", "€", false],
+    ["GBP", "British Pound", "£", false],
+  ] as const) {
+    await prisma.currency.upsert({
+      where: { code },
+      update: { name, symbol, isBase, isActive: true },
+      create: { code, name, symbol, isBase },
+    });
+  }
+
+  await prisma.setting.upsert({
+    where: { namespace_key: { namespace: "company", key: "profile" } },
+    update: {},
+    create: {
+      id: deterministicId(4, 1),
+      namespace: "company",
+      key: "profile",
+      value: {
+        name: "Atlas Global Systems",
+        defaultLocale: "en",
+        baseCurrency: "USD",
+      },
+    },
+  });
+
+  for (const [index, key] of [
+    "quote",
+    "sales_order",
+    "purchase_order",
+    "shipment",
+    "ticket",
+  ].entries()) {
+    await prisma.sequence.upsert({
+      where: { key },
+      update: {},
+      create: {
+        id: deterministicId(5, index + 1),
+        key,
+        prefix: key.toUpperCase().replaceAll("_", "-"),
+      },
+    });
+  }
+}
+
+main()
+  .then(async () => prisma.$disconnect())
+  .catch(async (error) => {
+    console.error(error);
+    await prisma.$disconnect();
+    process.exit(1);
+  });
diff --git a/public/file.svg b/public/file.svg
new file mode 100644
index 0000000..004145c
--- /dev/null
+++ b/public/file.svg
@@ -0,0 +1 @@
+<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clip-rule="evenodd" fill="#666" fill-rule="evenodd"/></svg>
\ No newline at end of file
diff --git a/public/globe.svg b/public/globe.svg
new file mode 100644
index 0000000..567f17b
--- /dev/null
+++ b/public/globe.svg
@@ -0,0 +1 @@
+<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g clip-path="url(#a)"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs></svg>
\ No newline at end of file
diff --git a/public/next.svg b/public/next.svg
new file mode 100644
index 0000000..5174b28
--- /dev/null
+++ b/public/next.svg
@@ -0,0 +1 @@
+<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 394 80"><path fill="#000" d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z"/><path fill="#000" d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Zm252.6-.4c-1 0-1.8-.4-2.5-1s-1.1-1.6-1.1-2.6.3-1.8 1-2.5 1.6-1 2.6-1 1.8.3 2.5 1a3.4 3.4 0 0 1 .6 4.3 3.7 3.7 0 0 1-3 1.8zm23.2-33.5h6v23.3c0 2.1-.4 4-1.3 5.5a9.1 9.1 0 0 1-3.8 3.5c-1.6.8-3.5 1.3-5.7 1.3-2 0-3.7-.4-5.3-1s-2.8-1.8-3.7-3.2c-.9-1.3-1.4-3-1.4-5h6c.1.8.3 1.6.7 2.2s1 1.2 1.6 1.5c.7.4 1.5.5 2.4.5 1 0 1.8-.2 2.4-.6a4 4 0 0 0 1.6-1.8c.3-.8.5-1.8.5-3V45.5zm30.9 9.1a4.4 4.4 0 0 0-2-3.3 7.5 7.5 0 0 0-4.3-1.1c-1.3 0-2.4.2-3.3.5-.9.4-1.6 1-2 1.6a3.5 3.5 0 0 0-.3 4c.3.5.7.9 1.3 1.2l1.8 1 2 .5 3.2.8c1.3.3 2.5.7 3.7 1.2a13 13 0 0 1 3.2 1.8 8.1 8.1 0 0 1 3 6.5c0 2-.5 3.7-1.5 5.1a10 10 0 0 1-4.4 3.5c-1.8.8-4.1 1.2-6.8 1.2-2.6 0-4.9-.4-6.8-1.2-2-.8-3.4-2-4.5-3.5a10 10 0 0 1-1.7-5.6h6a5 5 0 0 0 3.5 4.6c1 .4 2.2.6 3.4.6 1.3 0 2.5-.2 3.5-.6 1-.4 1.8-1 2.4-1.7a4 4 0 0 0 .8-2.4c0-.9-.2-1.6-.7-2.2a11 11 0 0 0-2.1-1.4l-3.2-1-3.8-1c-2.8-.7-5-1.7-6.6-3.2a7.2 7.2 0 0 1-2.4-5.7 8 8 0 0 1 1.7-5 10 10 0 0 1 4.3-3.5c2-.8 4-1.2 6.4-1.2 2.3 0 4.4.4 6.2 1.2 1.8.8 3.2 2 4.3 3.4 1 1.4 1.5 3 1.5 5h-5.8z"/></svg>
\ No newline at end of file
diff --git a/public/vercel.svg b/public/vercel.svg
new file mode 100644
index 0000000..7705396
--- /dev/null
+++ b/public/vercel.svg
@@ -0,0 +1 @@
+<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1155 1000"><path d="m577.3 0 577.4 1000H0z" fill="#fff"/></svg>
\ No newline at end of file
diff --git a/public/window.svg b/public/window.svg
new file mode 100644
index 0000000..b2b2a44
--- /dev/null
+++ b/public/window.svg
@@ -0,0 +1 @@
+<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5" fill="#666"/></svg>
\ No newline at end of file
diff --git a/src/app/[locale]/(app)/dashboard/page.tsx b/src/app/[locale]/(app)/dashboard/page.tsx
new file mode 100644
index 0000000..8f42de9
--- /dev/null
+++ b/src/app/[locale]/(app)/dashboard/page.tsx
@@ -0,0 +1,80 @@
+import { notFound } from "next/navigation";
+
+import { auth } from "@/auth";
+import { EmptyState } from "@/components/empty-state";
+import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { loadDashboard } from "@/modules/dashboard/dashboard-service";
+import { PrismaDashboardRepository } from "@/modules/dashboard/prisma-dashboard-repository";
+
+export const dynamic = "force-dynamic";
+
+export default async function DashboardPage({
+  params,
+}: {
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const session = await auth();
+  const dictionary = getDictionary(locale);
+  const snapshot = await loadDashboard(
+    new PrismaDashboardRepository(),
+    session!.user.id,
+  );
+  const metrics = [
+    [dictionary.dashboard.customers, snapshot.activeCustomers],
+    [dictionary.dashboard.quotes, snapshot.openQuotes],
+    [dictionary.dashboard.orders, snapshot.activeOrders],
+    [dictionary.dashboard.tasks, snapshot.dueTasks],
+  ] as const;
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>
+            {dictionary.dashboard.title}
+            {session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
+          </h1>
+          <p>{dictionary.dashboard.subtitle}</p>
+        </div>
+      </header>
+      <section className="metrics" aria-label="Business metrics">
+        {metrics.map(([label, value]) => (
+          <article className="card metric" key={label}>
+            <div className="metric-label">{label}</div>
+            <div className="metric-value">{value.toLocaleString(locale)}</div>
+          </article>
+        ))}
+      </section>
+      <section className="card section-card">
+        <h2 className="section-title">{dictionary.dashboard.recent}</h2>
+        {snapshot.recentCustomers.length ? (
+          <div className="table-wrap">
+            <table>
+              <thead>
+                <tr>
+                  <th>Company</th>
+                  <th>Country</th>
+                  <th>Added</th>
+                </tr>
+              </thead>
+              <tbody>
+                {snapshot.recentCustomers.map((customer) => (
+                  <tr key={customer.id}>
+                    <td>{customer.companyName}</td>
+                    <td>{customer.countryCode}</td>
+                    <td>{customer.createdAt.toLocaleDateString(locale)}</td>
+                  </tr>
+                ))}
+              </tbody>
+            </table>
+          </div>
+        ) : (
+          <EmptyState title={dictionary.dashboard.empty} />
+        )}
+      </section>
+      <section id="notifications" aria-label="Notifications" />
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/error.tsx b/src/app/[locale]/(app)/error.tsx
new file mode 100644
index 0000000..d072b3a
--- /dev/null
+++ b/src/app/[locale]/(app)/error.tsx
@@ -0,0 +1,20 @@
+"use client";
+
+export default function ErrorPage({
+  reset,
+}: {
+  error: Error & { digest?: string };
+  reset: () => void;
+}) {
+  return (
+    <div className="card empty-state" role="alert">
+      <div>
+        <h2>We could not load this view</h2>
+        <p className="muted">Please try again. If it continues, contact your administrator.</p>
+        <button className="button" type="button" onClick={reset}>
+          Try again
+        </button>
+      </div>
+    </div>
+  );
+}
diff --git a/src/app/[locale]/(app)/layout.tsx b/src/app/[locale]/(app)/layout.tsx
new file mode 100644
index 0000000..1ff1d40
--- /dev/null
+++ b/src/app/[locale]/(app)/layout.tsx
@@ -0,0 +1,24 @@
+import { redirect, notFound } from "next/navigation";
+
+import { auth } from "@/auth";
+import { AppShell } from "@/components/app-shell";
+import { isLocale } from "@/i18n/dictionaries";
+
+export default async function ProtectedLayout({
+  children,
+  params,
+}: {
+  children: React.ReactNode;
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const session = await auth();
+  if (!session?.user) redirect(`/${locale}/login`);
+
+  return (
+    <AppShell locale={locale} user={session.user}>
+      {children}
+    </AppShell>
+  );
+}
diff --git a/src/app/[locale]/(app)/loading.tsx b/src/app/[locale]/(app)/loading.tsx
new file mode 100644
index 0000000..fa58857
--- /dev/null
+++ b/src/app/[locale]/(app)/loading.tsx
@@ -0,0 +1,10 @@
+export default function Loading() {
+  return (
+    <div className="card empty-state" role="status" aria-live="polite">
+      <div>
+        <div style={{ fontSize: 28 }}>◌</div>
+        <p className="muted">Loading workspace…</p>
+      </div>
+    </div>
+  );
+}
diff --git a/src/app/[locale]/(app)/roles/page.tsx b/src/app/[locale]/(app)/roles/page.tsx
new file mode 100644
index 0000000..630443c
--- /dev/null
+++ b/src/app/[locale]/(app)/roles/page.tsx
@@ -0,0 +1,64 @@
+import { auth } from "@/auth";
+import { EmptyState } from "@/components/empty-state";
+import { getPrisma } from "@/lib/prisma";
+import { can } from "@/lib/rbac";
+
+export const dynamic = "force-dynamic";
+
+export default async function RolesPage() {
+  const session = await auth();
+  if (
+    !can(
+      {
+        userId: session!.user.id,
+        permissions: session!.user.permissions,
+      },
+      "role.read",
+    )
+  ) {
+    return <EmptyState title="You do not have access to role management." />;
+  }
+  const roles = await getPrisma().role.findMany({
+    where: { deletedAt: null },
+    include: { _count: { select: { users: true, permissions: true } } },
+    orderBy: { name: "asc" },
+  });
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>Roles</h1>
+          <p>System responsibilities and permission coverage.</p>
+        </div>
+      </header>
+      <section className="card section-card">
+        <div className="table-wrap">
+          <table>
+            <thead>
+              <tr>
+                <th>Role</th>
+                <th>Code</th>
+                <th>Users</th>
+                <th>Permissions</th>
+              </tr>
+            </thead>
+            <tbody>
+              {roles.map((role) => (
+                <tr key={role.id}>
+                  <td>
+                    <strong>{role.name}</strong>
+                    <div className="muted">{role.description}</div>
+                  </td>
+                  <td>{role.code}</td>
+                  <td>{role._count.users}</td>
+                  <td>{role._count.permissions}</td>
+                </tr>
+              ))}
+            </tbody>
+          </table>
+        </div>
+      </section>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(app)/users/page.tsx b/src/app/[locale]/(app)/users/page.tsx
new file mode 100644
index 0000000..5e6f9e9
--- /dev/null
+++ b/src/app/[locale]/(app)/users/page.tsx
@@ -0,0 +1,74 @@
+import { auth } from "@/auth";
+import { EmptyState } from "@/components/empty-state";
+import { getPrisma } from "@/lib/prisma";
+import { can } from "@/lib/rbac";
+
+export const dynamic = "force-dynamic";
+
+export default async function UsersPage() {
+  const session = await auth();
+  if (
+    !can(
+      {
+        userId: session!.user.id,
+        permissions: session!.user.permissions,
+      },
+      "user.read",
+    )
+  ) {
+    return <EmptyState title="You do not have access to user management." />;
+  }
+
+  const users = await getPrisma().user.findMany({
+    where: { deletedAt: null },
+    select: {
+      id: true,
+      name: true,
+      email: true,
+      status: true,
+      roles: { select: { role: { select: { name: true } } } },
+    },
+    orderBy: { name: "asc" },
+  });
+
+  return (
+    <>
+      <header className="page-heading">
+        <div>
+          <h1>Users</h1>
+          <p>Accounts, access status and assigned roles.</p>
+        </div>
+      </header>
+      <section className="card section-card">
+        {users.length ? (
+          <div className="table-wrap">
+            <table>
+              <thead>
+                <tr>
+                  <th>Name</th>
+                  <th>Email</th>
+                  <th>Role</th>
+                  <th>Status</th>
+                </tr>
+              </thead>
+              <tbody>
+                {users.map((user) => (
+                  <tr key={user.id}>
+                    <td>{user.name}</td>
+                    <td>{user.email}</td>
+                    <td>{user.roles.map(({ role }) => role.name).join(", ")}</td>
+                    <td>
+                      <span className="badge">{user.status}</span>
+                    </td>
+                  </tr>
+                ))}
+              </tbody>
+            </table>
+          </div>
+        ) : (
+          <EmptyState title="No users found." />
+        )}
+      </section>
+    </>
+  );
+}
diff --git a/src/app/[locale]/(auth)/login/actions.ts b/src/app/[locale]/(auth)/login/actions.ts
new file mode 100644
index 0000000..f5f93c7
--- /dev/null
+++ b/src/app/[locale]/(auth)/login/actions.ts
@@ -0,0 +1,21 @@
+"use server";
+
+import { AuthError } from "next-auth";
+import { redirect } from "next/navigation";
+
+import { signIn } from "@/auth";
+
+export async function loginAction(locale: string, formData: FormData) {
+  try {
+    await signIn("credentials", {
+      email: formData.get("email"),
+      password: formData.get("password"),
+      redirectTo: `/${locale}/dashboard`,
+    });
+  } catch (error) {
+    if (error instanceof AuthError) {
+      redirect(`/${locale}/login?error=credentials`);
+    }
+    throw error;
+  }
+}
diff --git a/src/app/[locale]/(auth)/login/page.tsx b/src/app/[locale]/(auth)/login/page.tsx
new file mode 100644
index 0000000..9388de5
--- /dev/null
+++ b/src/app/[locale]/(auth)/login/page.tsx
@@ -0,0 +1,79 @@
+import type { Metadata } from "next";
+import Link from "next/link";
+import { notFound } from "next/navigation";
+
+import { getDictionary, isLocale } from "@/i18n/dictionaries";
+import { loginAction } from "./actions";
+
+export const metadata: Metadata = { title: "Sign in" };
+
+export default async function LoginPage({
+  params,
+  searchParams,
+}: {
+  params: Promise<{ locale: string }>;
+  searchParams: Promise<{ error?: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  const dictionary = getDictionary(locale);
+  const { error } = await searchParams;
+  const action = loginAction.bind(null, locale);
+
+  return (
+    <main className="login-page">
+      <section className="login-panel">
+        <form action={action} className="login-form">
+          <div className="brand" style={{ color: "var(--foreground)", padding: 0 }}>
+            <span className="brand-mark">A</span>
+            <span>{dictionary.appName}</span>
+          </div>
+          <h1>{dictionary.auth.title}</h1>
+          <p className="muted">{dictionary.auth.subtitle}</p>
+          {error ? (
+            <div className="alert-error" role="alert">
+              {dictionary.auth.error}
+            </div>
+          ) : null}
+          <div className="field">
+            <label htmlFor="email">{dictionary.auth.email}</label>
+            <input
+              className="focus-ring"
+              id="email"
+              name="email"
+              type="email"
+              autoComplete="email"
+              required
+            />
+          </div>
+          <div className="field">
+            <label htmlFor="password">{dictionary.auth.password}</label>
+            <input
+              className="focus-ring"
+              id="password"
+              name="password"
+              type="password"
+              autoComplete="current-password"
+              minLength={8}
+              required
+            />
+          </div>
+          <button className="button focus-ring" type="submit">
+            {dictionary.auth.signIn}
+          </button>
+          <p className="muted" style={{ marginTop: 22, fontSize: 13 }}>
+            <Link href={`/${locale === "en" ? "zh" : "en"}/login`}>
+              {locale === "en" ? "中文" : "English"}
+            </Link>
+          </p>
+        </form>
+      </section>
+      <section className="login-hero" aria-hidden="true">
+        <div className="login-hero-copy">
+          <h2>{dictionary.auth.heroTitle}</h2>
+          <p>{dictionary.auth.heroText}</p>
+        </div>
+      </section>
+    </main>
+  );
+}
diff --git a/src/app/[locale]/layout.tsx b/src/app/[locale]/layout.tsx
new file mode 100644
index 0000000..4a1cd37
--- /dev/null
+++ b/src/app/[locale]/layout.tsx
@@ -0,0 +1,19 @@
+import { notFound } from "next/navigation";
+
+import { isLocale } from "@/i18n/dictionaries";
+
+export function generateStaticParams() {
+  return [{ locale: "en" }, { locale: "zh" }];
+}
+
+export default async function LocaleLayout({
+  children,
+  params,
+}: {
+  children: React.ReactNode;
+  params: Promise<{ locale: string }>;
+}) {
+  const { locale } = await params;
+  if (!isLocale(locale)) notFound();
+  return children;
+}
diff --git a/src/app/api/auth/[...nextauth]/route.ts b/src/app/api/auth/[...nextauth]/route.ts
new file mode 100644
index 0000000..86c9f3d
--- /dev/null
+++ b/src/app/api/auth/[...nextauth]/route.ts
@@ -0,0 +1,3 @@
+import { handlers } from "@/auth";
+
+export const { GET, POST } = handlers;
diff --git a/src/app/api/health/route.ts b/src/app/api/health/route.ts
new file mode 100644
index 0000000..32a3f47
--- /dev/null
+++ b/src/app/api/health/route.ts
@@ -0,0 +1,19 @@
+import { getPrisma } from "@/lib/prisma";
+
+export const dynamic = "force-dynamic";
+
+export async function GET() {
+  try {
+    await getPrisma().$queryRaw`SELECT 1`;
+    return Response.json({
+      status: "ok",
+      service: "atlas-crm",
+      timestamp: new Date().toISOString(),
+    });
+  } catch {
+    return Response.json(
+      { status: "unavailable", service: "atlas-crm" },
+      { status: 503 },
+    );
+  }
+}
diff --git a/src/app/api/roles/route.ts b/src/app/api/roles/route.ts
new file mode 100644
index 0000000..ca02c7d
--- /dev/null
+++ b/src/app/api/roles/route.ts
@@ -0,0 +1,72 @@
+import { z } from "zod";
+
+import { writeAudit } from "@/lib/audit";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { getPrisma } from "@/lib/prisma";
+import { requirePermission } from "@/lib/rbac";
+
+const createRoleSchema = z.object({
+  code: z
+    .string()
+    .trim()
+    .min(2)
+    .max(40)
+    .regex(/^[A-Z][A-Z0-9_]+$/),
+  name: z.string().trim().min(2).max(100),
+  description: z.string().trim().max(300).optional(),
+  permissions: z.array(z.string().min(1)).min(1),
+});
+
+export async function GET() {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "role.read");
+    const roles = await getPrisma().role.findMany({
+      where: { deletedAt: null },
+      include: {
+        _count: { select: { users: true, permissions: true } },
+      },
+      orderBy: { name: "asc" },
+    });
+    return success(roles);
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "role.create");
+    const input = createRoleSchema.parse(await request.json());
+    const role = await getPrisma().$transaction(async (transaction) => {
+      const permissions = await transaction.permission.findMany({
+        where: { code: { in: input.permissions } },
+        select: { id: true },
+      });
+      const created = await transaction.role.create({
+        data: {
+          code: input.code,
+          name: input.name,
+          description: input.description,
+          permissions: {
+            create: permissions.map(({ id }) => ({ permissionId: id })),
+          },
+        },
+        select: { id: true, code: true, name: true, description: true },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "role.create",
+        entityType: "Role",
+        entityId: created.id,
+        after: created,
+      });
+      return created;
+    });
+    return success(role, 201);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/api/users/route.ts b/src/app/api/users/route.ts
new file mode 100644
index 0000000..75de770
--- /dev/null
+++ b/src/app/api/users/route.ts
@@ -0,0 +1,71 @@
+import { z } from "zod";
+
+import { getPrisma } from "@/lib/prisma";
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { hashPassword } from "@/lib/password";
+import { requirePermission } from "@/lib/rbac";
+import { writeAudit } from "@/lib/audit";
+
+const createUserSchema = z.object({
+  email: z.string().email().transform((value) => value.toLowerCase()),
+  name: z.string().trim().min(2).max(100),
+  password: z.string().min(12).max(128),
+  roleId: z.string().uuid(),
+  locale: z.enum(["en", "zh"]).default("en"),
+});
+
+export async function GET() {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "user.read");
+    const users = await getPrisma().user.findMany({
+      where: { deletedAt: null },
+      select: {
+        id: true,
+        email: true,
+        name: true,
+        status: true,
+        locale: true,
+        lastLoginAt: true,
+        roles: { select: { role: { select: { code: true, name: true } } } },
+      },
+      orderBy: { name: "asc" },
+    });
+    return success(users);
+  } catch (error) {
+    return failure(error);
+  }
+}
+
+export async function POST(request: Request) {
+  try {
+    const context = await currentAuthorizationContext();
+    requirePermission(context, "user.create");
+    const input = createUserSchema.parse(await request.json());
+    const passwordHash = await hashPassword(input.password);
+    const user = await getPrisma().$transaction(async (transaction) => {
+      const created = await transaction.user.create({
+        data: {
+          email: input.email,
+          name: input.name,
+          passwordHash,
+          locale: input.locale,
+          roles: { create: { roleId: input.roleId } },
+        },
+        select: { id: true, email: true, name: true, status: true },
+      });
+      await writeAudit(transaction, {
+        actorId: context.userId,
+        action: "user.create",
+        entityType: "User",
+        entityId: created.id,
+        after: created,
+      });
+      return created;
+    });
+    return success(user, 201);
+  } catch (error) {
+    return failure(error);
+  }
+}
diff --git a/src/app/favicon.ico b/src/app/favicon.ico
new file mode 100644
index 0000000..718d6fe
Binary files /dev/null and b/src/app/favicon.ico differ
diff --git a/src/app/globals.css b/src/app/globals.css
new file mode 100644
index 0000000..a0b063e
--- /dev/null
+++ b/src/app/globals.css
@@ -0,0 +1,489 @@
+@import "tailwindcss";
+
+:root {
+  --background: #f4f7fb;
+  --surface: #ffffff;
+  --foreground: #10203a;
+  --muted: #65748b;
+  --border: #e1e8f2;
+  --navy: #0b1730;
+  --navy-soft: #152645;
+  --accent: #246bfe;
+  --accent-soft: #e8f0ff;
+}
+
+.dark {
+  --background: #091120;
+  --surface: #101c30;
+  --foreground: #eef4ff;
+  --muted: #9aabc4;
+  --border: #263650;
+  --accent-soft: #172d5c;
+}
+
+* {
+  box-sizing: border-box;
+}
+
+body {
+  margin: 0;
+  background: var(--background);
+  color: var(--foreground);
+  font-family: Inter, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
+}
+
+button,
+input,
+select {
+  font: inherit;
+}
+
+a {
+  color: inherit;
+  text-decoration: none;
+}
+
+.focus-ring:focus-visible {
+  outline: 3px solid color-mix(in srgb, var(--accent), transparent 70%);
+  outline-offset: 2px;
+}
+
+.card {
+  border: 1px solid var(--border);
+  border-radius: 16px;
+  background: var(--surface);
+  box-shadow: 0 12px 32px rgb(18 38 67 / 5%);
+}
+
+.muted {
+  color: var(--muted);
+}
+
+.app-grid {
+  display: grid;
+  min-height: 100vh;
+  grid-template-columns: 248px minmax(0, 1fr);
+}
+
+.sidebar {
+  position: sticky;
+  top: 0;
+  height: 100vh;
+  padding: 22px 16px;
+  background: var(--navy);
+  color: #dbe7fb;
+}
+
+.brand {
+  display: flex;
+  align-items: center;
+  gap: 12px;
+  padding: 0 10px 24px;
+  color: white;
+  font-weight: 750;
+  letter-spacing: -0.02em;
+}
+
+.brand-mark {
+  display: grid;
+  width: 36px;
+  height: 36px;
+  place-items: center;
+  border-radius: 11px;
+  background: linear-gradient(145deg, #2c7aff, #6c9fff);
+}
+
+.nav-label {
+  padding: 12px 12px 7px;
+  color: #7486a4;
+  font-size: 11px;
+  font-weight: 700;
+  letter-spacing: 0.11em;
+  text-transform: uppercase;
+}
+
+.nav-link {
+  display: flex;
+  align-items: center;
+  gap: 11px;
+  margin: 3px 0;
+  padding: 10px 12px;
+  border-radius: 10px;
+  color: #b7c5da;
+  font-size: 14px;
+  transition: 160ms ease;
+}
+
+.nav-link:hover {
+  background: var(--navy-soft);
+  color: white;
+}
+
+.nav-link-active {
+  background: #1f5ed9;
+  color: white;
+}
+
+.app-main {
+  min-width: 0;
+}
+
+.topbar {
+  position: sticky;
+  z-index: 10;
+  top: 0;
+  display: flex;
+  height: 70px;
+  align-items: center;
+  gap: 14px;
+  padding: 0 28px;
+  border-bottom: 1px solid var(--border);
+  background: color-mix(in srgb, var(--surface), transparent 6%);
+  backdrop-filter: blur(14px);
+}
+
+.search {
+  display: flex;
+  max-width: 460px;
+  flex: 1;
+  align-items: center;
+  gap: 9px;
+  padding: 10px 13px;
+  border: 1px solid var(--border);
+  border-radius: 11px;
+  background: var(--background);
+  color: var(--muted);
+}
+
+.search input {
+  width: 100%;
+  border: 0;
+  outline: 0;
+  background: transparent;
+  color: var(--foreground);
+}
+
+.top-actions {
+  display: flex;
+  align-items: center;
+  gap: 8px;
+}
+
+.icon-button {
+  display: grid;
+  min-width: 38px;
+  height: 38px;
+  place-items: center;
+  border: 1px solid var(--border);
+  border-radius: 10px;
+  background: var(--surface);
+  color: var(--muted);
+  cursor: pointer;
+}
+
+.content {
+  padding: 30px;
+}
+
+.page-heading {
+  display: flex;
+  align-items: flex-end;
+  justify-content: space-between;
+  gap: 20px;
+  margin-bottom: 24px;
+}
+
+.page-heading h1 {
+  margin: 0 0 6px;
+  font-size: clamp(25px, 3vw, 34px);
+  letter-spacing: -0.035em;
+}
+
+.page-heading p {
+  margin: 0;
+  color: var(--muted);
+}
+
+.metrics {
+  display: grid;
+  grid-template-columns: repeat(4, minmax(0, 1fr));
+  gap: 16px;
+}
+
+.metric {
+  padding: 20px;
+}
+
+.metric-label {
+  color: var(--muted);
+  font-size: 13px;
+  font-weight: 600;
+}
+
+.metric-value {
+  margin-top: 13px;
+  font-size: 30px;
+  font-weight: 760;
+  letter-spacing: -0.04em;
+}
+
+.section-card {
+  margin-top: 20px;
+  padding: 22px;
+}
+
+.section-title {
+  margin: 0 0 16px;
+  font-size: 16px;
+}
+
+.table-wrap {
+  overflow-x: auto;
+}
+
+table {
+  width: 100%;
+  border-collapse: collapse;
+}
+
+th,
+td {
+  padding: 13px 12px;
+  border-bottom: 1px solid var(--border);
+  text-align: left;
+  font-size: 14px;
+}
+
+th {
+  color: var(--muted);
+  font-size: 12px;
+  font-weight: 700;
+  text-transform: uppercase;
+}
+
+.badge {
+  display: inline-flex;
+  padding: 4px 8px;
+  border-radius: 999px;
+  background: var(--accent-soft);
+  color: var(--accent);
+  font-size: 12px;
+  font-weight: 700;
+}
+
+.button {
+  display: inline-flex;
+  min-height: 42px;
+  align-items: center;
+  justify-content: center;
+  gap: 8px;
+  padding: 0 17px;
+  border: 0;
+  border-radius: 10px;
+  background: var(--accent);
+  color: white;
+  font-weight: 700;
+  cursor: pointer;
+}
+
+.empty-state {
+  display: grid;
+  min-height: 220px;
+  place-items: center;
+  padding: 28px;
+  text-align: center;
+}
+
+.login-page {
+  display: grid;
+  min-height: 100vh;
+  grid-template-columns: minmax(340px, 0.9fr) minmax(480px, 1.1fr);
+  background: var(--navy);
+}
+
+.login-panel {
+  display: flex;
+  flex-direction: column;
+  justify-content: center;
+  padding: clamp(34px, 7vw, 92px);
+  background: var(--surface);
+}
+
+.login-form {
+  width: 100%;
+  max-width: 430px;
+}
+
+.login-form h1 {
+  margin: 34px 0 8px;
+  font-size: 36px;
+  letter-spacing: -0.045em;
+}
+
+.field {
+  display: grid;
+  gap: 7px;
+  margin: 18px 0;
+}
+
+.field label {
+  font-size: 13px;
+  font-weight: 700;
+}
+
+.field input {
+  width: 100%;
+  height: 48px;
+  padding: 0 13px;
+  border: 1px solid var(--border);
+  border-radius: 10px;
+  background: var(--background);
+  color: var(--foreground);
+}
+
+.login-form .button {
+  width: 100%;
+  margin-top: 8px;
+}
+
+.login-hero {
+  position: relative;
+  display: flex;
+  overflow: hidden;
+  align-items: flex-end;
+  padding: clamp(38px, 7vw, 88px);
+  background:
+    radial-gradient(circle at 75% 20%, rgb(36 107 254 / 45%), transparent 35%),
+    linear-gradient(145deg, #0b1730, #102b58);
+  color: white;
+}
+
+.login-hero::after {
+  position: absolute;
+  inset: 0;
+  background-image:
+    linear-gradient(rgb(255 255 255 / 4%) 1px, transparent 1px),
+    linear-gradient(90deg, rgb(255 255 255 / 4%) 1px, transparent 1px);
+  background-size: 42px 42px;
+  content: "";
+}
+
+.login-hero-copy {
+  position: relative;
+  z-index: 1;
+  max-width: 620px;
+}
+
+.login-hero h2 {
+  margin: 0 0 18px;
+  font-size: clamp(36px, 5vw, 62px);
+  line-height: 1.02;
+  letter-spacing: -0.055em;
+}
+
+.login-hero p {
+  max-width: 520px;
+  color: #b9c9e2;
+  font-size: 18px;
+  line-height: 1.65;
+}
+
+.alert-error {
+  margin: 18px 0;
+  padding: 12px 14px;
+  border: 1px solid #ffc9c9;
+  border-radius: 10px;
+  background: #fff1f1;
+  color: #a62626;
+  font-size: 14px;
+}
+
+@media (max-width: 980px) {
+  .app-grid {
+    grid-template-columns: 76px minmax(0, 1fr);
+  }
+
+  .sidebar {
+    padding-inline: 10px;
+  }
+
+  .brand span,
+  .nav-label,
+  .nav-link span:last-child {
+    display: none;
+  }
+
+  .nav-link {
+    justify-content: center;
+  }
+
+  .metrics {
+    grid-template-columns: repeat(2, minmax(0, 1fr));
+  }
+
+  .login-page {
+    grid-template-columns: 1fr;
+  }
+
+  .login-hero {
+    display: none;
+  }
+}
+
+@media (max-width: 620px) {
+  .app-grid {
+    display: block;
+  }
+
+  .sidebar {
+    position: fixed;
+    z-index: 20;
+    top: auto;
+    right: 0;
+    bottom: 0;
+    left: 0;
+    display: flex;
+    width: auto;
+    height: 66px;
+    align-items: center;
+    padding: 8px 10px;
+  }
+
+  .brand,
+  .nav-label,
+  .nav-link:nth-of-type(n + 5) {
+    display: none;
+  }
+
+  .sidebar nav {
+    display: flex;
+    width: 100%;
+    justify-content: space-around;
+  }
+
+  .nav-link {
+    flex: 1;
+    margin: 0 2px;
+  }
+
+  .topbar {
+    padding: 0 15px;
+  }
+
+  .search {
+    max-width: none;
+  }
+
+  .profile-label,
+  .notification-link {
+    display: none;
+  }
+
+  .content {
+    padding: 22px 15px 90px;
+  }
+
+  .metrics {
+    grid-template-columns: 1fr;
+  }
+}
diff --git a/src/app/layout.tsx b/src/app/layout.tsx
new file mode 100644
index 0000000..059516c
--- /dev/null
+++ b/src/app/layout.tsx
@@ -0,0 +1,22 @@
+import type { Metadata } from "next";
+import "./globals.css";
+
+export const metadata: Metadata = {
+  title: {
+    default: "Atlas CRM",
+    template: "%s · Atlas CRM",
+  },
+  description: "Foreign-trade operations, from first contact to delivery.",
+};
+
+export default function RootLayout({
+  children,
+}: Readonly<{
+  children: React.ReactNode;
+}>) {
+  return (
+    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
+      <body className="min-h-full flex flex-col">{children}</body>
+    </html>
+  );
+}
diff --git a/src/app/page.tsx b/src/app/page.tsx
new file mode 100644
index 0000000..47d3db3
--- /dev/null
+++ b/src/app/page.tsx
@@ -0,0 +1,5 @@
+import { redirect } from "next/navigation";
+
+export default function Home() {
+  redirect("/en/dashboard");
+}
diff --git a/src/auth.ts b/src/auth.ts
new file mode 100644
index 0000000..8cf9b36
--- /dev/null
+++ b/src/auth.ts
@@ -0,0 +1,67 @@
+import NextAuth from "next-auth";
+import Credentials from "next-auth/providers/credentials";
+import { z } from "zod";
+
+import { authenticateCredentials } from "@/modules/auth/authenticate";
+import { createPrismaAuthRepository } from "@/modules/auth/prisma-auth-repository";
+
+const credentialsSchema = z.object({
+  email: z.string().email(),
+  password: z.string().min(8),
+});
+
+export const { handlers, auth, signIn, signOut } = NextAuth({
+  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
+  pages: { signIn: "/en/login" },
+  trustHost: true,
+  cookies: {
+    sessionToken: {
+      name:
+        process.env.NODE_ENV === "production"
+          ? "__Secure-atlascrm.session-token"
+          : "atlascrm.session-token",
+      options: {
+        httpOnly: true,
+        sameSite: "lax",
+        path: "/",
+        secure: process.env.NODE_ENV === "production",
+      },
+    },
+  },
+  providers: [
+    Credentials({
+      credentials: {
+        email: { label: "Email", type: "email" },
+        password: { label: "Password", type: "password" },
+      },
+      async authorize(rawCredentials, request) {
+        const parsed = credentialsSchema.safeParse(rawCredentials);
+        if (!parsed.success) return null;
+
+        return authenticateCredentials(createPrismaAuthRepository(), {
+          ...parsed.data,
+          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
+          userAgent: request.headers.get("user-agent") ?? undefined,
+        });
+      },
+    }),
+  ],
+  callbacks: {
+    authorized({ auth: session }) {
+      return Boolean(session?.user);
+    },
+    jwt({ token, user }) {
+      if (user) {
+        token.roles = user.roles;
+        token.permissions = user.permissions;
+      }
+      return token;
+    },
+    session({ session, token }) {
+      session.user.id = token.sub ?? "";
+      session.user.roles = (token.roles as string[]) ?? [];
+      session.user.permissions = (token.permissions as string[]) ?? [];
+      return session;
+    },
+  },
+});
diff --git a/src/components/app-shell.tsx b/src/components/app-shell.tsx
new file mode 100644
index 0000000..bfd70c5
--- /dev/null
+++ b/src/components/app-shell.tsx
@@ -0,0 +1,92 @@
+import Link from "next/link";
+
+import { signOut } from "@/auth";
+import type { Locale } from "@/i18n/dictionaries";
+import { getDictionary } from "@/i18n/dictionaries";
+import { ThemeToggle } from "@/components/theme-toggle";
+
+export function AppShell({
+  locale,
+  user,
+  children,
+}: {
+  locale: Locale;
+  user: { name?: string | null; email?: string | null };
+  children: React.ReactNode;
+}) {
+  const dictionary = getDictionary(locale);
+  const nav = [
+    ["dashboard", "⌂", dictionary.nav.dashboard],
+    ["users", "♙", dictionary.nav.users],
+    ["roles", "⌘", dictionary.nav.roles],
+  ] as const;
+
+  async function logout() {
+    "use server";
+    await signOut({ redirectTo: `/${locale}/login` });
+  }
+
+  return (
+    <div className="app-grid">
+      <aside className="sidebar">
+        <Link className="brand" href={`/${locale}/dashboard`}>
+          <span className="brand-mark">A</span>
+          <span>{dictionary.appName}</span>
+        </Link>
+        <nav aria-label="Primary navigation">
+          <div className="nav-label">{dictionary.nav.workspace}</div>
+          {nav.map(([path, icon, label]) => (
+            <Link
+              key={path}
+              className="nav-link"
+              href={`/${locale}/${path}`}
+            >
+              <span aria-hidden="true">{icon}</span>
+              <span>{label}</span>
+            </Link>
+          ))}
+        </nav>
+      </aside>
+      <div className="app-main">
+        <header className="topbar">
+          <label className="search">
+            <span aria-hidden="true">⌕</span>
+            <input
+              aria-label={dictionary.search}
+              placeholder={dictionary.search}
+              type="search"
+            />
+          </label>
+          <div className="top-actions">
+            <Link
+              className="icon-button notification-link"
+              href={`/${locale}/dashboard#notifications`}
+              aria-label="Notifications"
+            >
+              ♢
+            </Link>
+            <Link
+              className="icon-button"
+              href={`/${locale === "en" ? "zh" : "en"}/dashboard`}
+              aria-label="Switch language"
+            >
+              {locale === "en" ? "中" : "EN"}
+            </Link>
+            <ThemeToggle />
+            <form action={logout}>
+              <button
+                className="icon-button focus-ring"
+                title={user.email ?? undefined}
+                aria-label="Sign out"
+                type="submit"
+              >
+                {(user.name ?? "U").slice(0, 1).toUpperCase()}
+              </button>
+            </form>
+          </div>
+        </header>
+        <main className="content">{children}</main>
+      </div>
+    </div>
+  );
+}
diff --git a/src/components/empty-state.tsx b/src/components/empty-state.tsx
new file mode 100644
index 0000000..f86d3e2
--- /dev/null
+++ b/src/components/empty-state.tsx
@@ -0,0 +1,17 @@
+export function EmptyState({
+  title,
+  description,
+}: {
+  title: string;
+  description?: string;
+}) {
+  return (
+    <div className="empty-state">
+      <div>
+        <div style={{ fontSize: 32, marginBottom: 10 }}>◇</div>
+        <strong>{title}</strong>
+        {description ? <p className="muted">{description}</p> : null}
+      </div>
+    </div>
+  );
+}
diff --git a/src/components/theme-toggle.tsx b/src/components/theme-toggle.tsx
new file mode 100644
index 0000000..1e4e08f
--- /dev/null
+++ b/src/components/theme-toggle.tsx
@@ -0,0 +1,30 @@
+"use client";
+
+import { useEffect } from "react";
+
+export function ThemeToggle() {
+  useEffect(() => {
+    const enabled =
+      localStorage.getItem("atlas-theme") === "dark" ||
+      (!localStorage.getItem("atlas-theme") &&
+        matchMedia("(prefers-color-scheme: dark)").matches);
+    document.documentElement.classList.toggle("dark", enabled);
+  }, []);
+
+  function toggleTheme() {
+    const next = !document.documentElement.classList.contains("dark");
+    document.documentElement.classList.toggle("dark", next);
+    localStorage.setItem("atlas-theme", next ? "dark" : "light");
+  }
+
+  return (
+    <button
+      type="button"
+      className="icon-button focus-ring"
+      aria-label="Toggle color theme"
+      onClick={toggleTheme}
+    >
+      ◐
+    </button>
+  );
+}
diff --git a/src/i18n/dictionaries.ts b/src/i18n/dictionaries.ts
new file mode 100644
index 0000000..4a234b1
--- /dev/null
+++ b/src/i18n/dictionaries.ts
@@ -0,0 +1,82 @@
+export const locales = ["en", "zh"] as const;
+export type Locale = (typeof locales)[number];
+
+const dictionaries = {
+  en: {
+    appName: "Atlas CRM",
+    nav: {
+      workspace: "Workspace",
+      dashboard: "Dashboard",
+      customers: "Customers",
+      opportunities: "Opportunities",
+      quotes: "Quotes",
+      operations: "Operations",
+      users: "Users",
+      roles: "Roles",
+    },
+    search: "Search customers, orders, quotes…",
+    dashboard: {
+      title: "Good to see you",
+      subtitle: "Here is the current operating picture.",
+      customers: "Active customers",
+      quotes: "Open quotations",
+      orders: "Orders in progress",
+      tasks: "Tasks due",
+      recent: "Recently added customers",
+      empty: "No customers have been added yet.",
+    },
+    auth: {
+      title: "Welcome back",
+      subtitle: "Sign in to continue to your workspace.",
+      email: "Work email",
+      password: "Password",
+      signIn: "Sign in securely",
+      error: "Email or password is incorrect, or this account is inactive.",
+      heroTitle: "Trade operations, without the blind spots.",
+      heroText:
+        "Bring customer context, commercial decisions and fulfillment progress into one trusted workspace.",
+    },
+  },
+  zh: {
+    appName: "Atlas 外贸 CRM",
+    nav: {
+      workspace: "工作台",
+      dashboard: "仪表盘",
+      customers: "客户",
+      opportunities: "商机",
+      quotes: "报价",
+      operations: "运营",
+      users: "用户",
+      roles: "角色",
+    },
+    search: "搜索客户、订单、报价…",
+    dashboard: {
+      title: "欢迎回来",
+      subtitle: "这是当前业务运营概览。",
+      customers: "活跃客户",
+      quotes: "进行中报价",
+      orders: "履约中订单",
+      tasks: "待办任务",
+      recent: "最近新增客户",
+      empty: "暂时还没有客户数据。",
+    },
+    auth: {
+      title: "欢迎回来",
+      subtitle: "登录后进入您的工作台。",
+      email: "工作邮箱",
+      password: "密码",
+      signIn: "安全登录",
+      error: "邮箱或密码错误，或该账户已停用。",
+      heroTitle: "让每一个外贸环节清晰可见。",
+      heroText: "在一个可信工作台中连接客户信息、商务决策与履约进度。",
+    },
+  },
+} as const;
+
+export function isLocale(value: string): value is Locale {
+  return locales.includes(value as Locale);
+}
+
+export function getDictionary(locale: Locale) {
+  return dictionaries[locale];
+}
diff --git a/src/lib/api.test.ts b/src/lib/api.test.ts
new file mode 100644
index 0000000..ef350cf
--- /dev/null
+++ b/src/lib/api.test.ts
@@ -0,0 +1,60 @@
+import { describe, expect, it } from "vitest";
+import { z } from "zod";
+
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+
+describe("API helpers", () => {
+  it("creates a typed success response", async () => {
+    const response = success({ id: "customer-1" }, 201);
+    expect(response.status).toBe(201);
+    expect(await response.json()).toEqual({
+      success: true,
+      data: { id: "customer-1" },
+    });
+  });
+
+  it("maps domain errors to safe failure responses", async () => {
+    const response = failure(
+      new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404),
+    );
+    expect(response.status).toBe(404);
+    expect(await response.json()).toEqual({
+      success: false,
+      error: {
+        code: "CUSTOMER_NOT_FOUND",
+        message: "Customer not found",
+      },
+    });
+  });
+
+  it("does not expose unexpected error details", async () => {
+    const response = failure(new Error("database credentials leaked"));
+    expect(response.status).toBe(500);
+    expect(await response.json()).toEqual({
+      success: false,
+      error: {
+        code: "INTERNAL_ERROR",
+        message: "An unexpected error occurred",
+      },
+    });
+  });
+
+  it("maps invalid request data to a safe validation failure", async () => {
+    const parsed = z.object({ email: z.string().email() }).safeParse({
+      email: "not-an-email",
+    });
+    if (parsed.success) throw new Error("Test input must be invalid");
+
+    const response = failure(parsed.error);
+
+    expect(response.status).toBe(400);
+    expect(await response.json()).toMatchObject({
+      success: false,
+      error: {
+        code: "VALIDATION_ERROR",
+        message: "Request validation failed",
+      },
+    });
+  });
+});
diff --git a/src/lib/audit.ts b/src/lib/audit.ts
new file mode 100644
index 0000000..3cad636
--- /dev/null
+++ b/src/lib/audit.ts
@@ -0,0 +1,22 @@
+import type { Prisma } from "@/generated/prisma/client";
+
+export interface AuditInput {
+  actorId?: string;
+  action: string;
+  entityType: string;
+  entityId?: string;
+  before?: Prisma.InputJsonValue;
+  after?: Prisma.InputJsonValue;
+  metadata?: Prisma.InputJsonValue;
+  ipAddress?: string;
+}
+
+export interface AuditWriter {
+  auditLog: {
+    create(args: { data: AuditInput }): Promise<unknown>;
+  };
+}
+
+export function writeAudit(writer: AuditWriter, input: AuditInput) {
+  return writer.auditLog.create({ data: input });
+}
diff --git a/src/lib/contracts.ts b/src/lib/contracts.ts
new file mode 100644
index 0000000..8451119
--- /dev/null
+++ b/src/lib/contracts.ts
@@ -0,0 +1,21 @@
+export interface ApiSuccess<T> {
+  success: true;
+  data: T;
+  meta?: Record<string, unknown>;
+}
+
+export interface ApiFailure {
+  success: false;
+  error: {
+    code: string;
+    message: string;
+    details?: Record<string, unknown>;
+  };
+}
+
+export interface MoneySnapshot {
+  amount: string;
+  currency: string;
+  exchangeRateToUsd: string;
+  amountUsd: string;
+}
diff --git a/src/lib/current-user.ts b/src/lib/current-user.ts
new file mode 100644
index 0000000..7bcad77
--- /dev/null
+++ b/src/lib/current-user.ts
@@ -0,0 +1,15 @@
+import { auth } from "@/auth";
+import { DomainError } from "@/lib/errors";
+import type { AuthorizationContext } from "@/lib/rbac";
+
+export async function currentAuthorizationContext(): Promise<AuthorizationContext> {
+  const session = await auth();
+  if (!session?.user) {
+    throw new DomainError("UNAUTHENTICATED", "Authentication required", 401);
+  }
+
+  return {
+    userId: session.user.id,
+    permissions: session.user.permissions,
+  };
+}
diff --git a/src/lib/errors.ts b/src/lib/errors.ts
new file mode 100644
index 0000000..f9d0af2
--- /dev/null
+++ b/src/lib/errors.ts
@@ -0,0 +1,21 @@
+export class DomainError extends Error {
+  constructor(
+    public readonly code: string,
+    message: string,
+    public readonly status = 400,
+    public readonly details?: Record<string, unknown>,
+  ) {
+    super(message);
+    this.name = "DomainError";
+  }
+}
+
+export class AuthorizationError extends DomainError {
+  constructor(permission: string) {
+    super(
+      "PERMISSION_DENIED",
+      `Permission denied: ${permission}`,
+      403,
+    );
+  }
+}
diff --git a/src/lib/http.ts b/src/lib/http.ts
new file mode 100644
index 0000000..729afd7
--- /dev/null
+++ b/src/lib/http.ts
@@ -0,0 +1,55 @@
+import { NextResponse } from "next/server";
+import { ZodError } from "zod";
+
+import type { ApiFailure, ApiSuccess } from "@/lib/contracts";
+import { DomainError } from "@/lib/errors";
+
+export function success<T>(data: T, status = 200) {
+  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, { status });
+}
+
+export function failure(error: unknown) {
+  if (error instanceof ZodError) {
+    return NextResponse.json<ApiFailure>(
+      {
+        success: false,
+        error: {
+          code: "VALIDATION_ERROR",
+          message: "Request validation failed",
+          details: {
+            issues: error.issues.map((issue) => ({
+              path: issue.path.join("."),
+              message: issue.message,
+            })),
+          },
+        },
+      },
+      { status: 400 },
+    );
+  }
+
+  if (error instanceof DomainError) {
+    return NextResponse.json<ApiFailure>(
+      {
+        success: false,
+        error: {
+          code: error.code,
+          message: error.message,
+          ...(error.details ? { details: error.details } : {}),
+        },
+      },
+      { status: error.status },
+    );
+  }
+
+  return NextResponse.json<ApiFailure>(
+    {
+      success: false,
+      error: {
+        code: "INTERNAL_ERROR",
+        message: "An unexpected error occurred",
+      },
+    },
+    { status: 500 },
+  );
+}
diff --git a/src/lib/money.test.ts b/src/lib/money.test.ts
new file mode 100644
index 0000000..8237a14
--- /dev/null
+++ b/src/lib/money.test.ts
@@ -0,0 +1,41 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  calculateProfit,
+  convertMoney,
+  moneySnapshot,
+} from "@/lib/money";
+
+describe("money", () => {
+  it("converts source currency to USD without floating-point drift", () => {
+    expect(convertMoney("1234.56", "0.13721")).toBe("169.3939776");
+  });
+
+  it("captures source and base amounts with the exchange rate", () => {
+    expect(moneySnapshot("100.10", "CNY", "0.14")).toEqual({
+      amount: "100.10",
+      currency: "CNY",
+      exchangeRateToUsd: "0.14",
+      amountUsd: "14.014",
+    });
+  });
+
+  it("calculates profit and margin from decimal-safe values", () => {
+    expect(calculateProfit("999.99", "654.32")).toEqual({
+      revenueUsd: "999.99",
+      costUsd: "654.32",
+      profitUsd: "345.67",
+      marginPercent: "34.567345673456734567",
+    });
+  });
+
+  it("returns a zero margin when revenue is zero", () => {
+    expect(calculateProfit("0", "10").marginPercent).toBe("0");
+  });
+
+  it("rejects non-positive exchange rates", () => {
+    expect(() => convertMoney("10", "0")).toThrow(
+      "Exchange rate must be greater than zero",
+    );
+  });
+});
diff --git a/src/lib/money.ts b/src/lib/money.ts
new file mode 100644
index 0000000..70d4930
--- /dev/null
+++ b/src/lib/money.ts
@@ -0,0 +1,49 @@
+import Decimal from "decimal.js";
+
+import type { MoneySnapshot } from "@/lib/contracts";
+import { DomainError } from "@/lib/errors";
+
+Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
+
+export function convertMoney(amount: Decimal.Value, exchangeRateToUsd: Decimal.Value) {
+  const rate = new Decimal(exchangeRateToUsd);
+  if (rate.lte(0)) {
+    throw new DomainError(
+      "INVALID_EXCHANGE_RATE",
+      "Exchange rate must be greater than zero",
+    );
+  }
+
+  return new Decimal(amount).mul(rate).toString();
+}
+
+export function moneySnapshot(
+  amount: string,
+  currency: string,
+  exchangeRateToUsd: string,
+): MoneySnapshot {
+  return {
+    amount,
+    currency,
+    exchangeRateToUsd,
+    amountUsd: convertMoney(amount, exchangeRateToUsd),
+  };
+}
+
+export function calculateProfit(
+  revenueUsd: Decimal.Value,
+  costUsd: Decimal.Value,
+) {
+  const revenue = new Decimal(revenueUsd);
+  const cost = new Decimal(costUsd);
+  const profit = revenue.minus(cost);
+
+  return {
+    revenueUsd: revenue.toString(),
+    costUsd: cost.toString(),
+    profitUsd: profit.toString(),
+    marginPercent: revenue.isZero()
+      ? "0"
+      : profit.div(revenue).mul(100).toDecimalPlaces(18).toString(),
+  };
+}
diff --git a/src/lib/password.test.ts b/src/lib/password.test.ts
new file mode 100644
index 0000000..29b6be2
--- /dev/null
+++ b/src/lib/password.test.ts
@@ -0,0 +1,12 @@
+import { describe, expect, it } from "vitest";
+
+import { hashPassword, verifyPassword } from "@/lib/password";
+
+describe("password hashing", () => {
+  it("uses Argon2id and verifies the original password", async () => {
+    const hash = await hashPassword("ChangeMe123!");
+    expect(hash).toMatch(/^\$argon2id\$/);
+    await expect(verifyPassword(hash, "ChangeMe123!")).resolves.toBe(true);
+    await expect(verifyPassword(hash, "wrong-password")).resolves.toBe(false);
+  });
+});
diff --git a/src/lib/password.ts b/src/lib/password.ts
new file mode 100644
index 0000000..9558edc
--- /dev/null
+++ b/src/lib/password.ts
@@ -0,0 +1,16 @@
+import { hash, verify, type Options } from "argon2";
+
+const ARGON2ID_OPTIONS: Options = {
+  type: 2,
+  memoryCost: 19_456,
+  timeCost: 2,
+  parallelism: 1,
+};
+
+export function hashPassword(password: string) {
+  return hash(password, ARGON2ID_OPTIONS);
+}
+
+export function verifyPassword(passwordHash: string, password: string) {
+  return verify(passwordHash, password);
+}
diff --git a/src/lib/prisma.ts b/src/lib/prisma.ts
new file mode 100644
index 0000000..74fc53c
--- /dev/null
+++ b/src/lib/prisma.ts
@@ -0,0 +1,23 @@
+import { PrismaPg } from "@prisma/adapter-pg";
+import { PrismaClient } from "@/generated/prisma/client";
+
+const globalForPrisma = globalThis as unknown as {
+  prisma?: PrismaClient;
+};
+
+function createClient() {
+  const connectionString = process.env.DATABASE_URL;
+  if (!connectionString) {
+    throw new Error("DATABASE_URL is required");
+  }
+  return new PrismaClient({
+    adapter: new PrismaPg({ connectionString }),
+  });
+}
+
+export function getPrisma() {
+  if (!globalForPrisma.prisma) {
+    globalForPrisma.prisma = createClient();
+  }
+  return globalForPrisma.prisma;
+}
diff --git a/src/lib/rbac.test.ts b/src/lib/rbac.test.ts
new file mode 100644
index 0000000..9bdb53c
--- /dev/null
+++ b/src/lib/rbac.test.ts
@@ -0,0 +1,49 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  can,
+  requirePermission,
+  type AuthorizationContext,
+} from "@/lib/rbac";
+
+const salesRep: AuthorizationContext = {
+  userId: "sales-1",
+  permissions: ["customer.read", "customer.update"],
+};
+
+describe("RBAC", () => {
+  it("grants a listed global permission", () => {
+    expect(can(salesRep, "customer.read")).toBe(true);
+  });
+
+  it("denies an unlisted permission", () => {
+    expect(can(salesRep, "customer.delete")).toBe(false);
+  });
+
+  it("enforces ownership for scoped access", () => {
+    expect(can(salesRep, "customer.update", { ownerId: "sales-1" })).toBe(true);
+    expect(can(salesRep, "customer.update", { ownerId: "sales-2" })).toBe(false);
+  });
+
+  it.each(["purchase.cost.read", "finance.profit.read"] as const)(
+    "does not infer the sensitive %s permission",
+    (permission) => {
+      expect(can(salesRep, permission)).toBe(false);
+    },
+  );
+
+  it("permits an explicit sensitive permission", () => {
+    expect(
+      can(
+        { userId: "finance-1", permissions: ["finance.profit.read"] },
+        "finance.profit.read",
+      ),
+    ).toBe(true);
+  });
+
+  it("throws a domain authorization error when permission is missing", () => {
+    expect(() => requirePermission(salesRep, "role.update")).toThrow(
+      "Permission denied: role.update",
+    );
+  });
+});
diff --git a/src/lib/rbac.ts b/src/lib/rbac.ts
new file mode 100644
index 0000000..23f4977
--- /dev/null
+++ b/src/lib/rbac.ts
@@ -0,0 +1,49 @@
+import { AuthorizationError } from "@/lib/errors";
+
+export const SENSITIVE_PERMISSIONS = [
+  "purchase.cost.read",
+  "finance.profit.read",
+] as const;
+
+export interface AuthorizationContext {
+  userId: string;
+  permissions: readonly string[];
+}
+
+export interface OwnedResource {
+  ownerId?: string | null;
+}
+
+export function can(
+  context: AuthorizationContext,
+  permission: string,
+  resource?: OwnedResource,
+) {
+  const hasPermission =
+    context.permissions.includes("*") ||
+    context.permissions.includes(permission);
+
+  if (!hasPermission) {
+    return false;
+  }
+
+  if (resource?.ownerId) {
+    return (
+      resource.ownerId === context.userId ||
+      context.permissions.includes(`${permission}.all`) ||
+      context.permissions.includes("*")
+    );
+  }
+
+  return true;
+}
+
+export function requirePermission(
+  context: AuthorizationContext,
+  permission: string,
+  resource?: OwnedResource,
+) {
+  if (!can(context, permission, resource)) {
+    throw new AuthorizationError(permission);
+  }
+}
diff --git a/src/modules/auth/authenticate.test.ts b/src/modules/auth/authenticate.test.ts
new file mode 100644
index 0000000..90d8697
--- /dev/null
+++ b/src/modules/auth/authenticate.test.ts
@@ -0,0 +1,103 @@
+import { beforeAll, describe, expect, it } from "vitest";
+
+import {
+  authenticateCredentials,
+  type AuthRepository,
+  type LoginIdentity,
+} from "@/modules/auth/authenticate";
+import { hashPassword } from "@/lib/password";
+
+let passwordHash: string;
+
+beforeAll(async () => {
+  passwordHash = await hashPassword("ChangeMe123!");
+});
+
+function repositoryFor(user: LoginIdentity | null) {
+  const attempts: Array<{ success: boolean; reason?: string }> = [];
+  const audits: string[] = [];
+  let lastLoginUpdated = false;
+
+  const repository: AuthRepository = {
+    findByEmail: async () => user,
+    recordAttempt: async (attempt) => {
+      attempts.push({ success: attempt.success, reason: attempt.reason });
+    },
+    writeAudit: async (action) => {
+      audits.push(action);
+    },
+    updateLastLogin: async () => {
+      lastLoginUpdated = true;
+    },
+  };
+
+  return {
+    repository,
+    attempts,
+    audits,
+    wasLastLoginUpdated: () => lastLoginUpdated,
+  };
+}
+
+const activeUser = (): LoginIdentity => ({
+  id: "user-1",
+  email: "admin@atlascrm.dev",
+  name: "Ada Admin",
+  passwordHash,
+  status: "ACTIVE",
+  roles: ["SUPER_ADMIN"],
+  permissions: ["*"],
+});
+
+describe("credential authentication", () => {
+  it("returns a safe identity and records a successful login", async () => {
+    const state = repositoryFor(activeUser());
+
+    const result = await authenticateCredentials(state.repository, {
+      email: "ADMIN@atlascrm.dev ",
+      password: "ChangeMe123!",
+      ipAddress: "127.0.0.1",
+    });
+
+    expect(result).toEqual({
+      id: "user-1",
+      email: "admin@atlascrm.dev",
+      name: "Ada Admin",
+      roles: ["SUPER_ADMIN"],
+      permissions: ["*"],
+    });
+    expect(state.attempts).toEqual([{ success: true, reason: undefined }]);
+    expect(state.audits).toEqual(["auth.login.success"]);
+    expect(state.wasLastLoginUpdated()).toBe(true);
+  });
+
+  it("returns null and records an invalid password", async () => {
+    const state = repositoryFor(activeUser());
+
+    const result = await authenticateCredentials(state.repository, {
+      email: "admin@atlascrm.dev",
+      password: "wrong",
+    });
+
+    expect(result).toBeNull();
+    expect(state.attempts).toEqual([
+      { success: false, reason: "INVALID_CREDENTIALS" },
+    ]);
+    expect(state.audits).toEqual(["auth.login.failure"]);
+  });
+
+  it("blocks inactive users and records the reason", async () => {
+    const state = repositoryFor({ ...activeUser(), status: "INACTIVE" });
+
+    const result = await authenticateCredentials(state.repository, {
+      email: "admin@atlascrm.dev",
+      password: "ChangeMe123!",
+    });
+
+    expect(result).toBeNull();
+    expect(state.attempts).toEqual([
+      { success: false, reason: "USER_INACTIVE" },
+    ]);
+    expect(state.audits).toEqual(["auth.login.failure"]);
+  });
+});
diff --git a/src/modules/auth/authenticate.ts b/src/modules/auth/authenticate.ts
new file mode 100644
index 0000000..72582d6
--- /dev/null
+++ b/src/modules/auth/authenticate.ts
@@ -0,0 +1,86 @@
+import { verifyPassword } from "@/lib/password";
+
+export interface LoginIdentity {
+  id: string;
+  email: string;
+  name: string;
+  passwordHash: string;
+  status: "ACTIVE" | "INACTIVE" | "LOCKED";
+  roles: string[];
+  permissions: string[];
+}
+
+export interface AuthRepository {
+  findByEmail(email: string): Promise<LoginIdentity | null>;
+  recordAttempt(input: {
+    userId?: string;
+    email: string;
+    success: boolean;
+    reason?: string;
+    ipAddress?: string;
+    userAgent?: string;
+  }): Promise<void>;
+  writeAudit(
+    action: string,
+    input: { actorId?: string; email: string; ipAddress?: string },
+  ): Promise<void>;
+  updateLastLogin(userId: string): Promise<void>;
+}
+
+export interface CredentialInput {
+  email: string;
+  password: string;
+  ipAddress?: string;
+  userAgent?: string;
+}
+
+export async function authenticateCredentials(
+  repository: AuthRepository,
+  input: CredentialInput,
+) {
+  const email = input.email.trim().toLowerCase();
+  const user = await repository.findByEmail(email);
+  const validPassword =
+    user !== null && (await verifyPassword(user.passwordHash, input.password));
+
+  if (!user || !validPassword || user.status !== "ACTIVE") {
+    const reason =
+      user && validPassword ? "USER_INACTIVE" : "INVALID_CREDENTIALS";
+    await repository.recordAttempt({
+      userId: user?.id,
+      email,
+      success: false,
+      reason,
+      ipAddress: input.ipAddress,
+      userAgent: input.userAgent,
+    });
+    await repository.writeAudit("auth.login.failure", {
+      actorId: user?.id,
+      email,
+      ipAddress: input.ipAddress,
+    });
+    return null;
+  }
+
+  await repository.recordAttempt({
+    userId: user.id,
+    email,
+    success: true,
+    ipAddress: input.ipAddress,
+    userAgent: input.userAgent,
+  });
+  await repository.updateLastLogin(user.id);
+  await repository.writeAudit("auth.login.success", {
+    actorId: user.id,
+    email,
+    ipAddress: input.ipAddress,
+  });
+
+  return {
+    id: user.id,
+    email: user.email,
+    name: user.name,
+    roles: user.roles,
+    permissions: user.permissions,
+  };
+}
diff --git a/src/modules/auth/prisma-auth-repository.ts b/src/modules/auth/prisma-auth-repository.ts
new file mode 100644
index 0000000..e025b9d
--- /dev/null
+++ b/src/modules/auth/prisma-auth-repository.ts
@@ -0,0 +1,69 @@
+import { getPrisma } from "@/lib/prisma";
+import { writeAudit } from "@/lib/audit";
+import type {
+  AuthRepository,
+  LoginIdentity,
+} from "@/modules/auth/authenticate";
+
+export function createPrismaAuthRepository(): AuthRepository {
+  const prisma = getPrisma();
+
+  return {
+    async findByEmail(email): Promise<LoginIdentity | null> {
+      const user = await prisma.user.findFirst({
+        where: { email, deletedAt: null },
+        include: {
+          roles: {
+            include: {
+              role: {
+                include: {
+                  permissions: { include: { permission: true } },
+                },
+              },
+            },
+          },
+        },
+      });
+      if (!user) return null;
+
+      return {
+        id: user.id,
+        email: user.email,
+        name: user.name,
+        passwordHash: user.passwordHash,
+        status: user.status,
+        roles: user.roles.map(({ role }) => role.code),
+        permissions: [
+          ...new Set(
+            user.roles.flatMap(({ role }) =>
+              role.permissions.map(({ permission }) => permission.code),
+            ),
+          ),
+        ],
+      };
+    },
+    recordAttempt(input) {
+      return prisma.loginAttempt
+        .create({ data: input })
+        .then(() => undefined);
+    },
+    writeAudit(action, input) {
+      return writeAudit(prisma, {
+        actorId: input.actorId,
+        action,
+        entityType: "User",
+        entityId: input.actorId,
+        metadata: { email: input.email },
+        ipAddress: input.ipAddress,
+      }).then(() => undefined);
+    },
+    updateLastLogin(userId) {
+      return prisma.user
+        .update({
+          where: { id: userId },
+          data: { lastLoginAt: new Date() },
+        })
+        .then(() => undefined);
+    },
+  };
+}
diff --git a/src/modules/dashboard/dashboard-service.ts b/src/modules/dashboard/dashboard-service.ts
new file mode 100644
index 0000000..0ec553a
--- /dev/null
+++ b/src/modules/dashboard/dashboard-service.ts
@@ -0,0 +1,23 @@
+export interface DashboardSnapshot {
+  activeCustomers: number;
+  openQuotes: number;
+  activeOrders: number;
+  dueTasks: number;
+  recentCustomers: Array<{
+    id: string;
+    companyName: string;
+    countryCode: string;
+    createdAt: Date;
+  }>;
+}
+
+export interface DashboardRepository {
+  loadSnapshot(userId: string): Promise<DashboardSnapshot>;
+}
+
+export function loadDashboard(
+  repository: DashboardRepository,
+  userId: string,
+) {
+  return repository.loadSnapshot(userId);
+}
diff --git a/src/modules/dashboard/prisma-dashboard-repository.ts b/src/modules/dashboard/prisma-dashboard-repository.ts
new file mode 100644
index 0000000..3c7d154
--- /dev/null
+++ b/src/modules/dashboard/prisma-dashboard-repository.ts
@@ -0,0 +1,56 @@
+import { getPrisma } from "@/lib/prisma";
+import type {
+  DashboardRepository,
+  DashboardSnapshot,
+} from "@/modules/dashboard/dashboard-service";
+
+export class PrismaDashboardRepository implements DashboardRepository {
+  async loadSnapshot(userId: string): Promise<DashboardSnapshot> {
+    const prisma = getPrisma();
+    const [activeCustomers, openQuotes, activeOrders, dueTasks, recentCustomers] =
+      await prisma.$transaction([
+        prisma.customer.count({
+          where: { status: "ACTIVE", deletedAt: null },
+        }),
+        prisma.quote.count({
+          where: {
+            status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT"] },
+            deletedAt: null,
+          },
+        }),
+        prisma.salesOrder.count({
+          where: {
+            status: { in: ["CONFIRMED", "PURCHASING", "FULFILLING", "SHIPPED"] },
+            deletedAt: null,
+          },
+        }),
+        prisma.task.count({
+          where: {
+            assigneeId: userId,
+            status: { in: ["OPEN", "IN_PROGRESS"] },
+            dueAt: { lte: new Date() },
+            deletedAt: null,
+          },
+        }),
+        prisma.customer.findMany({
+          where: { deletedAt: null },
+          orderBy: { createdAt: "desc" },
+          take: 5,
+          select: {
+            id: true,
+            companyName: true,
+            countryCode: true,
+            createdAt: true,
+          },
+        }),
+      ]);
+
+    return {
+      activeCustomers,
+      openQuotes,
+      activeOrders,
+      dueTasks,
+      recentCustomers,
+    };
+  }
+}
diff --git a/src/proxy.ts b/src/proxy.ts
new file mode 100644
index 0000000..1e1d498
--- /dev/null
+++ b/src/proxy.ts
@@ -0,0 +1,19 @@
+import { NextResponse } from "next/server";
+
+import { auth } from "@/auth";
+
+export default auth((request) => {
+  const pathname = request.nextUrl.pathname;
+  const isProtected = /^\/(en|zh)\/(dashboard|users|roles)/.test(pathname);
+
+  if (isProtected && !request.auth) {
+    const locale = pathname.split("/")[1] || "en";
+    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
+  }
+
+  return NextResponse.next();
+});
+
+export const config = {
+  matcher: ["/en/:path*", "/zh/:path*"],
+};
diff --git a/src/types/next-auth.d.ts b/src/types/next-auth.d.ts
new file mode 100644
index 0000000..2e85355
--- /dev/null
+++ b/src/types/next-auth.d.ts
@@ -0,0 +1,19 @@
+import "next-auth";
+
+declare module "next-auth" {
+  interface User {
+    roles: string[];
+    permissions: string[];
+  }
+
+  interface Session {
+    user: {
+      id: string;
+      name?: string | null;
+      email?: string | null;
+      image?: string | null;
+      roles: string[];
+      permissions: string[];
+    };
+  }
+}
diff --git a/src/worker.ts b/src/worker.ts
new file mode 100644
index 0000000..e92a897
--- /dev/null
+++ b/src/worker.ts
@@ -0,0 +1,19 @@
+import { run, type TaskList } from "graphile-worker";
+
+const connectionString = process.env.DATABASE_URL;
+if (!connectionString) throw new Error("DATABASE_URL is required");
+
+const taskList: TaskList = {
+  health_check: async (_payload, helpers) => {
+    helpers.logger.info("Background worker health check completed");
+  },
+};
+
+const runner = await run({
+  connectionString,
+  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
+  pollInterval: 1000,
+  taskList,
+});
+
+await runner.promise;
diff --git a/tsconfig.json b/tsconfig.json
new file mode 100644
index 0000000..cf9c65d
--- /dev/null
+++ b/tsconfig.json
@@ -0,0 +1,34 @@
+{
+  "compilerOptions": {
+    "target": "ES2017",
+    "lib": ["dom", "dom.iterable", "esnext"],
+    "allowJs": true,
+    "skipLibCheck": true,
+    "strict": true,
+    "noEmit": true,
+    "esModuleInterop": true,
+    "module": "esnext",
+    "moduleResolution": "bundler",
+    "resolveJsonModule": true,
+    "isolatedModules": true,
+    "jsx": "react-jsx",
+    "incremental": true,
+    "plugins": [
+      {
+        "name": "next"
+      }
+    ],
+    "paths": {
+      "@/*": ["./src/*"]
+    }
+  },
+  "include": [
+    "next-env.d.ts",
+    "**/*.ts",
+    "**/*.tsx",
+    ".next/types/**/*.ts",
+    ".next/dev/types/**/*.ts",
+    "**/*.mts"
+  ],
+  "exclude": ["node_modules"]
+}
diff --git a/vitest.config.ts b/vitest.config.ts
new file mode 100644
index 0000000..2e329a9
--- /dev/null
+++ b/vitest.config.ts
@@ -0,0 +1,17 @@
+import { fileURLToPath } from "node:url";
+
+import { defineConfig } from "vitest/config";
+
+export default defineConfig({
+  resolve: {
+    alias: {
+      "@": fileURLToPath(new URL("./src", import.meta.url)),
+    },
+  },
+  test: {
+    environment: "node",
+    coverage: {
+      reporter: ["text", "html"],
+    },
+  },
+});
