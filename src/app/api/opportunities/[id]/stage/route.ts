import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { opportunityStageChangeSchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
import { moveOpportunity } from "@/modules/crm/crm-service";

const repository = new PrismaCrmRepository();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "opportunity.update");
    const { id } = await params;
    const input = opportunityStageChangeSchema.parse(await request.json());
    return success(
      await moveOpportunity(
        repository,
        context,
        id,
        input.stage,
        input.lossReason,
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
