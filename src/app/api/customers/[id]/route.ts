import { currentAuthorizationContext } from "@/lib/current-user";
import { DomainError } from "@/lib/errors";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { updateCustomerSchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

const repository = new PrismaCrmRepository();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "customer.read");
    const { id } = await params;
    const customer = await repository.getCustomerDetail(context, id);
    if (!customer) {
      throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
    }
    return success(customer);
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "customer.update");
    const { id } = await params;
    return success(
      await repository.updateCustomer(
        context,
        id,
        updateCustomerSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
