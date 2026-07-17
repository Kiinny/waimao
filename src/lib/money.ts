import Decimal from "decimal.js";

import type { MoneySnapshot } from "@/lib/contracts";
import { DomainError } from "@/lib/errors";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function convertMoney(amount: Decimal.Value, exchangeRateToUsd: Decimal.Value) {
  const rate = new Decimal(exchangeRateToUsd);
  if (rate.lte(0)) {
    throw new DomainError(
      "INVALID_EXCHANGE_RATE",
      "Exchange rate must be greater than zero",
    );
  }

  return new Decimal(amount).mul(rate).toString();
}

export function moneySnapshot(
  amount: string,
  currency: string,
  exchangeRateToUsd: string,
): MoneySnapshot {
  return {
    amount,
    currency,
    exchangeRateToUsd,
    amountUsd: convertMoney(amount, exchangeRateToUsd),
  };
}

export function calculateProfit(
  revenueUsd: Decimal.Value,
  costUsd: Decimal.Value,
) {
  const revenue = new Decimal(revenueUsd);
  const cost = new Decimal(costUsd);
  const profit = revenue.minus(cost);

  return {
    revenueUsd: revenue.toString(),
    costUsd: cost.toString(),
    profitUsd: profit.toString(),
    marginPercent: revenue.isZero()
      ? "0"
      : profit.div(revenue).mul(100).toDecimalPlaces(18).toString(),
  };
}
