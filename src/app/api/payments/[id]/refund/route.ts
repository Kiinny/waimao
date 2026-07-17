import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
import { refundSchema } from "@/modules/transactions/transaction-schemas";

const repository = new PrismaTransactionsRepository();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "refund.create");
    const input = refundSchema.parse(await request.json());
    return success(
      await repository.refundPayment(context, (await params).id, input),
      201,
    );
  } catch (error) {
    return failure(error);
  }
}
