# Atlas Foreign-Trade CRM

Atlas CRM is a bilingual, role-aware operating system for international server and hardware trade. The foundation combines customer and transaction data, secure authentication, auditability, exact money calculations, and an operational shell ready for the later sales, procurement, fulfillment, and reporting modules.

## Foundation stack

- Node.js 24, pnpm, Next.js App Router, React and TypeScript
- PostgreSQL 17 with Prisma and fixed-point decimal money
- Auth.js credentials sessions with Argon2id password hashing
- Graphile Worker for PostgreSQL-backed background jobs
- MinIO-compatible object storage
- Vitest, ESLint and strict TypeScript

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

Set `POSTGRES_PASSWORD`, `AUTH_SECRET`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY` outside development.

## Security and architecture notes

- Session cookies are HTTP-only, same-site, secure in production, and limited to eight hours.
- Inactive and locked users cannot authenticate. Every attempt is recorded; successful and failed authentication is audited.
- User and role mutation API foundations enforce server-side RBAC and write audit events in the same transaction.
- Sales ownership scope is enforced separately from permission presence. Purchase-cost and profit access are explicit sensitive permissions.
- Currency amounts, exchange-rate snapshots and profit calculations use decimal-safe fixed-point values.
- Important business records use optimistic versions and soft-delete/cancellation fields where meaningful.
