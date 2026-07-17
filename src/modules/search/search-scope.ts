import type { AuthorizationContext } from "@/lib/rbac";
import { hasGlobalOwnershipScope } from "@/lib/rbac";

export function searchOwnershipFilter(context: AuthorizationContext) {
  const isSalesRepresentative =
    context.roles?.includes("SALES_REP") === true;

  if (
    isSalesRepresentative &&
    !hasGlobalOwnershipScope(context)
  ) {
    return { ownerId: context.userId };
  }

  return {};
}
