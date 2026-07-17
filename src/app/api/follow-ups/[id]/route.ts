import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { updateFollowUpSchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

const repository = new PrismaCrmRepository();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "follow_up.update");
    const { id } = await params;
    return success(
      await repository.updateFollowUp(
        context,
        id,
        updateFollowUpSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "follow_up.update");
    const { id } = await params;
    return success(await repository.deleteFollowUp(context, id));
  } catch (error) {
    return failure(error);
  }
}
