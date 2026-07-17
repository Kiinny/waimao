import { describe, expect, it } from "vitest";

import { calculateOrderFinancials } from "@/modules/finance/order-financials";

describe("sales order financials", () => {
  it("calculates actual cost, gross profit, margin and net estimate without float drift", () => {
    expect(
      calculateOrderFinancials({
        revenueUsd: "1000.00",
        estimatedCostUsd: "700.00",
        actualCostsUsd: ["600.10", "79.90"],
        estimatedOperatingCostsUsd: "30.00",
      }),
    ).toEqual({
      revenueUsd: "1000.0000",
      estimatedCostUsd: "700.0000",
      actualCostUsd: "680.0000",
      grossProfitUsd: "320.0000",
      grossMarginPercent: "32.0000",
      netProfitEstimateUsd: "290.0000",
    });
  });

  it("uses estimated cost until actual costs have been recorded", () => {
    expect(
      calculateOrderFinancials({
        revenueUsd: "1000",
        estimatedCostUsd: "700",
        actualCostsUsd: [],
        estimatedOperatingCostsUsd: "30",
      }).grossProfitUsd,
    ).toBe("300.0000");
  });
});
