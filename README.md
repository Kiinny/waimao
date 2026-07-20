# Atlas Foreign-Trade CRM

Atlas CRM is a bilingual, role-aware operating system for international server and hardware trade. The foundation combines customer and transaction data, secure authentication, auditability, exact money calculations, and an operational shell ready for the later sales, procurement, fulfillment, and reporting modules.

## Stack

- Node.js 24, pnpm, Next.js App Router, React and TypeScript
- PostgreSQL 17 with Prisma and fixed-point decimal money
- Auth.js credentials sessions with Argon2id password hashing
- Graphile Worker for PostgreSQL-backed background jobs
- MinIO-compatible object storage
- Vitest, ESLint and strict TypeScript

## Modules

- Sales CRM: leads, customers, contacts, follow-ups, opportunities, products, quotes, orders, payments, refunds and costs
- Procurement and fulfillment: suppliers, purchase orders, inventory, serial tracking, inspections and shipments
- Management: after-sales tickets, personal/team tasks, notifications, permission-scoped reports and exports, settings and redacted activity logs
- Report downloads use UTF-8 CSV. Unsupported spreadsheet/PDF formats are rejected instead of returning mislabeled or incomplete files.
- Platform: Auth.js authentication, RBAC, optimistic concurrency, audit events, Graphile Worker, PostgreSQL, MinIO and bilingual English/Chinese routes

## Project structure

```text
prisma/                  schema, migrations and deterministic seed
scripts/                 operator backup and restore commands
src/app/                 locale pages and API Route Handlers
src/components/          reusable interactive UI
src/modules/             domain rules, services and repositories
src/lib/                 auth, RBAC, audit, HTTP and shared utilities
docs/operations/         deployment and recovery runbooks
```

## Requirements

- Node.js 24 and pnpm 11
- PostgreSQL 17
- MinIO or another S3-compatible service
- PostgreSQL client tools and MinIO `mc` for operator backups

## Local setup

1. Install Node.js 24 and enable pnpm through Corepack.
2. Copy `.env.example` to `.env` and replace `AUTH_SECRET` and storage secrets.
3. Start PostgreSQL 17 and MinIO, or run `docker compose up postgres minio -d`.
4. Install and initialize:

   ```bash
   pnpm install
   pnpm prisma:generate
   pnpm prisma:migrate
   pnpm prisma:seed
   ```

5. Start the web and worker processes in separate terminals:

   ```bash
   pnpm dev
   pnpm worker
   ```

