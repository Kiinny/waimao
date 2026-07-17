import { AuthorizationError } from "@/lib/errors";

export const SENSITIVE_PERMISSIONS = [
  "purchase.cost.read",
  "finance.profit.read",
] as const;

export interface AuthorizationContext {
  userId: string;
  roles?: readonly string[];
  permissions: readonly string[];
}

export interface OwnedResource {
  ownerId?: string | null;
}

export function hasGlobalOwnershipScope(
  context: AuthorizationContext,
  permission?: string,
) {
  return (
    context.permissions.includes("*") ||
    (permission
      ? context.permissions.includes(`${permission}.all`)
      : false) ||
    context.roles?.includes("SUPER_ADMIN") === true ||
    context.roles?.includes("SALES_MANAGER") === true
  );
}

export function can(
  context: AuthorizationContext,
  permission: string,
  resource?: OwnedResource,
) {
  const hasPermission =
    context.permissions.includes("*") ||
    context.permissions.includes(permission);

  if (!hasPermission) {
    return false;
  }

  if (resource?.ownerId) {
    return (
      resource.ownerId === context.userId ||
      hasGlobalOwnershipScope(context, permission)
    );
  }

  return true;
}

export function requirePermission(
  context: AuthorizationContext,
  permission: string,
  resource?: OwnedResource,
) {
  if (!can(context, permission, resource)) {
    throw new AuthorizationError(permission);
  }
}
