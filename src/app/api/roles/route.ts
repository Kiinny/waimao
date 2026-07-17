import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";

const createRoleSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z][A-Z0-9_]+$/),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(300).optional(),
  permissions: z.array(z.string().min(1)).min(1),
});

export async function GET() {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "role.read");
    const roles = await getPrisma().role.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { users: true, permissions: true } },
      },
      orderBy: { name: "asc" },
    });
    return success(roles);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "role.create");
    const input = createRoleSchema.parse(await request.json());
    const role = await getPrisma().$transaction(async (transaction) => {
      const permissions = await transaction.permission.findMany({
        where: { code: { in: input.permissions } },
        select: { id: true },
      });
      const created = await transaction.role.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description,
          permissions: {
            create: permissions.map(({ id }) => ({ permissionId: id })),
          },
        },
        select: { id: true, code: true, name: true, description: true },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "role.create",
        entityType: "Role",
        entityId: created.id,
        after: created,
      });
      return created;
    });
    return success(role, 201);
  } catch (error) {
    return failure(error);
  }
}
