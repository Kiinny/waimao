import type { AuthorizationContext } from "@/lib/rbac";
import { redactFinancialFields } from "@/modules/finance/field-redaction";

const COST_SUMMARY_FIELDS = ["estimatedCostUsd", "actualCostUsd"] as const;
const PROFIT_SUMMARY_FIELDS = [
  "grossProfitUsd",
  "grossMarginPercent",
  "netProfitEstimateUsd",
] as const;

function hasPermission(
  context: AuthorizationContext,
  permission: string,
) {
  return (
    context.permissions.includes("*") ||
    context.permissions.includes(permission)
  );
}

export function presentOrderDetail<T extends Record<string, unknown>>(
  order: T,
  context: AuthorizationContext,
) {
  const canReadCost = hasPermission(context, "purchase.cost.read");
  const canReadProfit = hasPermission(context, "finance.profit.read");
  const source = { ...order };
  const costRecords = source.costs;
  delete source.costs;

  const costSummary = Object.fromEntries(
    COST_SUMMARY_FIELDS.flatMap((field) => {
      const value = source[field];
      delete source[field];
      return canReadCost && value !== undefined ? [[field, value]] : [];
    }),
  );
  const profitSummary = Object.fromEntries(
    PROFIT_SUMMARY_FIELDS.flatMap((field) => {
      const value = source[field];
      delete source[field];
      return canReadProfit && value !== undefined ? [[field, value]] : [];
    }),
  );

  return redactFinancialFields(
    {
      ...source,
      ...costSummary,
      ...profitSummary,
      ...(canReadCost && costRecords !== undefined
        ? { costs: costRecords }
        : {}),
    },
    context,
  ) as Omit<T, "costs"> & {
    costs?: T["costs"];
    estimatedCostUsd?: T["estimatedCostUsd"];
    actualCostUsd?: T["actualCostUsd"];
    grossProfitUsd?: T["grossProfitUsd"];
    grossMarginPercent?: T["grossMarginPercent"];
    netProfitEstimateUsd?: T["netProfitEstimateUsd"];
  };
}
