import { describe, expect, it } from "vitest";

import { dashboardOwnershipFilter } from "@/modules/dashboard/dashboard-scope";

describe("dashboard ownership scope", () => {
  it("limits Sales Representative metrics and identities to owned records", () => {
    expect(
      dashboardOwnershipFilter({
        userId: "sales-1",
        roles: ["SALES_REP"],
        permissions: ["dashboard.read"],
      }),
    ).toEqual({ ownerId: "sales-1" });
  });

  it("keeps Sales Manager metrics broad", () => {
    expect(
      dashboardOwnershipFilter({
        userId: "manager-1",
        roles: ["SALES_MANAGER"],
        permissions: ["dashboard.read"],
      }),
    ).toEqual({});
  });

  it("keeps wildcard administrator metrics broad", () => {
    expect(
      dashboardOwnershipFilter({
        userId: "admin-1",
        roles: ["SUPER_ADMIN"],
        permissions: ["*"],
      }),
    ).toEqual({});
  });
});
