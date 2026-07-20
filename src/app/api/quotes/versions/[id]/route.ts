import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { createPrismaQuoteVersionRepository } from "@/modules/quotes/prisma-quote-version-repository";
import { updateQuoteVersion } from "@/modules/quotes/quote-service";
import { quoteVersionUpdateSchema } from "@/modules/transactions/transaction-schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    const { id } = await params;
    const input = quoteVersionUpdateSchema.parse(await request.json());
    const version = await updateQuoteVersion(
      createPrismaQuoteVersionRepository(),
      context,
      id,
      input,
    );
    return success(version);
  } catch (error) {
    return failure(error);
  }
}
