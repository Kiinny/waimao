import Decimal from "decimal.js";

import { DomainError } from "@/lib/errors";

const ORDER_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  DRAFT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PURCHASING", "CANCELLED"],
  PURCHASING: ["FULFILLING"],
  FULFILLING: ["SHIPPED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertOrderTransition(from: string, to: string) {
  if (!ORDER_TRANSITIONS[from]?.includes(to)) {
    throw new DomainError(
      "INVALID_ORDER_TRANSITION",
      `Sales order cannot move from ${from} to ${to}`,
      409,
    );
  }
}

export function purchaseEligibilityAfterRefund(input: {
  orderStatus: string;
  paymentTerms: string;
  orderTotalUsd: string;
  confirmedPaymentsUsd: string[];
  confirmedRefundsUsd: string[];
}) {
  const paid = input.confirmedPaymentsUsd.reduce(
    (sum, amount) => sum.plus(amount),
    new Decimal(0),
  );
  const refunds = input.confirmedRefundsUsd.reduce(
    (sum, amount) => sum.plus(amount),
    new Decimal(0),
  );
  const netPaid = paid.minus(refunds);
  const eligible =
    input.paymentTerms !== "100% T/T Before Purchase" ||
    netPaid.gte(input.orderTotalUsd);
  return {
    eligible,
    netPaidUsd: netPaid.toString(),
    purchasingAtRisk:
      !eligible &&
      ["PURCHASING", "FULFILLING", "SHIPPED", "COMPLETED"].includes(
        input.orderStatus,
      ),
  };
}
