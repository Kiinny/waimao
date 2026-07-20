import { describe, expect, it } from "vitest";

import {
  DEVELOPMENT_SEED_PASSWORD,
  resolveSeedPassword,
} from "./seed-password";

describe("resolveSeedPassword", () => {
  it("uses the explicit local fallback only in development", () => {
    expect(resolveSeedPassword({ NODE_ENV: "development" })).toBe(
      DEVELOPMENT_SEED_PASSWORD,
    );
  });

  it("uses the deployment-specific password outside development", () => {
    expect(
      resolveSeedPassword({
        NODE_ENV: "production",
        SEED_ADMIN_PASSWORD: "production-specific-secret",
      }),
    ).toBe("production-specific-secret");
  });

  it("requires a deployment-specific password outside development", () => {
    expect(() => resolveSeedPassword({ NODE_ENV: "production" })).toThrow(
      "SEED_ADMIN_PASSWORD is required outside development",
    );
    expect(() =>
      resolveSeedPassword({
        NODE_ENV: "test",
        SEED_ADMIN_PASSWORD: "   ",
      }),
    ).toThrow("SEED_ADMIN_PASSWORD is required outside development");
  });

  it("rejects the known development password outside development", () => {
    expect(() =>
      resolveSeedPassword({
        NODE_ENV: "production",
        SEED_ADMIN_PASSWORD: DEVELOPMENT_SEED_PASSWORD,
      }),
    ).toThrow("must not use the development default");
  });
});
