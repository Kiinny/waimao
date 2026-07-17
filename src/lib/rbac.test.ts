import { describe, expect, it } from "vitest";

import {
  can,
  requirePermission,
  type AuthorizationContext,
} from "@/lib/rbac";

const salesRep: AuthorizationContext = {
  userId: "sales-1",
  permissions: ["customer.read", "customer.update"],
};

describe("RBAC", () => {
  it("grants a listed global permission", () => {
    expect(can(salesRep, "customer.read")).toBe(true);
  });

  it("denies an unlisted permission", () => {
    expect(can(salesRep, "customer.delete")).toBe(false);
  });

  it("enforces ownership for scoped access", () => {
    expect(can(salesRep, "customer.update", { ownerId: "sales-1" })).toBe(true);
    expect(can(salesRep, "customer.update", { ownerId: "sales-2" })).toBe(false);
  });

  it("allows a sales manager to act across owned sales records", () => {
    expect(
      can(
        {
          userId: "manager-1",
          roles: ["SALES_MANAGER"],
          permissions: ["quote.update"],
        },
        "quote.update",
        { ownerId: "sales-1" },
      ),
    ).toBe(true);
  });

  it.each(["purchase.cost.read", "finance.profit.read"] as const)(
    "does not infer the sensitive %s permission",
    (permission) => {
      expect(can(salesRep, permission)).toBe(false);
    },
  );

  it("permits an explicit sensitive permission", () => {
    expect(
      can(
        { userId: "finance-1", permissions: ["finance.profit.read"] },
        "finance.profit.read",
      ),
    ).toBe(true);
  });

  it("throws a domain authorization error when permission is missing", () => {
    expect(() => requirePermission(salesRep, "role.update")).toThrow(
      "Permission denied: role.update",
    );
  });
});
