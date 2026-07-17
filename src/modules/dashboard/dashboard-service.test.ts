import { describe, expect, it } from "vitest";

import {
  dashboardKpis,
  loadDashboard,
  type DashboardRepository,
  type DashboardSnapshot,
} from "@/modules/dashboard/dashboard-service";
import type { AuthorizationContext } from "@/lib/rbac";

const snapshot: DashboardSnapshot = {
  activeCustomers: 2,
  openLeads: 5,
  pipelineValueUsd: "250000.00",
  weightedForecastUsd: "112500.00",
  openQuotes: 3,
  activeOrders: 4,
  dueTasks: 1,
  recentCustomers: [],
  salesFunnel: [],
  monthlyOrderTrend: [],
  leadSources: [],
  upcomingFollowUps: [],
  recentLeads: [],
  recentOrders: [],
  risks: {
    overdueFollowUps: 2,
    highRiskCustomers: 1,
    staleOpportunities: 3,
  },
};

describe("dashboard service", () => {
  it("passes the complete authorization context to the repository", async () => {
    const contexts: AuthorizationContext[] = [];
    const repository: DashboardRepository = {
      loadSnapshot: async (context) => {
        contexts.push(context);
        return snapshot;
      },
    };
    const context: AuthorizationContext = {
      userId: "sales-1",
      roles: ["SALES_REP"],
      permissions: ["dashboard.read", "customer.read"],
    };

    await expect(loadDashboard(repository, context)).resolves.toBe(snapshot);
    expect(contexts).toEqual([context]);
  });

  it("requires dashboard.read before calling the repository", async () => {
    let called = false;
    const repository: DashboardRepository = {
      loadSnapshot: async () => {
        called = true;
        return snapshot;
      },
    };

    await expect(
      loadDashboard(repository, {
        userId: "sales-1",
        roles: ["SALES_REP"],
        permissions: ["customer.read"],
      }),
    ).rejects.toThrow(/dashboard\.read/);
    expect(called).toBe(false);
  });

  it("rejects a role outside the explicit dashboard domains", async () => {
    const repository: DashboardRepository = {
      loadSnapshot: async () => snapshot,
    };
    await expect(
      loadDashboard(repository, {
        userId: "custom-1",
        roles: ["CUSTOM"],
        permissions: ["dashboard.read"],
      }),
    ).rejects.toThrow(/dashboard/i);
  });
});

describe("dashboard KPI selection", () => {
  it("does not expose KPI values without dashboard.read", () => {
    expect(() =>
      dashboardKpis(
        {
          userId: "sales-1",
          roles: ["SALES_REP"],
          permissions: ["customer.read"],
        },
        snapshot,
      ),
    ).toThrowError(/dashboard\.read/);
  });

  it("shows sales pipeline KPIs to sales roles", () => {
    expect(
      dashboardKpis(
        {
          userId: "sales-1",
          roles: ["SALES_REP"],
          permissions: ["dashboard.read"],
        },
        snapshot,
      ),
    ).toEqual([
      ["activeCustomers", 2],
      ["openLeads", 5],
      ["pipelineValueUsd", "250000.00"],
      ["weightedForecastUsd", "112500.00"],
    ]);
  });

  it("keeps operational KPIs for non-sales roles", () => {
    expect(
      dashboardKpis(
        {
          userId: "ops-1",
          roles: ["OPERATIONS"],
          permissions: ["dashboard.read"],
        },
        snapshot,
      ),
    ).toEqual([
      ["activeOrders", 4],
      ["dueTasks", 1],
    ]);
  });
});
