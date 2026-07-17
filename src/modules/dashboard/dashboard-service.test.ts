import { describe, expect, it } from "vitest";

import {
  loadDashboard,
  type DashboardRepository,
  type DashboardSnapshot,
} from "@/modules/dashboard/dashboard-service";
import type { AuthorizationContext } from "@/lib/rbac";

const snapshot: DashboardSnapshot = {
  activeCustomers: 2,
  openQuotes: 3,
  activeOrders: 4,
  dueTasks: 1,
  recentCustomers: [],
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
});
