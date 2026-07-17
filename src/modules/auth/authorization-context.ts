import { DomainError } from "@/lib/errors";
import type { AuthorizationContext } from "@/lib/rbac";

export interface AuthorizationUserRecord {
  id: string;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  deletedAt: Date | null;
  roles: Array<{
    code: string;
    deletedAt: Date | null;
    permissions: string[];
  }>;
}

export interface AuthorizationRepository {
  findAuthorizationUser(
    userId: string,
  ): Promise<AuthorizationUserRecord | null>;
}

export async function loadAuthorizationContext(
  repository: AuthorizationRepository,
  userId: string,
): Promise<AuthorizationContext> {
  const user = await repository.findAuthorizationUser(userId);
  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    throw new DomainError("UNAUTHENTICATED", "Authentication required", 401);
  }

  return {
    userId: user.id,
    roles: [
      ...new Set(
        user.roles
          .filter((role) => role.deletedAt === null)
          .map((role) => role.code),
      ),
    ],
    permissions: [
      ...new Set(
        user.roles
          .filter((role) => role.deletedAt === null)
          .flatMap((role) => role.permissions),
      ),
    ],
  };
}
