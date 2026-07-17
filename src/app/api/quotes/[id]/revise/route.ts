import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
import { reviseQuote } from "@/modules/transactions/transaction-service";

const repository = new PrismaTransactionsRepository();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    return success(
      await reviseQuote(repository, context, (await params).id),
      201,
    );
  } catch (error) {
    return failure(error);
  }
}
