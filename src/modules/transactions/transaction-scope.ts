import type { AuthorizationContext } from "@/lib/rbac";
import { hasGlobalOwnershipScope } from "@/lib/rbac";

const CROSS_OWNER_ORDER_ROLES = new Set([
  "FINANCE",
  "PROCUREMENT",
  "OPERATIONS",
]);

export function transactionOrderWhere(context: AuthorizationContext) {
  if (
    hasGlobalOwnershipScope(context) ||
    context.roles?.some((role) => CROSS_OWNER_ORDER_ROLES.has(role))
  ) {
    return {};
  }
  return { ownerId: context.userId };
}
