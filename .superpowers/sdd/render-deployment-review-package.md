# Render deployment review package

## Deployment files

diff --git a/render.yaml b/render.yaml
new file mode 100644
index 0000000..d513f2e
--- /dev/null
+++ b/render.yaml
@@ -0,0 +1,30 @@
+services:
+  - type: web
+    name: atlas-crm
+    runtime: node
+    plan: free
+    buildCommand: pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm build
+    startCommand: pnpm prisma migrate deploy && pnpm start -- --port $PORT
+    healthCheckPath: /api/health
+    autoDeploy: true
+    envVars:
+      - key: NODE_VERSION
+        value: 24
+      - key: DATABASE_URL
+        sync: false
+      - key: AUTH_SECRET
+        generateValue: true
+      - key: AUTH_URL
+        sync: false
+      - key: MINIO_ENDPOINT
+        sync: false
+      - key: MINIO_PORT
+        sync: false
+      - key: MINIO_ACCESS_KEY
+        sync: false
+      - key: MINIO_SECRET_KEY
+        sync: false
+      - key: MINIO_BUCKET
+        value: atlas-crm
+      - key: MINIO_USE_SSL
+        value: true
diff --git a/scripts/render-config.test.mjs b/scripts/render-config.test.mjs
new file mode 100644
index 0000000..6de0fa1
--- /dev/null
+++ b/scripts/render-config.test.mjs
@@ -0,0 +1,10 @@
+import assert from "node:assert/strict";
+import { readFile } from "node:fs/promises";
+
+const config = await readFile(new URL("../render.yaml", import.meta.url), "utf8");
+assert.match(config, /buildCommand: pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm build/);
+assert.match(config, /startCommand: pnpm prisma migrate deploy && pnpm start -- --port \$PORT/);
+assert.match(config, /healthCheckPath: \/api\/health/);
+for (const key of ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL"]) {
+  assert.match(config, new RegExp(`key: ${key}`));
+}
diff --git a/.env.example b/.env.example
new file mode 100644
index 0000000..89480f1
--- /dev/null
+++ b/.env.example
@@ -0,0 +1,15 @@
+# Local development examples only. Supply production values through Render; never commit secrets.
+# On Render, DATABASE_URL is Neon's pooled TLS URL and AUTH_URL is the exact public Render HTTPS URL.
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
+WORKER_CRONTAB=*/15 * * * * generate_management_reminders
+BACKUP_ROOT=./backups
+BACKUP_RETENTION_DAYS=30
diff --git a/.env.example b/.env.example
index 379ef3d..89480f1 100644
--- a/.env.example
+++ b/.env.example
@@ -1,10 +1,15 @@
+# Local development examples only. Supply production values through Render; never commit secrets.
+# On Render, DATABASE_URL is Neon's pooled TLS URL and AUTH_URL is the exact public Render HTTPS URL.
 DATABASE_URL=postgresql://crm:crm_dev_password@localhost:5432/foreign_trade_crm?schema=public
 AUTH_SECRET=replace-with-at-least-32-random-bytes
 AUTH_URL=http://localhost:3000
 MINIO_ENDPOINT=localhost
 MINIO_PORT=9000
 MINIO_ACCESS_KEY=atlas_minio
 MINIO_SECRET_KEY=replace-this-minio-secret
 MINIO_BUCKET=atlas-crm
 MINIO_USE_SSL=false
 WORKER_CONCURRENCY=2
