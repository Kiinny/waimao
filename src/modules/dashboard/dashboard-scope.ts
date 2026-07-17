import type { AuthorizationContext } from "@/lib/rbac";
import { searchOwnershipFilter } from "@/modules/search/search-scope";

export function dashboardOwnershipFilter(context: AuthorizationContext) {
  return searchOwnershipFilter(context);
}
