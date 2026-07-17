import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { createCustomerSchema, paginatedQuerySchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

const repository = new PrismaCrmRepository();

export async function GET(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "customer.read");
    const filters = paginatedQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return success(await repository.listCustomers(context, filters));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "customer.create");
    const input = createCustomerSchema.parse(await request.json());
    return success(
      await repository.createCustomer(context, {
        ...input,
        ownerId: input.ownerId ?? context.userId,
      }),
      201,
    );
  } catch (error) {
    return failure(error);
  }
}
