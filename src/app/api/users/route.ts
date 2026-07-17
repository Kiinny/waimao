import { z } from "zod";

import { getPrisma } from "@/lib/prisma";
import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const createUserSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(128),
  roleId: z.string().uuid(),
  locale: z.enum(["en", "zh"]).default("en"),
});

export async function GET() {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "user.read");
    const users = await getPrisma().user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        locale: true,
        lastLoginAt: true,
        roles: { select: { role: { select: { code: true, name: true } } } },
      },
      orderBy: { name: "asc" },
    });
    return success(users);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "user.create");
    const input = createUserSchema.parse(await request.json());
    const passwordHash = await hashPassword(input.password);
    const user = await getPrisma().$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          locale: input.locale,
          roles: { create: { roleId: input.roleId } },
        },
        select: { id: true, email: true, name: true, status: true },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "user.create",
        entityType: "User",
        entityId: created.id,
        after: created,
      });
      return created;
    });
    return success(user, 201);
  } catch (error) {
    return failure(error);
  }
}
