import { beforeAll, describe, expect, it } from "vitest";

import {
  authenticateCredentials,
  type AuthRepository,
  type LoginIdentity,
} from "@/modules/auth/authenticate";
import { hashPassword } from "@/lib/password";

let passwordHash: string;

beforeAll(async () => {
  passwordHash = await hashPassword("ChangeMe123!");
});

function repositoryFor(user: LoginIdentity | null) {
  const attempts: Array<{ success: boolean; reason?: string }> = [];
  const audits: string[] = [];
  let lastLoginUpdated = false;

  const repository: AuthRepository = {
    findByEmail: async () => user,
    recordAttempt: async (attempt) => {
      attempts.push({ success: attempt.success, reason: attempt.reason });
    },
    writeAudit: async (action) => {
      audits.push(action);
    },
    updateLastLogin: async () => {
      lastLoginUpdated = true;
    },
  };

  return {
    repository,
    attempts,
    audits,
    wasLastLoginUpdated: () => lastLoginUpdated,
  };
}

const activeUser = (): LoginIdentity => ({
  id: "user-1",
  email: "admin@atlascrm.dev",
  name: "Ada Admin",
  passwordHash,
  status: "ACTIVE",
  roles: ["SUPER_ADMIN"],
  permissions: ["*"],
});

describe("credential authentication", () => {
  it("returns a safe identity and records a successful login", async () => {
    const state = repositoryFor(activeUser());

    const result = await authenticateCredentials(state.repository, {
      email: "ADMIN@atlascrm.dev ",
      password: "ChangeMe123!",
      ipAddress: "127.0.0.1",
    });

    expect(result).toEqual({
      id: "user-1",
      email: "admin@atlascrm.dev",
      name: "Ada Admin",
      roles: ["SUPER_ADMIN"],
      permissions: ["*"],
    });
    expect(state.attempts).toEqual([{ success: true, reason: undefined }]);
    expect(state.audits).toEqual(["auth.login.success"]);
    expect(state.wasLastLoginUpdated()).toBe(true);
  });

  it("returns null and records an invalid password", async () => {
    const state = repositoryFor(activeUser());

    const result = await authenticateCredentials(state.repository, {
      email: "admin@atlascrm.dev",
      password: "wrong",
    });

    expect(result).toBeNull();
    expect(state.attempts).toEqual([
      { success: false, reason: "INVALID_CREDENTIALS" },
    ]);
    expect(state.audits).toEqual(["auth.login.failure"]);
  });

  it("blocks inactive users and records the reason", async () => {
    const state = repositoryFor({ ...activeUser(), status: "INACTIVE" });

    const result = await authenticateCredentials(state.repository, {
      email: "admin@atlascrm.dev",
      password: "ChangeMe123!",
    });

    expect(result).toBeNull();
    expect(state.attempts).toEqual([
      { success: false, reason: "USER_INACTIVE" },
    ]);
    expect(state.audits).toEqual(["auth.login.failure"]);
  });
});
