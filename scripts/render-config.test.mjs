import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const config = await readFile(new URL("../render.yaml", import.meta.url), "utf8");
const prismaConfig = await readFile(new URL("../prisma.config.ts", import.meta.url), "utf8");
const seed = await readFile(new URL("../prisma/seed.ts", import.meta.url), "utf8");
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
assert.match(
  config,
  /- key: MINIO_USE_SSL\s+value: "true"/,
  "MINIO_USE_SSL must be a quoted string in the Render Blueprint",
);
assert.match(config, /- key: SEED_ADMIN_PASSWORD\s+sync: false/);

assert.match(prismaConfig, /url: process\.env\.DIRECT_URL \?\? env\("DATABASE_URL"\)/);
assert.match(seed, /resolveSeedPassword\(process\.env\)/);
assert.match(readme, /DATABASE_URL.*pooled TLS connection string/);
assert.match(readme, /DIRECT_URL.*direct TLS connection string/);
assert.match(
  readme,
  /\$env:NODE_ENV = "production"\s+\$env:DATABASE_URL = "<Neon pooled TLS URL>"\s+\$env:SEED_ADMIN_PASSWORD = "<unique deployment seed password>"/,
);
assert.match(readme, /SEED_ADMIN_PASSWORD.*required outside development/i);
assert.match(readme, /free web services do not provide shell\/SSH access or one-off jobs/i);
assert.match(plan, /pnpm start --port \$PORT/);
assert.match(plan, /DIRECT_URL/);
assert.match(plan, /free web services do not provide shell\/SSH access or one-off jobs/i);
