# Render + Neon deployment — Task 1 report

Date: 2026-07-20

## Status

Task 1 is implemented without a commit. Changes are limited to the requested deployment artifacts and documentation:

- Added `render.yaml` with the exact single Render Web Service configuration from the plan.
- Added `scripts/render-config.test.mjs` with the deployment contract assertions from the plan.
- Added production-vs-local guidance to `.env.example` without changing its example values.
- Appended the Render + Neon operator checklist to `README.md`, including Neon pooled TLS setup, exact `AUTH_URL`, one-time seeding, immediate seeded-password rotation, Render free-service sleep behavior, external storage variables, migration-before-start behavior, health checking, and the absence of an always-on free worker.

No production secret was added. No unrelated CRM source file was modified by this task. No files were staged and no commit was created.

## TDD evidence

### RED

The initial literal `node scripts/render-config.test.mjs` attempt could not start because `node` is not on the PowerShell `PATH`. The same test was then run with the workspace-bundled Node 24.14.0 executable before `render.yaml` existed:

```powershell
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/render-config.test.mjs
```

Result: exit code 1 with `ENOENT`, specifically because `C:\Users\Admin\Documents\外贸\render.yaml` did not exist.

### GREEN

After adding the exact Blueprint, the same contract command exited 0 with no assertion output.

## Validation evidence

```powershell
& 'C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/render-config.test.mjs
```

Result: exit code 0.

```powershell
pnpm exec prisma validate
```

Result: exit code 0; Prisma reported `The schema at prisma\schema.prisma is valid`.

```powershell
pnpm build
```

Result: exit code 0; Next.js 16.2.10 compiled successfully, completed TypeScript checking, generated 75 static pages, and listed `/api/health` in the production route manifest.

## Concerns and shared-worktree notes

1. The plan specifies `pnpm prisma:validate`, but `package.json` has no `prisma:validate` script. That literal command was run and exited 1 with `Command "prisma:validate" not found`. Task 1 does not list `package.json` as a modified file, so the package scripts were left unchanged and the equivalent direct Prisma command, `pnpm exec prisma validate`, was used successfully.
2. `README.md` and `.env.example` already contained uncommitted changes from other work before this task. This task preserved those changes and only appended the Render/Neon section plus two leading environment comments.
3. The worktree contains many unrelated modified and untracked CRM files. They were not staged, committed, or otherwise altered by this task.
4. The deployment was validated statically and through a production build; no actual Render service or Neon database was provisioned as part of Task 1.

## Review-finding fixes

Date: 2026-07-20

- Corrected the Render start command to `pnpm start --port $PORT`, removing the extra argument separator that pnpm would forward to Next.js.
- Added `DIRECT_URL` as a distinct unsynchronized Render secret. `prisma.config.ts` now prefers it for Prisma CLI operations and falls back to `DATABASE_URL`, preserving existing local setups.
- Kept application runtime database access unchanged: the web app, worker, and seed script continue to read `DATABASE_URL`.
- Updated `.env.example`, the README, deployment design, and implementation plan to distinguish Neon's pooled runtime URL from its direct migration URL.
- Corrected the free-tier operator procedure: Render free web services do not provide shell/SSH access or one-off jobs. Seeding is documented as a local, post-migration operation with a process-scoped PowerShell environment variable removed in `finally`.
- Expanded `scripts/render-config.test.mjs` to cover the corrected start command, `DIRECT_URL` Blueprint declaration, Prisma local fallback, URL roles, exact seed command, and free-tier limitation language.

### Review TDD evidence

The expanded contract initially failed on the old start command:

```text
AssertionError: input did not match
/startCommand: pnpm prisma migrate deploy && pnpm start --port \$PORT/
```

After the scoped configuration and documentation fixes, the contract exited 0.

### Review validation evidence

With the workspace-bundled Node directory temporarily prepended to `PATH`:

```powershell
node scripts/render-config.test.mjs
pnpm exec prisma validate
pnpm typecheck
pnpm build
```

All commands exited 0. Prisma reported `The schema at prisma\schema.prisma is valid`; TypeScript emitted no errors; Next.js 16.2.10 compiled successfully, generated 75 static pages, and included `/api/health` in the production route manifest.

No files were staged and no commit was created.

## Release-blocker fixes

Date: 2026-07-20

- Changed the Render `MINIO_USE_SSL` value from the YAML boolean `true` to the required quoted string `"true"`.
- Extended `scripts/render-config.test.mjs` so the deployment contract rejects an unquoted SSL value and requires the `SEED_ADMIN_PASSWORD` secret declaration and documented production seed flow.
- Replaced the seed's unconditional known password with `resolveSeedPassword(process.env)`. `ChangeMe123!` is now available only when `NODE_ENV=development`; all other environments require a non-empty `SEED_ADMIN_PASSWORD` and reject the known development default.
- Kept seed behavior reproducible: a given environment password produces the same seeded credentials, while existing deterministic IDs and upsert behavior are unchanged.
- Added `.env.example` and README guidance for the explicit development mode, production-only requirement, Render secret, Docker command, and process-scoped Neon seed command.

### Release-blocker TDD evidence

Before implementation:

- `pnpm exec vitest run prisma/seed-password.test.ts` failed because `prisma/seed-password.ts` did not exist.
- `node scripts/render-config.test.mjs` failed on the quoted-string assertion because the Blueprint contained `value: true`.

After implementation:

- `pnpm exec vitest run prisma/seed-password.test.ts` exited 0 with 4/4 tests passing.
- `node scripts/render-config.test.mjs` exited 0.

### Release-blocker validation evidence

The following fresh checks all exited 0:

```powershell
pnpm exec prisma validate
pnpm typecheck
pnpm build
```

Prisma reported the schema valid, TypeScript emitted no errors, and Next.js 16.2.10 compiled successfully and generated all 75 static pages. No live database seed was attempted because no deployment database or production credential was supplied. No files were staged and no commit was created.
