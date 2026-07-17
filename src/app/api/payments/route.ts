import { currentAuthorizationContext } from "@/lib/current-user";
import { DomainError } from "@/lib/errors";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
import { paymentSchema } from "@/modules/transactions/transaction-schemas";

const repository = new PrismaTransactionsRepository();

export async function GET(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "payment.read");
    const salesOrderId = new URL(request.url).searchParams.get("salesOrderId");
    if (!salesOrderId) {
      throw new DomainError(
        "ORDER_ID_REQUIRED",
        "salesOrderId is required",
      );
    }
    const order = await repository.getOrder(context, salesOrderId);
    if (!order) {
      throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
    }
    return success(order.payments);
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "payment.create");
    const input = paymentSchema.parse(await request.json());
    return success(await repository.createPayment(context, input), 201);
  } catch (error) {
    return failure(error);
  }
}
