import type { AuthorizationContext } from "@/lib/rbac";

const COST_FIELDS = new Set([
  "estimatedCostUsd",
  "actualCostUsd",
  "cost",
  "costUsd",
  "unitCost",
  "unitCostUsd",
]);
const PROFIT_FIELDS = new Set([
  "estimatedProfitUsd",
  "grossProfitUsd",
  "grossMarginPercent",
  "netProfitEstimateUsd",
  "profitUsd",
  "marginPercent",
]);

function redact(
  value: unknown,
  canReadCost: boolean,
  canReadProfit: boolean,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, canReadCost, canReadProfit));
  }
  if (!value || typeof value !== "object" || value instanceof Date) {
    return value;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(
        ([key]) =>
          (canReadCost || !COST_FIELDS.has(key)) &&
          (canReadProfit || !PROFIT_FIELDS.has(key)),
      )
      .map(([key, item]) => [
        key,
        redact(item, canReadCost, canReadProfit),
      ]),
  );
}

export function redactFinancialFields<T>(
  value: T,
  context: AuthorizationContext,
): T {
  const all = context.permissions.includes("*");
  return redact(
    value,
    all || context.permissions.includes("purchase.cost.read"),
    all || context.permissions.includes("finance.profit.read"),
  ) as T;
}
