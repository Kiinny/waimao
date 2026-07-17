import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";

import { redactFinancialFields } from "@/modules/finance/field-redaction";

describe("transaction field-level security", () => {
  const order = {
    id: "order-1",
    totalUsd: "1000",
    revenueUsd: "1000",
    estimatedCostUsd: "700",
    actualCostUsd: "710",
    grossProfitUsd: "290",
    grossMarginPercent: "29",
    netProfitEstimateUsd: "270",
    items: [
      {
        description: "GPU server",
        estimatedCostUsd: "700",
        unitPrice: "1000",
      },
    ],
  };

  it("removes all sensitive cost and profit fields without explicit permissions", () => {
    expect(
      redactFinancialFields(order, {
        userId: "sales-1",
        roles: ["SALES_REP"],
        permissions: ["order.read"],
      }),
    ).toEqual({
      id: "order-1",
      totalUsd: "1000",
      revenueUsd: "1000",
      items: [{ description: "GPU server", unitPrice: "1000" }],
    });
  });

  it("preserves sensitive fields for finance readers", () => {
    expect(
      redactFinancialFields(order, {
        userId: "finance-1",
        roles: ["FINANCE"],
        permissions: ["order.read", "purchase.cost.read", "finance.profit.read"],
      }),
    ).toEqual(order);
  });

  it("preserves Decimal value objects while traversing records", () => {
    const total = new Decimal("123.45");
    const result = redactFinancialFields(
      { total, estimatedCostUsd: new Decimal("80") },
      {
        userId: "sales-1",
        roles: ["SALES_REP"],
        permissions: ["order.read"],
      },
    );

    expect(result.total).toBe(total);
    expect(result).not.toHaveProperty("estimatedCostUsd");
  });
});
