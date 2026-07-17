import { describe, expect, it } from "vitest";

import { dashboardOwnershipFilter } from "@/modules/dashboard/dashboard-scope";
import { dashboardAccessScope } from "@/modules/dashboard/dashboard-scope";

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

  it("assigns representatives to the owned sales domain", () => {
    expect(
      dashboardAccessScope({
        userId: "sales-1",
        roles: ["SALES_REP"],
        permissions: ["dashboard.read"],
      }),
    ).toEqual({ domain: "sales", ownerId: "sales-1" });
  });

  it("keeps Sales Manager metrics broad", () => {
    expect(
      dashboardOwnershipFilter({
        userId: "manager-1",
        roles: ["SALES_MANAGER"],
        permissions: ["dashboard.read"],
      }),
    ).toEqual({});
    expect(
      dashboardAccessScope({
        userId: "manager-1",
        roles: ["SALES_MANAGER"],
        permissions: ["dashboard.read"],
      }),
    ).toEqual({ domain: "sales" });
  });

  it("keeps wildcard administrator metrics broad", () => {
    expect(
      dashboardOwnershipFilter({
        userId: "admin-1",
        roles: ["SUPER_ADMIN"],
        permissions: ["*"],
      }),
    ).toEqual({});
    expect(
      dashboardAccessScope({
        userId: "admin-1",
        roles: ["SUPER_ADMIN"],
        permissions: ["*"],
      }),
    ).toEqual({ domain: "sales" });
  });

  it("assigns operational roles to a non-sales domain", () => {
    expect(
      dashboardAccessScope({
        userId: "ops-1",
        roles: ["OPERATIONS"],
        permissions: ["dashboard.read"],
      }),
    ).toEqual({ domain: "operations" });
  });

  it("rejects roles outside the explicit dashboard domains", () => {
    expect(() =>
      dashboardAccessScope({
        userId: "custom-1",
        roles: ["CUSTOM"],
        permissions: ["dashboard.read"],
      }),
    ).toThrowError(/dashboard/i);
  });
});
