import { getPrisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import type {
  AuthRepository,
  LoginIdentity,
} from "@/modules/auth/authenticate";

export function createPrismaAuthRepository(): AuthRepository {
  const prisma = getPrisma();

  return {
    async findByEmail(email): Promise<LoginIdentity | null> {
      const user = await prisma.user.findFirst({
        where: { email, deletedAt: null },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: { include: { permission: true } },
                },
              },
            },
          },
        },
      });
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        status: user.status,
        roles: user.roles.map(({ role }) => role.code),
        permissions: [
          ...new Set(
            user.roles.flatMap(({ role }) =>
              role.permissions.map(({ permission }) => permission.code),
            ),
          ),
        ],
      };
    },
    recordAttempt(input) {
      return prisma.loginAttempt
        .create({ data: input })
        .then(() => undefined);
    },
    writeAudit(action, input) {
      return writeAudit(prisma, {
        actorId: input.actorId,
        action,
        entityType: "User",
        entityId: input.actorId,
        metadata: { email: input.email },
        ipAddress: input.ipAddress,
      }).then(() => undefined);
    },
    updateLastLogin(userId) {
      return prisma.user
        .update({
          where: { id: userId },
          data: { lastLoginAt: new Date() },
        })
        .then(() => undefined);
    },
  };
}
