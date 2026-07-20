import { describe, expect, it } from "vitest";

import { presentOrderDetail } from "@/modules/finance/order-presentation";

const order = {
  id: "order-1",
  totalUsd: "10000",
  estimatedCostUsd: "7000",
  actualCostUsd: "4321.9876",
  grossProfitUsd: "5678.0124",
  grossMarginPercent: "56.780124",
  netProfitEstimateUsd: "5600",
  costs: [
    {
      id: "cost-1",
      category: "PURCHASE",
      description: "Server procurement",
      amount: "4321.9876",
      amountUsd: "4321.9876",
      currencyCode: "USD",
      exchangeRateToUsd: "1",
    },
  ],
  items: [{ id: "item-1", description: "GPU server" }],
};

describe("order financial presentation", () => {
  it("omits the entire cost relation and every actual-cost value for a Sales Representative", () => {
    const result = presentOrderDetail(order, {
      userId: "sales-1",
      roles: ["SALES_REP"],
      permissions: ["order.read"],
    });

    expect(result).not.toHaveProperty("costs");
    expect(result).not.toHaveProperty("estimatedCostUsd");
    expect(result).not.toHaveProperty("actualCostUsd");
    expect(JSON.stringify(result)).not.toContain("4321.9876");
  });

  it("shows cost records only with explicit cost permission", () => {
    const result = presentOrderDetail(order, {
      userId: "finance-1",
      roles: ["FINANCE"],
      permissions: [
        "order.read",
        "purchase.cost.read",
        "finance.profit.read",
      ],
    });

    expect(result.costs).toEqual(order.costs);
    expect(result.actualCostUsd).toBe("4321.9876");
    expect(result.grossProfitUsd).toBe("5678.0124");
  });
});
