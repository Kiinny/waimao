import { describe, expect, it } from "vitest";

import { authorizePurchaseTransition } from "@/modules/orders/purchase-gate";

const beforePurchaseOrder = {
  paymentTerms: "100% T/T Before Purchase",
  orderTotalUsd: "1000.00",
  confirmedPaymentsUsd: ["600.10", "399.90"],
  confirmedRefundsUsd: [],
};

describe("purchase payment gate", () => {
  it("allows purchasing when confirmed net payments cover the order", () => {
    expect(authorizePurchaseTransition(beforePurchaseOrder)).toEqual({
      eligible: true,
      overridden: false,
      netPaidUsd: "1000",
    });
  });

  it("blocks purchasing after a refund reduces confirmed coverage", () => {
    expect(() =>
      authorizePurchaseTransition({
        ...beforePurchaseOrder,
        confirmedRefundsUsd: ["0.01"],
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "PURCHASE_PAYMENT_REQUIRED",
        status: 409,
      }),
    );
  });

  it("requires a nonempty reason and actor for a super-admin override", () => {
    expect(() =>
      authorizePurchaseTransition(
        {
          ...beforePurchaseOrder,
          confirmedPaymentsUsd: ["999.99"],
        },
        { actorId: "admin-1", reason: "   " },
      ),
    ).toThrowError(
      expect.objectContaining({
        code: "PURCHASE_OVERRIDE_REASON_REQUIRED",
        status: 400,
      }),
    );
  });

  it("returns immutable override metadata for an authorized exception", () => {
    expect(
      authorizePurchaseTransition(
        {
          ...beforePurchaseOrder,
          confirmedPaymentsUsd: ["500"],
        },
        {
          actorId: "admin-1",
          reason: "Supplier allocation expires today",
        },
      ),
    ).toEqual({
      eligible: true,
      overridden: true,
      netPaidUsd: "500",
      override: {
        actorId: "admin-1",
        reason: "Supplier allocation expires today",
      },
    });
  });

  it("does not apply the payment gate to other payment terms", () => {
    expect(
      authorizePurchaseTransition({
        ...beforePurchaseOrder,
        paymentTerms: "30% deposit, balance before shipment",
        confirmedPaymentsUsd: [],
      }),
    ).toMatchObject({ eligible: true, overridden: false, netPaidUsd: "0" });
  });
});
