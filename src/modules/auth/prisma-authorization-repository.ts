import { getPrisma } from "@/lib/prisma";
import type {
  AuthorizationRepository,
  AuthorizationUserRecord,
} from "@/modules/auth/authorization-context";

export function createPrismaAuthorizationRepository(): AuthorizationRepository {
  return {
    async findAuthorizationUser(
      userId,
    ): Promise<AuthorizationUserRecord | null> {
      const user = await getPrisma().user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          status: true,
          deletedAt: true,
          roles: {
            select: {
              role: {
                select: {
                  code: true,
                  deletedAt: true,
                  permissions: {
                    select: { permission: { select: { code: true } } },
                  },
                },
              },
            },
          },
        },
      });
      if (!user) return null;

      return {
        id: user.id,
        status: user.status,
        deletedAt: user.deletedAt,
        roles: user.roles.map(({ role }) => ({
          code: role.code,
          deletedAt: role.deletedAt,
          permissions: role.permissions.map(
            ({ permission }) => permission.code,
          ),
        })),
      };
    },
  };
}