+WORKER_CRONTAB=*/15 * * * * generate_management_reminders
+BACKUP_ROOT=./backups
+BACKUP_RETENTION_DAYS=30
diff --git a/README.md b/README.md
new file mode 100644
index 0000000..de4bdd4
--- /dev/null
+++ b/README.md
@@ -0,0 +1,177 @@
+# Atlas Foreign-Trade CRM
+
+Atlas CRM is a bilingual, role-aware operating system for international server and hardware trade. The foundation combines customer and transaction data, secure authentication, auditability, exact money calculations, and an operational shell ready for the later sales, procurement, fulfillment, and reporting modules.
+
+## Stack
+
+- Node.js 24, pnpm, Next.js App Router, React and TypeScript
+- PostgreSQL 17 with Prisma and fixed-point decimal money
+- Auth.js credentials sessions with Argon2id password hashing
+- Graphile Worker for PostgreSQL-backed background jobs
+- MinIO-compatible object storage
+- Vitest, ESLint and strict TypeScript
+
+## Modules
+
+- Sales CRM: leads, customers, contacts, follow-ups, opportunities, products, quotes, orders, payments, refunds and costs
+- Procurement and fulfillment: suppliers, purchase orders, inventory, serial tracking, inspections and shipments
+- Management: after-sales tickets, personal/team tasks, notifications, permission-scoped reports and exports, settings and redacted activity logs
+- Report downloads use UTF-8 CSV. Unsupported spreadsheet/PDF formats are rejected instead of returning mislabeled or incomplete files.
+- Platform: Auth.js authentication, RBAC, optimistic concurrency, audit events, Graphile Worker, PostgreSQL, MinIO and bilingual English/Chinese routes
+
+## Project structure
+
+```text
+prisma/                  schema, migrations and deterministic seed
+scripts/                 operator backup and restore commands
+src/app/                 locale pages and API Route Handlers
+src/components/          reusable interactive UI
+src/modules/             domain rules, services and repositories
+src/lib/                 auth, RBAC, audit, HTTP and shared utilities
+docs/operations/         deployment and recovery runbooks
+```
+
+## Requirements
+
+- Node.js 24 and pnpm 11
+- PostgreSQL 17
+- MinIO or another S3-compatible service
+- PostgreSQL client tools and MinIO `mc` for operator backups
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
+The deterministic seed creates 20 customers, 40 leads, 20 opportunities, representative transaction/procurement/fulfillment records, 10 after-sales tickets, 20 tasks, six roles, and nine users. Re-running the seed is idempotent.
+
+## Roles
+
+| Role | Scope |
+| --- | --- |
+| Super Admin | All modules, settings, users, roles and activity logs |
+| Sales Manager | Team-wide sales, tasks and commercial reports |
+| Sales Representative | Owned sales accounts, transactions and personal tasks |
+| Finance | Payments, refunds, receivables, purchasing cost and profit reports |
+| Procurement | Suppliers, purchasing and related inventory/tasks |
+| Operations | Inventory, quality, logistics, after-sales and related tasks |
+
+Reports apply ownership scope on the server. Purchase-cost, supplier-bank and profit values require their explicit sensitive permissions.
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
+For a deployment, copy `.env.example`, replace every secret, then run:
+
+```bash
+docker compose config
+docker compose up --build -d
+docker compose ps
+```
+
+Apply migrations and seed only from an authorized release process:
+
+```bash
+docker compose exec web pnpm prisma migrate deploy
+docker compose exec web pnpm prisma:seed
+```
+
+## Database and worker
+
+Prisma migrations in `prisma/migrations` are the database source of truth. Use `pnpm prisma:migrate` only for local development and `pnpm prisma migrate deploy` in deployments. The worker runs the idempotent `generate_management_reminders` task every 15 minutes by default; `WORKER_CRONTAB` can override the schedule, and Graphile Worker retries failures up to the configured task limit.
+
+## Backup and restore
+
+Set the database and MinIO environment variables, then run `.\scripts\backup.ps1`. Backups default to `.\backups` with 30-day retention, remove incomplete runs, and record SHA-256 artifact integrity in the completed manifest. Restores validate that manifest before the first destructive action and require the explicit confirmation switch:
+
+```powershell
+.\scripts\restore.ps1 -BackupPath .\backups\<timestamp> -ConfirmRestore
+```
+
+The full procedure and quarterly restore drill are in [docs/operations/backup-restore.md](docs/operations/backup-restore.md).
+
+## Troubleshooting
+
+- `DATABASE_URL is required`: ensure `.env` exists and the command is launched from the project directory.
+- Authentication loops: verify `AUTH_SECRET`, the public application URL and user status, then check login-attempt audit records.
+- Prisma client/type mismatch: run `pnpm prisma:generate` after every schema change.
+- Worker creates no reminders: confirm the worker process, `WORKER_CRONTAB`, Graphile Worker schema access and eligible due records.
+- MinIO attachments fail: verify endpoint reachability, credentials, bucket name and clock synchronization.
+- Migration fails: do not edit an applied migration; restore from backup or correct the forward migration and rerun deployment.
+- Build fails after a clean checkout: use Node.js 24, enable Corepack, run `pnpm install --frozen-lockfile`, then regenerate Prisma.
+
+## Security and architecture notes
+
+- Session cookies are HTTP-only, same-site, secure in production, and limited to eight hours.
+- Inactive and locked users cannot authenticate. Every attempt is recorded; successful and failed authentication is audited.
+- User and role mutation API foundations enforce server-side RBAC and write audit events in the same transaction.
+- Sales ownership scope is enforced separately from permission presence. Purchase-cost and profit access are explicit sensitive permissions.
+- Currency amounts, exchange-rate snapshots and profit calculations use decimal-safe fixed-point values.
+- Important business records use optimistic versions and soft-delete/cancellation fields where meaningful.
+
+## Render + Neon deployment
+
+1. Create a Neon database and copy its pooled TLS connection string into Render as `DATABASE_URL`.
+2. Push this repository to a private GitHub repository, then create a Render Blueprint from `render.yaml`.
+3. After Render assigns `https://<service>.onrender.com`, set `AUTH_URL` to that exact value and redeploy.
+4. Run the one-time seed command in a controlled Render shell or locally against Neon: `pnpm prisma:seed`.
+5. Change the seeded administrator password immediately. Free Render services sleep after inactivity; this is a demo environment, not a high-availability production deployment.
+
+Render generates `AUTH_SECRET`. Supply `DATABASE_URL`, `AUTH_URL`, and any external object-storage values (`MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY`) in Render's environment settings; do not commit them. The Blueprint applies Prisma migrations before starting the public service on Render's `PORT` and monitors `/api/health`. It does not deploy the Graphile Worker as an always-on free service.
diff --git a/README.md b/README.md
index b773073..de4bdd4 100644
--- a/README.md
+++ b/README.md
@@ -1,23 +1,50 @@
 # Atlas Foreign-Trade CRM
 
 Atlas CRM is a bilingual, role-aware operating system for international server and hardware trade. The foundation combines customer and transaction data, secure authentication, auditability, exact money calculations, and an operational shell ready for the later sales, procurement, fulfillment, and reporting modules.
 
