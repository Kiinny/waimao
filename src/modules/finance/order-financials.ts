import Decimal from "decimal.js";

function fixed(value: Decimal.Value) {
  return new Decimal(value).toFixed(4);
}

export function calculateOrderFinancials(input: {
  revenueUsd: string;
  estimatedCostUsd: string;
  actualCostsUsd: string[];
  estimatedOperatingCostsUsd?: string;
}) {
  const revenue = new Decimal(input.revenueUsd);
  const estimatedCost = new Decimal(input.estimatedCostUsd);
  const recordedActualCost = input.actualCostsUsd.reduce(
    (sum, amount) => sum.plus(amount),
    new Decimal(0),
  );
  const costBasis = input.actualCostsUsd.length
    ? recordedActualCost
    : estimatedCost;
  const grossProfit = revenue.minus(costBasis);
  const operatingEstimate = new Decimal(input.estimatedOperatingCostsUsd ?? 0);
  return {
    revenueUsd: fixed(revenue),
    estimatedCostUsd: fixed(estimatedCost),
    actualCostUsd: fixed(recordedActualCost),
    grossProfitUsd: fixed(grossProfit),
    grossMarginPercent: revenue.isZero()
      ? "0.0000"
      : fixed(grossProfit.div(revenue).times(100)),
    netProfitEstimateUsd: fixed(grossProfit.minus(operatingEstimate)),
  };
}
