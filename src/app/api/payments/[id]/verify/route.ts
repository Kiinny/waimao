import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
import { paymentVerificationSchema } from "@/modules/transactions/transaction-schemas";

const repository = new PrismaTransactionsRepository();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "payment.verify");
    const input = paymentVerificationSchema.parse(await request.json());
    return success(
      await repository.verifyPayment(
        context,
        (await params).id,
        input.approved,
        "rejectionReason" in input ? input.rejectionReason : undefined,
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