Open [http://localhost:3000](http://localhost:3000). English routes are the default (`/en`); Chinese routes use `/zh`.

## Development accounts

The deterministic seed creates nine users across six roles. The shared development-only password is:

```text
ChangeMe123!
```

| Role | Account |
| --- | --- |
| Super Admin | `admin@atlascrm.dev` |
| Sales Manager | `sales.manager@atlascrm.dev` |
| Sales Representative | `sales.asia@atlascrm.dev`, `sales.emea@atlascrm.dev` |
| Finance | `finance@atlascrm.dev` |
| Procurement | `procurement@atlascrm.dev` |
| Operations | `warehouse@atlascrm.dev`, `logistics@atlascrm.dev`, `support@atlascrm.dev` |

Never reuse the development password in a shared or production environment.
`SEED_ADMIN_PASSWORD` may override it locally and is required outside development.

The deterministic seed creates 20 customers, 40 leads, 20 opportunities, representative transaction/procurement/fulfillment records, 10 after-sales tickets, 20 tasks, six roles, and nine users. Re-running the seed is idempotent.

## Roles

| Role | Scope |
| --- | --- |
| Super Admin | All modules, settings, users, roles and activity logs |
| Sales Manager | Team-wide sales, tasks and commercial reports |
| Sales Representative | Owned sales accounts, transactions and personal tasks |
| Finance | Payments, refunds, receivables, purchasing cost and profit reports |
| Procurement | Suppliers, purchasing and related inventory/tasks |
| Operations | Inventory, quality, logistics, after-sales and related tasks |

Reports apply ownership scope on the server. Purchase-cost, supplier-bank and profit values require their explicit sensitive permissions.

## Commands

```bash
pnpm test              # full Vitest suite
pnpm typecheck         # strict TypeScript
pnpm lint              # ESLint
pnpm build             # production Next.js build
pnpm prisma:generate   # generate the typed client
pnpm prisma:migrate    # create/apply development migrations
pnpm prisma:seed       # deterministic roles, users and foundation data
```

## Docker

`docker compose up --build` starts:

- `web` on port 3000 with an API/database health check
- `worker` for Graphile Worker jobs
- `postgres` 17 with durable storage and `pg_isready`
- `minio` on ports 9000/9001 with durable storage and health checks

Set `POSTGRES_PASSWORD`, `AUTH_SECRET`, `SEED_ADMIN_PASSWORD`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY` outside development.

For a deployment, copy `.env.example`, replace every secret, then run:

```bash
docker compose config
docker compose up --build -d
docker compose ps
```

Apply migrations and seed only from an authorized release process:

```bash
docker compose exec web pnpm prisma migrate deploy
docker compose exec -e NODE_ENV=production -e SEED_ADMIN_PASSWORD web pnpm prisma:seed
```

## Database and worker

Prisma migrations in `prisma/migrations` are the database source of truth. Use `pnpm prisma:migrate` only for local development and `pnpm prisma migrate deploy` in deployments. The worker runs the idempotent `generate_management_reminders` task every 15 minutes by default; `WORKER_CRONTAB` can override the schedule, and Graphile Worker retries failures up to the configured task limit.

## Backup and restore

Set the database and MinIO environment variables, then run `.\scripts\backup.ps1`. Backups default to `.\backups` with 30-day retention, remove incomplete runs, and record SHA-256 artifact integrity in the completed manifest. Restores validate that manifest before the first destructive action and require the explicit confirmation switch:

```powershell
.\scripts\restore.ps1 -BackupPath .\backups\<timestamp> -ConfirmRestore
```

The full procedure and quarterly restore drill are in [docs/operations/backup-restore.md](docs/operations/backup-restore.md).

## Troubleshooting

- `DATABASE_URL is required`: ensure `.env` exists and the command is launched from the project directory.
- Authentication loops: verify `AUTH_SECRET`, the public application URL and user status, then check login-attempt audit records.
- Prisma client/type mismatch: run `pnpm prisma:generate` after every schema change.
- Worker creates no reminders: confirm the worker process, `WORKER_CRONTAB`, Graphile Worker schema access and eligible due records.
- MinIO attachments fail: verify endpoint reachability, credentials, bucket name and clock synchronization.
- Migration fails: do not edit an applied migration; restore from backup or correct the forward migration and rerun deployment.
- Build fails after a clean checkout: use Node.js 24, enable Corepack, run `pnpm install --frozen-lockfile`, then regenerate Prisma.

## Security and architecture notes

- Session cookies are HTTP-only, same-site, secure in production, and limited to eight hours.
- Inactive and locked users cannot authenticate. Every attempt is recorded; successful and failed authentication is audited.
- User and role mutation API foundations enforce server-side RBAC and write audit events in the same transaction.
- Sales ownership scope is enforced separately from permission presence. Purchase-cost and profit access are explicit sensitive permissions.
- Currency amounts, exchange-rate snapshots and profit calculations use decimal-safe fixed-point values.
- Important business records use optimistic versions and soft-delete/cancellation fields where meaningful.

## Render + Neon deployment

1. Create a Neon database. In Render, set `DATABASE_URL` to Neon's pooled TLS connection string and set the distinct `DIRECT_URL` secret to Neon's direct TLS connection string. The web runtime uses only `DATABASE_URL`; Prisma migration commands prefer `DIRECT_URL`.
2. Push this repository to a private GitHub repository, then create a Render Blueprint from `render.yaml`.
3. After Render assigns `https://<service>.onrender.com`, set `AUTH_URL` to that exact value and redeploy.
4. Wait for the deploy log to confirm `prisma migrate deploy` completed. Render free web services do not provide shell/SSH access or one-off jobs, so run the one-time seed locally from this repository against Neon:

   ```powershell
   $env:NODE_ENV = "production"
   $env:DATABASE_URL = "<Neon pooled TLS URL>"
   $env:SEED_ADMIN_PASSWORD = "<unique deployment seed password>"
   try { pnpm prisma:seed } finally {
     Remove-Item Env:NODE_ENV, Env:DATABASE_URL, Env:SEED_ADMIN_PASSWORD
   }
   ```

   These process-scoped values are removed even if the seed fails. Do not paste either secret into a tracked file. `SEED_ADMIN_PASSWORD` is required outside development and must be unique to this deployment; the seed rejects the documented development password.
5. Store the deployment-specific seed password securely and rotate the administrator password after initial access. Free Render services sleep after inactivity; this is a demo environment, not a high-availability production deployment.

Render generates `AUTH_SECRET`. Supply `DATABASE_URL`, `DIRECT_URL`, `AUTH_URL`, `SEED_ADMIN_PASSWORD`, and any external object-storage values (`MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY`) in Render's environment settings; do not commit them. The Blueprint applies Prisma migrations through the direct connection before starting the public service on Render's `PORT` and monitors `/api/health`. It does not deploy the Graphile Worker as an always-on free service.
