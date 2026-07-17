import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { convertLeadSchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
import { convertLead } from "@/modules/crm/crm-service";

const repository = new PrismaCrmRepository();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "lead.update");
    requirePermission(context, "customer.create");
    requirePermission(context, "opportunity.create");
    const { id } = await params;
    const result = await convertLead(
      repository,
      context,
      id,
      convertLeadSchema.parse(await request.json()),
    );
    return success(result, 201);
  } catch (error) {
    return failure(error);
  }
}
