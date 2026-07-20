# Render + Neon Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the CRM deployable as a Render Web Service backed by a Neon PostgreSQL database, without committing production secrets.

**Architecture:** A Render Blueprint defines one public Node Web Service. Render builds Prisma Client and Next.js, then applies migrations through Neon's direct connection before serving on Render's `PORT` with the pooled runtime connection. Render holds all secrets.

**Tech Stack:** Render Blueprint, Node.js 24, pnpm 11, Next.js 16, Prisma 7, PostgreSQL/Neon.

## Global Constraints

- Never commit `DATABASE_URL`, `AUTH_SECRET`, or storage credentials.
- Set `DATABASE_URL` to Neon's pooled TLS URL and the distinct `DIRECT_URL` secret to Neon's direct TLS URL.
- `AUTH_URL` must exactly equal the Render HTTPS service URL.
- Prisma migrations run before `next start`; seed data is a manual one-time local action after migrations because Render free web services do not provide shell/SSH access or one-off jobs.
- Render free services can sleep; background Graphile Worker work is not deployed as an always-on free service.
- The deployment must bind the public HTTP server to Render's `PORT` and expose `/api/health`.

---

### Task 1: Render deployment artifacts and operator instructions

**Files:**
- Create: `render.yaml`
- Create: `scripts/render-config.test.mjs`
- Modify: `prisma.config.ts`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-07-20-render-neon-deployment-design.md`
- Test: deployment configuration/documentation contract, Prisma validation, typecheck, and production build

**Interfaces:**
- Consumes: `package.json` scripts `build`, `start`, `prisma:generate`; `/api/health` route.
- Produces: a Render Blueprint with environment variable names, build/start commands, and a documented Neon + Render deployment checklist.

- [ ] **Step 1: Write a failing deployment-contract test**

Create `scripts/render-config.test.mjs` with assertions for the Blueprint's build command, start command, health path and secret environment-variable declarations:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const config = await readFile(new URL("../render.yaml", import.meta.url), "utf8");
const prismaConfig = await readFile(new URL("../prisma.config.ts", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const plan = await readFile(
  new URL("../docs/superpowers/plans/2026-07-20-render-neon-deployment.md", import.meta.url),
  "utf8",
);

assert.match(config, /buildCommand: pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm build/);
assert.match(config, /startCommand: pnpm prisma migrate deploy && pnpm start --port \$PORT/);
assert.match(config, /healthCheckPath: \/api\/health/);
for (const key of ["DATABASE_URL", "DIRECT_URL", "AUTH_SECRET", "AUTH_URL"]) {
  assert.match(config, new RegExp(`key: ${key}`));
}

assert.match(prismaConfig, /url: process\.env\.DIRECT_URL \?\? env\("DATABASE_URL"\)/);
assert.match(readme, /DATABASE_URL.*pooled TLS connection string/);
assert.match(readme, /DIRECT_URL.*direct TLS connection string/);
assert.match(
  readme,
  /\$env:DATABASE_URL = "<Neon pooled TLS URL>"\s+try \{ pnpm prisma:seed \} finally \{ Remove-Item Env:DATABASE_URL \}/,
);
assert.match(readme, /free web services do not provide shell\/SSH access or one-off jobs/i);
assert.match(plan, /pnpm start --port \$PORT/);
assert.match(plan, /DIRECT_URL/);
assert.match(plan, /free web services do not provide shell\/SSH access or one-off jobs/i);
```

- [ ] **Step 2: Run the deployment-contract test and verify it fails**

Run:

```powershell
node scripts/render-config.test.mjs
```

Expected: failure because `render.yaml` does not yet exist.

- [ ] **Step 3: Add the minimal Render Blueprint**

Create `render.yaml` with this exact service configuration:

```yaml
services:
  - type: web
    name: atlas-crm
    runtime: node
    plan: free
    buildCommand: pnpm install --frozen-lockfile && pnpm prisma:generate && pnpm build
    startCommand: pnpm prisma migrate deploy && pnpm start --port $PORT
    healthCheckPath: /api/health
    autoDeploy: true
    envVars:
      - key: NODE_VERSION
        value: 24
      - key: DATABASE_URL
        sync: false
      - key: DIRECT_URL
        sync: false
      - key: AUTH_SECRET
        generateValue: true
      - key: AUTH_URL
        sync: false
      - key: MINIO_ENDPOINT
        sync: false
      - key: MINIO_PORT
        sync: false
      - key: MINIO_ACCESS_KEY
        sync: false
      - key: MINIO_SECRET_KEY
        sync: false
      - key: MINIO_BUCKET
        value: atlas-crm
      - key: MINIO_USE_SSL
        value: true
```

- [ ] **Step 4: Configure the direct Prisma CLI connection**

Set the Prisma CLI datasource to `process.env.DIRECT_URL ?? env("DATABASE_URL")`. This directs Render migrations to Neon's direct endpoint without changing application runtime code and preserves local setups that only define `DATABASE_URL`.

- [ ] **Step 5: Document production environment variables and one-time seed command**

Append a `Render + Neon deployment` section to `README.md` explaining:

```markdown
1. Create a Neon database. Set Render `DATABASE_URL` to its pooled TLS connection string and the distinct `DIRECT_URL` secret to its direct TLS connection string.
2. Push this repository to a private GitHub repository, then create a Render Blueprint from `render.yaml`.
3. After Render assigns `https://<service>.onrender.com`, set `AUTH_URL` to that exact value and redeploy.
4. Wait for migrations to complete, then seed from a trusted local checkout because Render free web services do not provide shell/SSH access or one-off jobs:

   ```powershell
   $env:DATABASE_URL = "<Neon pooled TLS URL>"
   try { pnpm prisma:seed } finally { Remove-Item Env:DATABASE_URL }
   ```
5. Change the seeded administrator password immediately. Free Render services sleep after inactivity; this is a demo environment, not a high-availability production deployment.
```

Update `.env.example` comments so local values remain examples and production values are clearly supplied through Render, not committed.

- [ ] **Step 6: Run deployment validation**

Run:

```powershell
node scripts/render-config.test.mjs
pnpm exec prisma validate
pnpm typecheck
pnpm build
```

Expected: the config contract exits 0, Prisma reports the schema valid, and Next.js production build succeeds.

- [ ] **Step 7: Commit the deployment-only changes**

```powershell
git add render.yaml scripts/render-config.test.mjs prisma.config.ts .env.example README.md docs/superpowers/specs/2026-07-20-render-neon-deployment-design.md docs/superpowers/plans/2026-07-20-render-neon-deployment.md
git commit -m "chore: add Render and Neon deployment config"
```

Expected: commit contains only deployment artifacts. If the shared worktree includes unrelated uncommitted CRM work, create a clean commit only after those changes are separately committed or explicitly staged by the repository owner.

## Self-review

- Spec coverage: Task 1 provides Render configuration, Neon variable setup, public health check, migration-before-start and manual seed procedure.
- Placeholder scan: no TODO or unspecified command remains.
- Type consistency: Render invokes the existing package scripts and existing `/api/health` route; no application interfaces change.
