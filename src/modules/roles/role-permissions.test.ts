import { describe, expect, it } from "vitest";

import { resolvePermissionIds } from "@/modules/roles/role-permissions";

const available = [
  { id: "permission-1", code: "user.read" },
  { id: "permission-2", code: "role.read" },
];

describe("role permission validation", () => {
  it("resolves each known permission exactly once", () => {
    expect(
      resolvePermissionIds(["role.read", "user.read"], available),
    ).toEqual(["permission-2", "permission-1"]);
  });

  it("rejects duplicate permission codes with structured details", () => {
    expect(() =>
      resolvePermissionIds(["user.read", "user.read"], available),
    ).toThrowError(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        status: 400,
        details: { duplicatePermissions: ["user.read"] },
      }),
    );
  });

  it("rejects unknown permission codes with structured details", () => {
    expect(() =>
      resolvePermissionIds(["user.read", "finance.secret"], available),
    ).toThrowError(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        status: 400,
        details: { unknownPermissions: ["finance.secret"] },
      }),
    );
  });
});
