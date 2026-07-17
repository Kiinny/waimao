import Decimal from "decimal.js";

import { AuthorizationError, DomainError } from "@/lib/errors";

export interface QuoteCalculationItem {
  quantity: number;
  unitPrice: string;
  discount?: string;
  estimatedUnitCostUsd?: string | null;
}

export interface QuoteCalculationInput {
  exchangeRateToUsd: string;
  items: QuoteCalculationItem[];
  shipping?: string;
  insurance?: string;
  tax?: string;
  bankFees?: string;
}

function fixed(value: Decimal.Value) {
  return new Decimal(value).toFixed(4);
}

export function calculateQuoteVersion(input: QuoteCalculationInput) {
  if (!input.items.length) {
    throw new DomainError(
      "QUOTE_ITEMS_REQUIRED",
      "A quotation requires at least one item",
    );
  }
  const rate = new Decimal(input.exchangeRateToUsd);
  if (rate.lte(0)) {
    throw new DomainError(
      "INVALID_EXCHANGE_RATE",
      "Exchange rate must be greater than zero",
    );
  }
  const items = input.items.map((item) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new DomainError(
        "INVALID_QUOTE_QUANTITY",
        "Item quantity must be a positive integer",
      );
    }
    const gross = new Decimal(item.unitPrice).times(item.quantity);
    const discount = new Decimal(item.discount ?? 0);
    if (discount.isNegative() || discount.gt(gross)) {
      throw new DomainError(
        "INVALID_QUOTE_DISCOUNT",
        "Item discount cannot exceed its gross amount",
      );
    }
    return {
      lineTotal: fixed(gross.minus(discount)),
      estimatedCostUsd: fixed(
        new Decimal(item.estimatedUnitCostUsd ?? 0).times(item.quantity),
      ),
    };
  });
  const subtotal = items.reduce(
    (sum, item) => sum.plus(item.lineTotal),
    new Decimal(0),
  );
  const total = [
    input.shipping,
    input.insurance,
    input.tax,
    input.bankFees,
  ].reduce<Decimal>(
    (sum, amount) => sum.plus(amount ?? 0),
    subtotal,
  );
  const totalUsd = total.times(rate);
  const estimatedCostUsd = items.reduce(
    (sum, item) => sum.plus(item.estimatedCostUsd),
    new Decimal(0),
  );
  const estimatedProfitUsd = totalUsd.minus(estimatedCostUsd);
  return {
    items,
    subtotal: fixed(subtotal),
    total: fixed(total),
    totalUsd: fixed(totalUsd),
    estimatedCostUsd: fixed(estimatedCostUsd),
    estimatedProfitUsd: fixed(estimatedProfitUsd),
    estimatedMarginPercent: totalUsd.isZero()
      ? "0.0000"
      : fixed(estimatedProfitUsd.div(totalUsd).times(100)),
  };
}

const QUOTE_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["SENT"],
  SENT: ["VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"],
  VIEWED: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: ["CONVERTED"],
  REJECTED: [],
  EXPIRED: [],
  CONVERTED: [],
};

export function assertQuoteTransition(from: string, to: string) {
  if (!QUOTE_TRANSITIONS[from]?.includes(to)) {
    throw new DomainError(
      "INVALID_QUOTE_TRANSITION",
      `Quotation cannot move from ${from} to ${to}`,
      409,
    );
  }
}

export function assertQuoteApprovalRole(roles: readonly string[] = []) {
  if (!roles.some((role) => role === "SUPER_ADMIN" || role === "SALES_MANAGER")) {
    throw new AuthorizationError("quote.approve");
  }
}

interface RevisionSource {
  id: string;
  number: number;
  immutableAt: Date | null;
  items: unknown[];
  [key: string]: unknown;
}

export function nextQuoteRevision(input: {
  currentVersion: number;
  source: RevisionSource;
}) {
  const {
    id: sourceVersionId,
    number: sourceNumber,
    immutableAt,
    items,
    ...snapshot
  } = input.source;
  if (!immutableAt) {
    throw new DomainError(
      "QUOTE_REVISION_SOURCE_MUTABLE",
      "Only an immutable quotation version can be revised",
      409,
    );
  }
  if (sourceNumber !== input.currentVersion) {
    throw new DomainError(
      "QUOTE_REVISION_SOURCE_STALE",
      "Only the current quotation version can be revised",
      409,
    );
  }
  return {
    ...structuredClone(snapshot),
    number: input.currentVersion + 1,
    sourceVersionId,
    immutableAt: null,
    status: "DRAFT",
    items: structuredClone(items),
  };
}
