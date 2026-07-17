import { currentAuthorizationContext } from "@/lib/current-user";
import { DomainError } from "@/lib/errors";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";

const repository = new PrismaTransactionsRepository();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "order.read");
    const order = await repository.getOrder(context, (await params).id);
    if (!order) {
      throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
    }
    return success(order);
  } catch (error) {
    return failure(error);
  }
}
