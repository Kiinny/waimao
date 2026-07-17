import { currentAuthorizationContext } from "@/lib/current-user";
import { DomainError } from "@/lib/errors";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
import { productUpdateSchema } from "@/modules/transactions/transaction-schemas";

const repository = new PrismaTransactionsRepository();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "product.read");
    const product = await repository.getProduct(context, (await params).id);
    if (!product) {
      throw new DomainError("PRODUCT_NOT_FOUND", "Product not found", 404);
    }
    return success(product);
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "product.update");
    const input = productUpdateSchema.parse(await request.json());
    return success(
      await repository.updateProduct(context, (await params).id, input),
    );
  } catch (error) {
    return failure(error);
  }
}
