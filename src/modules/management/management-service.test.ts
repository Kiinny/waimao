import { beforeEach, describe, expect, it, vi } from "vitest";
import Decimal from "decimal.js";

const mocks = vi.hoisted(() => ({
  database: null as unknown,
  writeAudit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ getPrisma: () => mocks.database }));
vi.mock("@/lib/audit", () => ({ writeAudit: mocks.writeAudit }));

import { ManagementService } from "@/modules/management/management-service";

describe("management service review guards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not query or expose unrelated sales totals for an after-sales report", async () => {
    const salesFindMany = vi.fn();
    const ticketFindMany = vi.fn().mockResolvedValue([{
      ticketNumber: "TICKET-1",
      customer: { companyName: "Northstar" },
      issueType: "QUALITY",
      priority: "HIGH",
      status: "OPEN",
      assignedTo: { name: "Grace" },
      costAmount: null,
      costCurrencyCode: null,
      closedAt: null,
    }]);
    mocks.database = {
      salesOrder: { findMany: salesFindMany },
      afterSalesTicket: { findMany: ticketFindMany },
    };

    const report = await new ManagementService().report(
      {
        userId: "ops-1",
        roles: ["OPERATIONS"],
        permissions: ["report.read", "report.after-sales.read"],
      },
      { type: "after-sales" },
    );

    expect(salesFindMany).not.toHaveBeenCalled();
    expect(report.totals).toBeNull();
    expect(report.rows).toHaveLength(1);
  });

  it("rejects a sales representative requesting an unrelated organization report", async () => {
    mocks.database = {};
    await expect(
      new ManagementService().report(
        {
          userId: "sales-1",
          roles: ["SALES_REP"],
          permissions: ["report.read", "report.sales.read"],
        },
        { type: "after-sales" },
      ),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
  });

  it("applies owned scope in a sales representative report query", async () => {
    const salesFindMany = vi.fn().mockResolvedValue([]);
    mocks.database = { salesOrder: { findMany: salesFindMany } };
    await new ManagementService().report(
      {
        userId: "sales-1",
        roles: ["SALES_REP"],
        permissions: ["report.read", "report.sales.read"],
      },
      { type: "sales" },
    );
    expect(salesFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ownerId: "sales-1" }),
      }),
    );
  });

  it("uses an exclusive upper bound after date-only report normalization", async () => {
    const salesFindMany = vi.fn().mockResolvedValue([]);
    mocks.database = { salesOrder: { findMany: salesFindMany } };
    await new ManagementService().report(
      {
        userId: "sales-1",
        roles: ["SALES_REP"],
        permissions: ["report.read", "report.sales.read"],
      },
      { type: "sales", to: new Date("2026-07-21T00:00:00.000Z") },
    );
    expect(salesFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { lt: new Date("2026-07-21T00:00:00.000Z") },
        }),
      }),
    );
  });

  it("converts product line totals to USD using the order exchange-rate snapshot", async () => {
    mocks.database = {
      salesOrder: {
        findMany: vi.fn().mockResolvedValue([{
          orderNumber: "SO-1",
          customer: { companyName: "Northstar", countryCode: "US" },
          owner: { name: "Lina" },
          totalUsd: new Decimal("125"),
          actualCostUsd: new Decimal("0"),
          exchangeRateToUsd: new Decimal("1.25"),
          payments: [],
          refunds: [],
          costs: [],
          items: [{
            quantity: 2,
            lineTotal: new Decimal("100"),
            description: "Server",
            product: { sku: "SRV-1", name: "Server" },
          }],
        }]),
      },
    };

    const report = await new ManagementService().report(
      {
        userId: "analyst-1",
        roles: ["CUSTOM_ANALYST"],
        permissions: ["report.read", "report.products.read"],
      },
      { type: "products" },
    );

    expect(report.rows).toEqual([{
      product: "SRV-1 · Server",
      units: 2,
      salesUsd: "125.0000",
    }]);
  });

  it("does not clear the solution of a resolved ticket", async () => {
    const transaction = {
      afterSalesTicket: {
        findFirst: vi.fn().mockResolvedValue({
          id: "ticket-1",
          status: "RESOLVED",
          solution: "Replace the damaged unit",
          version: 1,
        }),
        updateMany: vi.fn(),
      },
    };
    mocks.database = {
      $transaction: (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    };

    await expect(
      new ManagementService().updateTicket(
        { userId: "support-1", permissions: ["after_sales.update"] },
        "ticket-1",
        { expectedVersion: 1, solution: null },
      ),
    ).rejects.toMatchObject({ code: "TICKET_SOLUTION_REQUIRED", status: 409 });
    expect(transaction.afterSalesTicket.updateMany).not.toHaveBeenCalled();
  });

  it("rejects all business mutations of a closed ticket", async () => {
    const transaction = {
      afterSalesTicket: {
        findFirst: vi.fn().mockResolvedValue({
          id: "ticket-1",
          status: "CLOSED",
          solution: "Replacement delivered",
          version: 2,
        }),
        updateMany: vi.fn(),
      },
    };
    mocks.database = {
      $transaction: (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    };

    await expect(
      new ManagementService().updateTicket(
        { userId: "support-1", permissions: ["after_sales.update"] },
        "ticket-1",
        { expectedVersion: 2, subject: "Changed after closure" },
      ),
    ).rejects.toMatchObject({ code: "TICKET_CLOSED", status: 409 });
    expect(transaction.afterSalesTicket.updateMany).not.toHaveBeenCalled();
  });

  it("redacts all leaves of secret settings in responses", async () => {
    mocks.database = {
      setting: {
        findMany: vi.fn().mockResolvedValue([{
          id: "setting-1",
          namespace: "backup",
          key: "credentials",
          value: { username: "atlas", nested: { credential: "secret" } },
          isSecret: true,
          version: 1,
        }]),
      },
    };

    await expect(
      new ManagementService().listSettings({
        userId: "admin-1",
        roles: ["SUPER_ADMIN"],
        permissions: ["*"],
      }),
    ).resolves.toMatchObject([{
      value: { username: "[REDACTED]", nested: { credential: "[REDACTED]" } },
    }]);
  });

  it("redacts isSecret setting values in activity-log responses", async () => {
    mocks.database = {
      auditLog: {
        findMany: vi.fn().mockResolvedValue([{
          id: "audit-1",
          entityType: "Setting",
          before: { username: "atlas", credential: "old" },
          after: { username: "atlas", credential: "new" },
          metadata: { namespace: "backup", key: "credentials", isSecret: true },
        }]),
      },
    };

    await expect(
      new ManagementService().listActivityLogs({}),
    ).resolves.toMatchObject([{
      before: { username: "[REDACTED]", credential: "[REDACTED]" },
      after: { username: "[REDACTED]", credential: "[REDACTED]" },
    }]);
  });

  it("validates task team assignment against the assignee role", async () => {
    const userFindFirst = vi.fn().mockResolvedValue(null);
    const transaction = { user: { findFirst: userFindFirst } };
    mocks.database = {
      $transaction: (callback: (tx: typeof transaction) => unknown) => callback(transaction),
    };

    await expect(
      new ManagementService().createTask(
        { userId: "manager-1", roles: ["SALES_MANAGER"], permissions: ["task.create"] },
        {
          title: "Team follow-up",
          priority: "NORMAL",
          assigneeId: "11111111-1111-4111-8111-111111111111",
          teamCode: "SALES_REP",
        },
      ),
    ).rejects.toMatchObject({ code: "INVALID_TASK_ASSIGNEE", status: 409 });
    expect(userFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "11111111-1111-4111-8111-111111111111",
        roles: { some: { role: { code: "SALES_REP", deletedAt: null } } },
      }),
    }));
  });
});
