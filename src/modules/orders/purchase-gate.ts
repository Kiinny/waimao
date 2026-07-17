import Decimal from "decimal.js";

import { DomainError } from "@/lib/errors";

export interface PurchaseGateInput {
  paymentTerms: string;
  orderTotalUsd: string;
  confirmedPaymentsUsd: string[];
  confirmedRefundsUsd: string[];
}

export interface PurchaseOverride {
  actorId: string;
  reason: string;
}

export function authorizePurchaseTransition(
  input: PurchaseGateInput,
  override?: PurchaseOverride,
) {
  const paid = input.confirmedPaymentsUsd.reduce(
    (sum, amount) => sum.plus(amount),
    new Decimal(0),
  );
  const refunded = input.confirmedRefundsUsd.reduce(
    (sum, amount) => sum.plus(amount),
    new Decimal(0),
  );
  const netPaid = paid.minus(refunded);
  const requiresFullPayment =
    input.paymentTerms === "100% T/T Before Purchase";

  if (!requiresFullPayment || netPaid.gte(input.orderTotalUsd)) {
    return {
      eligible: true as const,
      overridden: false as const,
      netPaidUsd: netPaid.toString(),
    };
  }

  if (!override) {
    throw new DomainError(
      "PURCHASE_PAYMENT_REQUIRED",
      "Confirmed net payments must cover the order before purchasing",
      409,
      {
        requiredUsd: new Decimal(input.orderTotalUsd).toString(),
        netPaidUsd: netPaid.toString(),
      },
    );
  }

  const reason = override.reason.trim();
  if (!override.actorId || !reason) {
    throw new DomainError(
      "PURCHASE_OVERRIDE_REASON_REQUIRED",
      "A purchase override requires an actor and nonempty reason",
      400,
    );
  }

  return {
    eligible: true as const,
    overridden: true as const,
    netPaidUsd: netPaid.toString(),
    override: {
      actorId: override.actorId,
      reason,
    },
  };
}
