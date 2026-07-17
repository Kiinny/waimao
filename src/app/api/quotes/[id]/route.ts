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
    requirePermission(context, "quote.read");
    const quote = await repository.getQuote(context, (await params).id);
    if (!quote) {
      throw new DomainError("QUOTE_NOT_FOUND", "Quotation not found", 404);
    }
    return success(quote);
  } catch (error) {
    return failure(error);
  }
}
