import { describe, expect, it } from "vitest";

import {
  calculatePaymentCoverage,
  validateRefund,
} from "@/modules/payments/payment-domain";

describe("payment coverage", () => {
  it("counts only finance-confirmed payments and completed refunds", () => {
    expect(
      calculatePaymentCoverage({
        payments: [
          { status: "CONFIRMED", amountUsd: "600.10" },
          { status: "PENDING", amountUsd: "9999" },
          { status: "FAILED", amountUsd: "50" },
          { status: "CONFIRMED", amountUsd: "400.20" },
        ],
        refunds: [
          { refundedAt: new Date("2026-07-17"), amountUsd: "0.30" },
          { refundedAt: null, amountUsd: "100" },
        ],
      }),
    ).toEqual({
      confirmedPaymentsUsd: "1000.30",
      confirmedRefundsUsd: "0.30",
      netPaidUsd: "1000.00",
    });
  });

  it("prevents cumulative refunds from exceeding a confirmed payment", () => {
    expect(() =>
      validateRefund({
        paymentStatus: "CONFIRMED",
        paymentAmountUsd: "100",
        completedRefundsUsd: ["60", "39.99"],
        refundAmountUsd: "0.02",
      }),
    ).toThrowError(expect.objectContaining({ code: "REFUND_EXCEEDS_PAYMENT" }));
  });
});
