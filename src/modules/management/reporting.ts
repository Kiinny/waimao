import Decimal from "decimal.js";

import { DomainError } from "@/lib/errors";
import type { AuthorizationContext } from "@/lib/rbac";
import { can, hasGlobalOwnershipScope } from "@/lib/rbac";

export const REPORT_TYPES = [
  "sales",
  "collections",
  "receivables",
  "customers",
  "markets",
  "products",
  "representatives",
  "suppliers",
  "purchasing",
  "logistics",
  "after-sales",
  "profit",
  "conversion",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export function reportPermission(type: ReportType) {
  return `report.${type}.read`;
}

export function allowedReportTypes(context: AuthorizationContext): ReportType[] {
  if (context.permissions.includes("*") || context.roles?.includes("SUPER_ADMIN")) {
    return [...REPORT_TYPES];
  }
  return REPORT_TYPES.filter(
    (type) =>
      context.permissions.includes("report.read") &&
      context.permissions.includes(reportPermission(type)),
  );
}

export function assertReportAccess(
  context: AuthorizationContext,
  type: string,
): asserts type is ReportType {
  if (!REPORT_TYPES.includes(type as ReportType) || !allowedReportTypes(context).includes(type as ReportType)) {
    throw new DomainError(
      "PERMISSION_DENIED",
      `Report type '${type}' is not available for this role`,
      403,
    );
  }
}

export function reportExportQuery(input: {
  type: string;
  format: "csv";
  from?: string;
  to?: string;
}) {
  const query = new URLSearchParams({ type: input.type, format: input.format });
  if (input.from) query.set("from", input.from);
  if (input.to) query.set("to", input.to);
  return query;
}

export function reportScope(context: AuthorizationContext) {
  return hasGlobalOwnershipScope(context, "report.read") ||
    context.roles?.some((role) =>
      ["FINANCE", "PROCUREMENT", "OPERATIONS"].includes(role),
    )
    ? {}
    : { ownerId: context.userId };
}

export interface ReportOrderInput {
  orderNumber: string;
  customer: string;
  owner: string;
  market: string;
  totalUsd: string;
  collectedUsd: string;
  costUsd: string;
}

export function buildReportRows(
  orders: readonly ReportOrderInput[],
  context: AuthorizationContext,
) {
  const showProfit = can(context, "finance.profit.read");
  return orders.map((order) => {
    const total = new Decimal(order.totalUsd);
    const collection = new Decimal(order.collectedUsd);
    const base = {
      orderNumber: order.orderNumber,
      customer: order.customer,
      owner: order.owner,
      market: order.market,
      salesUsd: total.toFixed(4),
      collectionUsd: collection.toFixed(4),
      receivableUsd: Decimal.max(0, total.minus(collection)).toFixed(4),
      collectionRatePercent: total.isZero()
        ? "0.00"
        : collection.div(total).times(100).toFixed(2),
    };
    return showProfit
      ? {
          ...base,
          costUsd: new Decimal(order.costUsd).toFixed(4),
          profitUsd: total.minus(order.costUsd).toFixed(4),
        }
      : base;
  });
}

export function groupReportRows<
  T extends {
    salesUsd: string;
    collectionUsd: string;
    receivableUsd: string;
  },
  K extends keyof T,
>(rows: readonly T[], dimension: K) {
  const grouped = new Map<
    T[K],
    {
      orders: number;
      salesUsd: Decimal;
      collectionUsd: Decimal;
      receivableUsd: Decimal;
    }
  >();
  for (const row of rows) {
    const current = grouped.get(row[dimension]) ?? {
      orders: 0,
      salesUsd: new Decimal(0),
      collectionUsd: new Decimal(0),
      receivableUsd: new Decimal(0),
    };
    current.orders += 1;
    current.salesUsd = current.salesUsd.plus(row.salesUsd);
    current.collectionUsd = current.collectionUsd.plus(row.collectionUsd);
    current.receivableUsd = current.receivableUsd.plus(row.receivableUsd);
    grouped.set(row[dimension], current);
  }
  return [...grouped.entries()].map(([value, totals]) => ({
    [dimension]: value,
    orders: totals.orders,
    salesUsd: totals.salesUsd.toFixed(4),
    collectionUsd: totals.collectionUsd.toFixed(4),
    receivableUsd: totals.receivableUsd.toFixed(4),
  })) as Array<
    Pick<T, K> & {
      orders: number;
      salesUsd: string;
      collectionUsd: string;
      receivableUsd: string;
    }
  >;
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: readonly Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\r\n");
}
