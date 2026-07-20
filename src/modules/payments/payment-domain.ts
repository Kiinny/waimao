import Decimal from "decimal.js";

import { DomainError } from "@/lib/errors";

function decimalPlaces(values: string[]) {
  return values.reduce(
    (maximum, value) => {
      const fraction = value.split(".")[1];
      return Math.max(maximum, fraction?.length ?? 0);
    },
    0,
  );
}

export function calculatePaymentCoverage(input: {
  payments: Array<{ status: string; amountUsd: string }>;
  refunds: Array<{ refundedAt: Date | null; amountUsd: string }>;
}) {
  const confirmedPaymentValues = input.payments
    .filter(({ status }) => status === "CONFIRMED")
    .map(({ amountUsd }) => amountUsd);
  const confirmedRefundValues = input.refunds
    .filter(({ refundedAt }) => refundedAt !== null)
    .map(({ amountUsd }) => amountUsd);
  const payments = confirmedPaymentValues.reduce(
    (sum, amountUsd) => sum.plus(amountUsd),
    new Decimal(0),
  );
  const refunds = confirmedRefundValues.reduce(
    (sum, amountUsd) => sum.plus(amountUsd),
    new Decimal(0),
  );
  const paymentScale = decimalPlaces(confirmedPaymentValues);
  const refundScale = decimalPlaces(confirmedRefundValues);
  const netScale = Math.max(paymentScale, refundScale);
  return {
    confirmedPaymentsUsd: payments.toFixed(paymentScale),
    confirmedRefundsUsd: refunds.toFixed(refundScale),
    netPaidUsd: payments.minus(refunds).toFixed(netScale),
  };
}

export function isFullPaymentCovered(
  netPaidUsd: string,
  requiredUsd: string,
) {
  return new Decimal(netPaidUsd).gte(requiredUsd);
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
