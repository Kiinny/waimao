import { auth } from "@/auth";
import { DomainError } from "@/lib/errors";
import type { AuthorizationContext } from "@/lib/rbac";

export async function currentAuthorizationContext(): Promise<AuthorizationContext> {
  const session = await auth();
  if (!session?.user) {
    throw new DomainError("UNAUTHENTICATED", "Authentication required", 401);
  }

  return {
    userId: session.user.id,
    permissions: session.user.permissions,
  };
}
