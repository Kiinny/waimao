import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { updateContactSchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

const repository = new PrismaCrmRepository();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "customer.update");
    const { id, contactId } = await params;
    return success(
      await repository.updateContact(
        context,
        id,
        contactId,
        updateContactSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "customer.update");
    const { id, contactId } = await params;
    return success(await repository.deleteContact(context, id, contactId));
  } catch (error) {
    return failure(error);
  }
}
