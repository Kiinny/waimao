import { describe, expect, it } from "vitest";

import {
  assertOrderTransition,
  purchaseEligibilityAfterRefund,
} from "@/modules/orders/order-domain";

describe("sales order workflow", () => {
  it.each([
    ["DRAFT", "CONFIRMED"],
    ["CONFIRMED", "PURCHASING"],
    ["PURCHASING", "FULFILLING"],
    ["FULFILLING", "SHIPPED"],
    ["SHIPPED", "COMPLETED"],
    ["DRAFT", "CANCELLED"],
    ["CONFIRMED", "CANCELLED"],
  ])("allows %s to transition to %s", (from, to) => {
    expect(() => assertOrderTransition(from, to)).not.toThrow();
  });

  it("rejects moving a shipped order back to purchasing", () => {
    expect(() => assertOrderTransition("SHIPPED", "PURCHASING")).toThrowError(
      expect.objectContaining({ code: "INVALID_ORDER_TRANSITION" }),
    );
  });

  it("flags an in-progress purchase when a refund removes payment eligibility", () => {
    expect(
      purchaseEligibilityAfterRefund({
        orderStatus: "PURCHASING",
        paymentTerms: "100% T/T Before Purchase",
        orderTotalUsd: "1000",
        confirmedPaymentsUsd: ["1000"],
        confirmedRefundsUsd: ["0.01"],
      }),
    ).toEqual({
      eligible: false,
      netPaidUsd: "999.99",
      purchasingAtRisk: true,
    });
  });
});
