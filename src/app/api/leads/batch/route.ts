import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { batchLeadSchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

const repository = new PrismaCrmRepository();

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "lead.update");
    const input = batchLeadSchema.parse(await request.json());
    return success(
      await repository.batchLeads(context, input.ids, {
        ownerId: input.ownerId,
        status: input.status,
      }),
    );
  } catch (error) {
    return failure(error);
  }
}