-## Foundation stack
+## Stack
 
 - Node.js 24, pnpm, Next.js App Router, React and TypeScript
 - PostgreSQL 17 with Prisma and fixed-point decimal money
 - Auth.js credentials sessions with Argon2id password hashing
 - Graphile Worker for PostgreSQL-backed background jobs
 - MinIO-compatible object storage
 - Vitest, ESLint and strict TypeScript
 
+## Modules
+
+- Sales CRM: leads, customers, contacts, follow-ups, opportunities, products, quotes, orders, payments, refunds and costs
+- Procurement and fulfillment: suppliers, purchase orders, inventory, serial tracking, inspections and shipments
+- Management: after-sales tickets, personal/team tasks, notifications, permission-scoped reports and exports, settings and redacted activity logs
+- Report downloads use UTF-8 CSV. Unsupported spreadsheet/PDF formats are rejected instead of returning mislabeled or incomplete files.
+- Platform: Auth.js authentication, RBAC, optimistic concurrency, audit events, Graphile Worker, PostgreSQL, MinIO and bilingual English/Chinese routes
+
+## Project structure
+
+```text
+prisma/                  schema, migrations and deterministic seed
+scripts/                 operator backup and restore commands
+src/app/                 locale pages and API Route Handlers
+src/components/          reusable interactive UI
+src/modules/             domain rules, services and repositories
+src/lib/                 auth, RBAC, audit, HTTP and shared utilities
+docs/operations/         deployment and recovery runbooks
+```
+
+## Requirements
+
+- Node.js 24 and pnpm 11
+- PostgreSQL 17
+- MinIO or another S3-compatible service
+- PostgreSQL client tools and MinIO `mc` for operator backups
+
 ## Local setup
 
 1. Install Node.js 24 and enable pnpm through Corepack.
 2. Copy `.env.example` to `.env` and replace `AUTH_SECRET` and storage secrets.
 3. Start PostgreSQL 17 and MinIO, or run `docker compose up postgres minio -d`.
 4. Install and initialize:
 
    ```bash
    pnpm install
    pnpm prisma:generate
@@ -46,20 +73,35 @@ ChangeMe123!
 | --- | --- |
 | Super Admin | `admin@atlascrm.dev` |
 | Sales Manager | `sales.manager@atlascrm.dev` |
 | Sales Representative | `sales.asia@atlascrm.dev`, `sales.emea@atlascrm.dev` |
 | Finance | `finance@atlascrm.dev` |
 | Procurement | `procurement@atlascrm.dev` |
 | Operations | `warehouse@atlascrm.dev`, `logistics@atlascrm.dev`, `support@atlascrm.dev` |
 
 Never reuse the development password in a shared or production environment.
 
+The deterministic seed creates 20 customers, 40 leads, 20 opportunities, representative transaction/procurement/fulfillment records, 10 after-sales tickets, 20 tasks, six roles, and nine users. Re-running the seed is idempotent.
+
+## Roles
+
+| Role | Scope |
+| --- | --- |
+| Super Admin | All modules, settings, users, roles and activity logs |
+| Sales Manager | Team-wide sales, tasks and commercial reports |
+| Sales Representative | Owned sales accounts, transactions and personal tasks |
+| Finance | Payments, refunds, receivables, purchasing cost and profit reports |
+| Procurement | Suppliers, purchasing and related inventory/tasks |
+| Operations | Inventory, quality, logistics, after-sales and related tasks |
+
+Reports apply ownership scope on the server. Purchase-cost, supplier-bank and profit values require their explicit sensitive permissions.
+
 ## Commands
 
 ```bash
 pnpm test              # full Vitest suite
 pnpm typecheck         # strict TypeScript
 pnpm lint              # ESLint
 pnpm build             # production Next.js build
 pnpm prisma:generate   # generate the typed client
 pnpm prisma:migrate    # create/apply development migrations
 pnpm prisma:seed       # deterministic roles, users and foundation data
