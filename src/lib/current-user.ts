import { auth } from "@/auth";
import { DomainError } from "@/lib/errors";
import type { AuthorizationContext } from "@/lib/rbac";
import { loadAuthorizationContext } from "@/modules/auth/authorization-context";
import { createPrismaAuthorizationRepository } from "@/modules/auth/prisma-authorization-repository";

export async function currentAuthorizationContext(): Promise<AuthorizationContext> {
  const session = await auth();
  if (!session?.user) {
    throw new DomainError("UNAUTHENTICATED", "Authentication required", 401);
  }

  return loadAuthorizationContext(
    createPrismaAuthorizationRepository(),
    session.user.id,
  );
}
