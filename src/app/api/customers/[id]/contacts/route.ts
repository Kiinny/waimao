import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { contactSchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

const repository = new PrismaCrmRepository();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "customer.update");
    const { id } = await params;
    return success(
      await repository.createContact(
        context,
        id,
        contactSchema.parse(await request.json()),
      ),
      201,
    );
  } catch (error) {
    return failure(error);
  }
}
