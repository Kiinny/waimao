import { describe, expect, it } from "vitest";

import {
  allowedReportTypes,
  assertReportAccess,
  buildReportRows,
  groupReportRows,
  reportExportQuery,
  reportScope,
  toCsv,
} from "@/modules/management/reporting";

describe("reporting", () => {
  it("limits sales representatives to owned rows and grants managers team scope", () => {
    expect(
      reportScope({ userId: "sales-1", roles: ["SALES_REP"], permissions: ["report.read"] }),
    ).toEqual({ ownerId: "sales-1" });
    expect(
      reportScope({ userId: "manager-1", roles: ["SALES_MANAGER"], permissions: ["report.read"] }),
    ).toEqual({});
  });

  it("allows each role only its relevant report types", () => {
    const sales = {
      userId: "sales-1",
      roles: ["SALES_REP"],
      permissions: ["report.read", "report.sales.read"],
    };
    const operations = {
      userId: "ops-1",
      roles: ["OPERATIONS"],
      permissions: ["report.read", "report.logistics.read", "report.after-sales.read"],
    };
    expect(allowedReportTypes(sales)).toContain("sales");
    expect(allowedReportTypes(sales)).not.toContain("after-sales");
    expect(allowedReportTypes(operations)).toEqual(["logistics", "after-sales"]);
    expect(() => assertReportAccess(sales, "after-sales")).toThrowError(
      expect.objectContaining({ code: "PERMISSION_DENIED", status: 403 }),
    );
  });

  it("requires a per-type permission and supports custom roles by permission", () => {
    expect(
      allowedReportTypes({
        userId: "manager-1",
        roles: ["SALES_MANAGER"],
        permissions: ["report.read"],
      }),
    ).toEqual([]);
    expect(
      allowedReportTypes({
        userId: "analyst-1",
        roles: ["CUSTOM_ANALYST"],
        permissions: ["report.read", "report.products.read"],
      }),
    ).toEqual(["products"]);
  });

  it("preserves active report date filters in export queries", () => {
    expect(
      reportExportQuery({
        type: "sales",
        from: "2026-07-01",
        to: "2026-07-20",
        format: "csv",
      }).toString(),
    ).toBe("type=sales&format=csv&from=2026-07-01&to=2026-07-20");
  });

  it("calculates collection, receivable, and profit without exposing profit permissionlessly", () => {
    const rows = buildReportRows(
      [{
        orderNumber: "SO-1",
        customer: "Northstar",
        owner: "Lina",
        market: "US",
        totalUsd: "100.00",
        collectedUsd: "40.00",
        costUsd: "55.00",
      }],
      { userId: "sales-1", roles: ["SALES_REP"], permissions: ["report.read"] },
    );
    expect(rows[0]).toMatchObject({
      orderNumber: "SO-1",
      collectionUsd: "40.0000",
      receivableUsd: "60.0000",
    });
    expect(rows[0]).not.toHaveProperty("profitUsd");
  });

  it("produces escaped UTF-8-safe CSV", () => {
    expect(toCsv([{ customer: "Northstar, Inc.", salesUsd: "100.0000" }])).toBe(
      'customer,salesUsd\r\n"Northstar, Inc.",100.0000',
    );
    expect(toCsv([{ customer: "深圳客户", salesUsd: "100.0000" }])).toContain("深圳客户");
  });

  it("groups report rows by customer, market, or representative with decimal totals", () => {
    expect(
      groupReportRows(
        [
          { customer: "Northstar", salesUsd: "100.0000", collectionUsd: "40.0000", receivableUsd: "60.0000" },
          { customer: "Northstar", salesUsd: "50.0000", collectionUsd: "50.0000", receivableUsd: "0.0000" },
        ],
        "customer",
      ),
    ).toEqual([
      {
        customer: "Northstar",
        orders: 2,
        salesUsd: "150.0000",
        collectionUsd: "90.0000",
        receivableUsd: "60.0000",
      },
    ]);
  });
});
