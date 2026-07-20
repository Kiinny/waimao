# Render + Neon Deployment Design

## Goal

Publish the CRM as a public, low-cost demonstration environment using a Render Web Service and Neon PostgreSQL. The deployment must preserve the existing Next.js server-rendered application, Prisma database access, Auth.js sessions, and database-backed management reminder behavior.

## Architecture

- GitHub private repository is the deployment source.
- Render runs one Node Web Service from the repository.
- Neon provides a pooled PostgreSQL `DATABASE_URL` for the web runtime and a distinct direct `DIRECT_URL` for Prisma migrations.
- Render supplies the public HTTPS URL; `AUTH_URL` exactly matches it.
- Render performs `prisma migrate deploy` before starting the Next.js server.
- Seed data is run once from a trusted local checkout against Neon after migrations complete, never on every restart. Render free web services do not provide shell/SSH access or one-off jobs.

## Runtime behavior

- Build command: install locked dependencies, generate Prisma Client, then build Next.js.
- Start command: apply pending Prisma migrations through `DIRECT_URL`, then run `next start` bound to Render's `PORT` via `pnpm start --port $PORT`.
- Health check: `/api/health`.
- The Graphile Worker is not deployed as an always-on free Render service. Reminder generation is deferred to a protected HTTP endpoint scheduled externally, or runs manually for the demo environment. The database schema and worker code remain intact for a later paid worker deployment.

## Security and configuration

- All secrets are configured in Render, never committed: pooled `DATABASE_URL`, direct `DIRECT_URL`, a fresh `AUTH_SECRET`, `AUTH_URL`, and object-storage credentials.
- Both Neon connection strings require TLS. Application runtime code continues to read only the pooled `DATABASE_URL`; Prisma CLI uses `DIRECT_URL`, with a `DATABASE_URL` fallback for local development.
- Production seed passwords are not used. After first seed, the administrator password is changed immediately.
- The initial deployment has no public file upload backing store. Existing file metadata remains supported; production uploads require an S3-compatible provider such as Cloudflare R2 and its Render environment variables.

## Free-tier limits and acceptance criteria

- Render's free service sleeps after inactivity; cold starts are expected.
- Neon free storage and compute limits are appropriate only for a small demo dataset.
- The site is successful when the Render URL loads, login redirects to the same public URL, migrations are current, and seeded admin login works.
- A custom domain, always-on worker, automated backups, and robust object uploads are explicitly deferred to a paid or self-hosted environment.
