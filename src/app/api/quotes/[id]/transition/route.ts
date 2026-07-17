import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
import { quoteTransitionSchema } from "@/modules/transactions/transaction-schemas";
import { transitionQuote } from "@/modules/transactions/transaction-service";

const repository = new PrismaTransactionsRepository();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    const input = quoteTransitionSchema.parse(await request.json());
    return success(
      await transitionQuote(
        repository,
        context,
        (await params).id,
        input.status,
        input.note,
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
