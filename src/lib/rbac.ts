import { AuthorizationError } from "@/lib/errors";

export const SENSITIVE_PERMISSIONS = [
  "purchase.cost.read",
  "finance.profit.read",
] as const;

export interface AuthorizationContext {
  userId: string;
  permissions: readonly string[];
}

export interface OwnedResource {
  ownerId?: string | null;
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
      context.permissions.includes(`${permission}.all`) ||
      context.permissions.includes("*")
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