@@ -69,18 +111,67 @@ pnpm prisma:seed       # deterministic roles, users and foundation data
 
 `docker compose up --build` starts:
 
 - `web` on port 3000 with an API/database health check
 - `worker` for Graphile Worker jobs
 - `postgres` 17 with durable storage and `pg_isready`
 - `minio` on ports 9000/9001 with durable storage and health checks
 
 Set `POSTGRES_PASSWORD`, `AUTH_SECRET`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY` outside development.
 
+For a deployment, copy `.env.example`, replace every secret, then run:
+
+```bash
+docker compose config
+docker compose up --build -d
+docker compose ps
+```
+
+Apply migrations and seed only from an authorized release process:
+
+```bash
+docker compose exec web pnpm prisma migrate deploy
+docker compose exec web pnpm prisma:seed
+```
+
+## Database and worker
+
+Prisma migrations in `prisma/migrations` are the database source of truth. Use `pnpm prisma:migrate` only for local development and `pnpm prisma migrate deploy` in deployments. The worker runs the idempotent `generate_management_reminders` task every 15 minutes by default; `WORKER_CRONTAB` can override the schedule, and Graphile Worker retries failures up to the configured task limit.
+
+## Backup and restore
+
+Set the database and MinIO environment variables, then run `.\scripts\backup.ps1`. Backups default to `.\backups` with 30-day retention, remove incomplete runs, and record SHA-256 artifact integrity in the completed manifest. Restores validate that manifest before the first destructive action and require the explicit confirmation switch:
+
+```powershell
+.\scripts\restore.ps1 -BackupPath .\backups\<timestamp> -ConfirmRestore
+```
+
+The full procedure and quarterly restore drill are in [docs/operations/backup-restore.md](docs/operations/backup-restore.md).
+
+## Troubleshooting
+
+- `DATABASE_URL is required`: ensure `.env` exists and the command is launched from the project directory.
+- Authentication loops: verify `AUTH_SECRET`, the public application URL and user status, then check login-attempt audit records.
+- Prisma client/type mismatch: run `pnpm prisma:generate` after every schema change.
+- Worker creates no reminders: confirm the worker process, `WORKER_CRONTAB`, Graphile Worker schema access and eligible due records.
+- MinIO attachments fail: verify endpoint reachability, credentials, bucket name and clock synchronization.
+- Migration fails: do not edit an applied migration; restore from backup or correct the forward migration and rerun deployment.
+- Build fails after a clean checkout: use Node.js 24, enable Corepack, run `pnpm install --frozen-lockfile`, then regenerate Prisma.
+
 ## Security and architecture notes
 
 - Session cookies are HTTP-only, same-site, secure in production, and limited to eight hours.
 - Inactive and locked users cannot authenticate. Every attempt is recorded; successful and failed authentication is audited.
 - User and role mutation API foundations enforce server-side RBAC and write audit events in the same transaction.
 - Sales ownership scope is enforced separately from permission presence. Purchase-cost and profit access are explicit sensitive permissions.
 - Currency amounts, exchange-rate snapshots and profit calculations use decimal-safe fixed-point values.
 - Important business records use optimistic versions and soft-delete/cancellation fields where meaningful.
+
+## Render + Neon deployment
+
+1. Create a Neon database and copy its pooled TLS connection string into Render as `DATABASE_URL`.
+2. Push this repository to a private GitHub repository, then create a Render Blueprint from `render.yaml`.
+3. After Render assigns `https://<service>.onrender.com`, set `AUTH_URL` to that exact value and redeploy.
+4. Run the one-time seed command in a controlled Render shell or locally against Neon: `pnpm prisma:seed`.
+5. Change the seeded administrator password immediately. Free Render services sleep after inactivity; this is a demo environment, not a high-availability production deployment.
+
+Render generates `AUTH_SECRET`. Supply `DATABASE_URL`, `AUTH_URL`, and any external object-storage values (`MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY`) in Render's environment settings; do not commit them. The Blueprint applies Prisma migrations before starting the public service on Render's `PORT` and monitors `/api/health`. It does not deploy the Graphile Worker as an always-on free service.
diff --git a/docs/superpowers/specs/2026-07-20-render-neon-deployment-design.md b/docs/superpowers/specs/2026-07-20-render-neon-deployment-design.md
new file mode 100644
index 0000000..a4e57d7
--- /dev/null
+++ b/docs/superpowers/specs/2026-07-20-render-neon-deployment-design.md
@@ -0,0 +1,35 @@
+# Render + Neon Deployment Design
+
+## Goal
+
+Publish the CRM as a public, low-cost demonstration environment using a Render Web Service and Neon PostgreSQL. The deployment must preserve the existing Next.js server-rendered application, Prisma database access, Auth.js sessions, and database-backed management reminder behavior.
+
+## Architecture
+
+- GitHub private repository is the deployment source.
+- Render runs one Node Web Service from the repository.
+- Neon provides the PostgreSQL `DATABASE_URL`.
+- Render supplies the public HTTPS URL; `AUTH_URL` exactly matches it.
+- Render performs `prisma migrate deploy` before starting the Next.js server.
+- Seed data is run once manually from Render's deploy shell or a controlled release command, never on every restart.
+
+## Runtime behavior
+
+- Build command: install locked dependencies, generate Prisma Client, then build Next.js.
+- Start command: apply pending Prisma migrations and run `next start` bound to Render's `PORT`.
+- Health check: `/api/health`.
+- The Graphile Worker is not deployed as an always-on free Render service. Reminder generation is deferred to a protected HTTP endpoint scheduled externally, or runs manually for the demo environment. The database schema and worker code remain intact for a later paid worker deployment.
+
+## Security and configuration
+
+- All secrets are configured in Render, never committed: `DATABASE_URL`, a fresh `AUTH_SECRET`, `AUTH_URL`, and object-storage credentials.
+- The Neon connection string requires TLS and uses the pooled connection URL where Neon provides one.
+- Production seed passwords are not used. After first seed, the administrator password is changed immediately.
+- The initial deployment has no public file upload backing store. Existing file metadata remains supported; production uploads require an S3-compatible provider such as Cloudflare R2 and its Render environment variables.
+
+## Free-tier limits and acceptance criteria
+
+- Render's free service sleeps after inactivity; cold starts are expected.
+- Neon free storage and compute limits are appropriate only for a small demo dataset.
+- The site is successful when the Render URL loads, login redirects to the same public URL, migrations are current, and seeded admin login works.
+- A custom domain, always-on worker, automated backups, and robust object uploads are explicitly deferred to a paid or self-hosted environment.
diff --git a/docs/superpowers/plans/2026-07-20-render-neon-deployment.md b/docs/superpowers/plans/2026-07-20-render-neon-deployment.md
new file mode 100644
index 0000000..e2bd19c
--- /dev/null
+++ b/docs/superpowers/plans/2026-07-20-render-neon-deployment.md
@@ -0,0 +1,136 @@
+# Render + Neon Deployment Implementation Plan
+
+> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
+
+**Goal:** Make the CRM deployable as a Render Web Service backed by a Neon PostgreSQL database, without committing production secrets.
+
+**Architecture:** A Render Blueprint defines one public Node Web Service. Render builds Prisma Client and Next.js, then applies migrations before serving on Render's `PORT`. Neon supplies a TLS PostgreSQL URL, while Render holds all runtime secrets.
+
+**Tech Stack:** Render Blueprint, Node.js 24, pnpm 11, Next.js 16, Prisma 7, PostgreSQL/Neon.
+
+## Global Constraints
+
+- Never commit `DATABASE_URL`, `AUTH_SECRET`, or storage credentials.
+- `AUTH_URL` must exactly equal the Render HTTPS service URL.
+- Prisma migrations run before `next start`; seed data is a manual one-time action.
+- Render free services can sleep; background Graphile Worker work is not deployed as an always-on free service.
+- The deployment must bind the public HTTP server to Render's `PORT` and expose `/api/health`.
+
+---
+
+### Task 1: Render deployment artifacts and operator instructions
+
+**Files:**
+- Create: `render.yaml`
+- Modify: `.env.example`
+- Modify: `README.md`
+- Test: `render.yaml` configuration validation and production build
+
+**Interfaces:**
+- Consumes: `package.json` scripts `build`, `start`, `prisma:generate`; `/api/health` route.
+- Produces: a Render Blueprint with environment variable names, build/start commands, and a documented Neon + Render deployment checklist.
+
+- [ ] **Step 1: Write a failing deployment-contract test**
+
+Create `scripts/render-config.test.mjs` with assertions for the Blueprint's build command, start command, health path and secret environment-variable declarations:
+
+```js
+import assert from "node:assert/strict";
+import { readFile } from "node:fs/promises";
+
+const config = await readFile(new URL("../render.yaml", import.meta.url), "utf8");
+assert.match(config, /buildCommand: pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm build/);
+assert.match(config, /startCommand: pnpm prisma migrate deploy && pnpm start -- --port \$PORT/);
+assert.match(config, /healthCheckPath: \/api\/health/);
+for (const key of ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL"]) {
+  assert.match(config, new RegExp(`key: ${key}`));
+}
+```
+
+- [ ] **Step 2: Run the deployment-contract test and verify it fails**
+
+Run:
+
+```powershell
+node scripts/render-config.test.mjs
+```
+
+Expected: failure because `render.yaml` does not yet exist.
+
+- [ ] **Step 3: Add the minimal Render Blueprint**
+
+Create `render.yaml` with this exact service configuration:
+
+```yaml
+services:
+  - type: web
+    name: atlas-crm
+    runtime: node
+    plan: free
+    buildCommand: pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm build
+    startCommand: pnpm prisma migrate deploy && pnpm start -- --port $PORT
+    healthCheckPath: /api/health
+    autoDeploy: true
+    envVars:
+      - key: NODE_VERSION
+        value: 24
+      - key: DATABASE_URL
+        sync: false
+      - key: AUTH_SECRET
+        generateValue: true
+      - key: AUTH_URL
+        sync: false
+      - key: MINIO_ENDPOINT
+        sync: false
+      - key: MINIO_PORT
+        sync: false
+      - key: MINIO_ACCESS_KEY
+        sync: false
+      - key: MINIO_SECRET_KEY
+        sync: false
+      - key: MINIO_BUCKET
+        value: atlas-crm
+      - key: MINIO_USE_SSL
+        value: true
+```
+
+- [ ] **Step 4: Document production environment variables and one-time seed command**
+
+Append a `Render + Neon deployment` section to `README.md` explaining:
+
+```markdown
+1. Create a Neon database and copy its pooled TLS connection string into Render as `DATABASE_URL`.
+2. Push this repository to a private GitHub repository, then create a Render Blueprint from `render.yaml`.
+3. After Render assigns `https://<service>.onrender.com`, set `AUTH_URL` to that exact value and redeploy.
+4. Run the one-time seed command in a controlled Render shell or locally against Neon: `pnpm prisma:seed`.
+5. Change the seeded administrator password immediately. Free Render services sleep after inactivity; this is a demo environment, not a high-availability production deployment.
+```
+
+Update `.env.example` comments so local values remain examples and production values are clearly supplied through Render, not committed.
+
+- [ ] **Step 5: Run deployment validation**
+
+Run:
+
+```powershell
+node scripts/render-config.test.mjs
+pnpm prisma:validate
+pnpm build
+```
+
+Expected: the config contract exits 0, Prisma reports the schema valid, and Next.js production build succeeds.
+
+- [ ] **Step 6: Commit the deployment-only changes**
+
+```powershell
+git add render.yaml scripts/render-config.test.mjs .env.example README.md docs/superpowers/specs/2026-07-20-render-neon-deployment-design.md docs/superpowers/plans/2026-07-20-render-neon-deployment.md
+git commit -m "chore: add Render and Neon deployment config"
+```
+
+Expected: commit contains only deployment artifacts. If the shared worktree includes unrelated uncommitted CRM work, create a clean commit only after those changes are separately committed or explicitly staged by the repository owner.
+
+## Self-review
+
+- Spec coverage: Task 1 provides Render configuration, Neon variable setup, public health check, migration-before-start and manual seed procedure.
+- Placeholder scan: no TODO or unspecified command remains.
+- Type consistency: Render invokes the existing package scripts and existing `/api/health` route; no application interfaces change.
diff --git a/.superpowers/sdd/render-deployment-report.md b/.superpowers/sdd/render-deployment-report.md
new file mode 100644
index 0000000..273a667
--- /dev/null
+++ b/.superpowers/sdd/render-deployment-report.md
@@ -0,0 +1,57 @@
+# Render + Neon deployment — Task 1 report
+
+Date: 2026-07-20
+
+## Status
+
+Task 1 is implemented without a commit. Changes are limited to the requested deployment artifacts and documentation:
+
+- Added `render.yaml` with the exact single Render Web Service configuration from the plan.
+- Added `scripts/render-config.test.mjs` with the deployment contract assertions from the plan.
+- Added production-vs-local guidance to `.env.example` without changing its example values.
+- Appended the Render + Neon operator checklist to `README.md`, including Neon pooled TLS setup, exact `AUTH_URL`, one-time seeding, immediate seeded-password rotation, Render free-service sleep behavior, external storage variables, migration-before-start behavior, health checking, and the absence of an always-on free worker.
+
+No production secret was added. No unrelated CRM source file was modified by this task. No files were staged and no commit was created.
+
+## TDD evidence
+
+### RED
+
+The initial literal `node scripts/render-config.test.mjs` attempt could not start because `node` is not on the PowerShell `PATH`. The same test was then run with the workspace-bundled Node 24.14.0 executable before `render.yaml` existed:
+
+```powershell
+& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/render-config.test.mjs
+```
+
+Result: exit code 1 with `ENOENT`, specifically because `C:\Users\Admin\Documents\外贸\render.yaml` did not exist.
+
+### GREEN
+
+After adding the exact Blueprint, the same contract command exited 0 with no assertion output.
+
+## Validation evidence
+
+```powershell
+& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/render-config.test.mjs
+```
+
+Result: exit code 0.
+
+```powershell
+pnpm exec prisma validate
+```
+
+Result: exit code 0; Prisma reported `The schema at prisma\schema.prisma is valid`.
+
+```powershell
+pnpm build
+```
+
+Result: exit code 0; Next.js 16.2.10 compiled successfully, completed TypeScript checking, generated 75 static pages, and listed `/api/health` in the production route manifest.
+
+## Concerns and shared-worktree notes
+
+1. The plan specifies `pnpm prisma:validate`, but `package.json` has no `prisma:validate` script. That literal command was run and exited 1 with `Command "prisma:validate" not found`. Task 1 does not list `package.json` as a modified file, so the package scripts were left unchanged and the equivalent direct Prisma command, `pnpm exec prisma validate`, was used successfully.
+2. `README.md` and `.env.example` already contained uncommitted changes from other work before this task. This task preserved those changes and only appended the Render/Neon section plus two leading environment comments.
+3. The worktree contains many unrelated modified and untracked CRM files. They were not staged, committed, or otherwise altered by this task.
+4. The deployment was validated statically and through a production build; no actual Render service or Neon database was provisioned as part of Task 1.
