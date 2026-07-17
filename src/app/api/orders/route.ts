import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";

const repository = new PrismaTransactionsRepository();

export async function GET() {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "order.read");
    return success(await repository.listOrders(context));
  } catch (error) {
    return failure(error);
  }
}
