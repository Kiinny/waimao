import Decimal from "decimal.js";

import { DomainError } from "@/lib/errors";

function fixed(value: Decimal.Value) {
  return new Decimal(value).toFixed(2);
}

export function calculatePaymentCoverage(input: {
  payments: Array<{ status: string; amountUsd: string }>;
  refunds: Array<{ refundedAt: Date | null; amountUsd: string }>;
}) {
  const payments = input.payments
    .filter(({ status }) => status === "CONFIRMED")
    .reduce((sum, { amountUsd }) => sum.plus(amountUsd), new Decimal(0));
  const refunds = input.refunds
    .filter(({ refundedAt }) => refundedAt !== null)
    .reduce((sum, { amountUsd }) => sum.plus(amountUsd), new Decimal(0));
  return {
    confirmedPaymentsUsd: fixed(payments),
    confirmedRefundsUsd: fixed(refunds),
    netPaidUsd: fixed(payments.minus(refunds)),
  };
}

export function validateRefund(input: {
  paymentStatus: string;
  paymentAmountUsd: string;
  completedRefundsUsd: string[];
  refundAmountUsd: string;
}) {
  if (input.paymentStatus !== "CONFIRMED") {
    throw new DomainError(
      "PAYMENT_NOT_CONFIRMED",
      "Only a confirmed payment can be refunded",
      409,
    );
  }
  const amount = new Decimal(input.refundAmountUsd);
  if (amount.lte(0)) {
    throw new DomainError(
      "INVALID_REFUND_AMOUNT",
      "Refund amount must be greater than zero",
    );
  }
  const refunded = input.completedRefundsUsd.reduce(
    (sum, value) => sum.plus(value),
    new Decimal(0),
  );
  if (refunded.plus(amount).gt(input.paymentAmountUsd)) {
    throw new DomainError(
      "REFUND_EXCEEDS_PAYMENT",
      "Cumulative refunds cannot exceed the confirmed payment",
      409,
    );
  }
}
