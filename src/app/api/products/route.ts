import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";
import { productSchema } from "@/modules/transactions/transaction-schemas";

const repository = new PrismaTransactionsRepository();

export async function GET() {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "product.read");
    return success(await repository.listProducts(context));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "product.create");
    const input = productSchema.parse(await request.json());
    return success(await repository.createProduct(context, input), 201);
  } catch (error) {
    return failure(error);
  }
}
