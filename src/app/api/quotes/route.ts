import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
import { quoteSchema } from "@/modules/transactions/transaction-schemas";

const repository = new PrismaTransactionsRepository();

export async function GET() {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "quote.read");
    return success(await repository.listQuotes(context));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "quote.create");
    const input = quoteSchema.parse(await request.json());
    return success(await repository.createQuote(context, input), 201);
  } catch (error) {
    return failure(error);
  }
}
