import type { AuthorizationContext } from "@/lib/rbac";
import { AuthorizationError } from "@/lib/errors";
import { searchOwnershipFilter } from "@/modules/search/search-scope";

export type DashboardAccessScope =
  | { domain: "sales"; ownerId?: string }
  | { domain: "operations" };

export function dashboardAccessScope(
  context: AuthorizationContext,
): DashboardAccessScope {
  if (
    context.permissions.includes("*") ||
    context.roles?.includes("SUPER_ADMIN") ||
    context.roles?.includes("SALES_MANAGER")
  ) {
    return { domain: "sales" };
  }
  if (context.roles?.includes("SALES_REP")) {
    return { domain: "sales", ownerId: context.userId };
  }
  if (
    context.roles?.some((role) =>
      ["FINANCE", "PROCUREMENT", "OPERATIONS"].includes(role),
    )
  ) {
    return { domain: "operations" };
  }
  throw new AuthorizationError("dashboard.read");
}

export function dashboardOwnershipFilter(context: AuthorizationContext) {
  dashboardAccessScope(context);
  return searchOwnershipFilter(context);
}
