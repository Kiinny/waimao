import { currentAuthorizationContext } from "@/lib/current-user";
import { DomainError } from "@/lib/errors";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { updateLeadSchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

const repository = new PrismaCrmRepository();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "lead.read");
    const { id } = await params;
    const lead = await repository.getLeadDetail(context, id);
    if (!lead) throw new DomainError("LEAD_NOT_FOUND", "Lead not found", 404);
    return success(lead);
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
    requirePermission(context, "lead.update");
    const { id } = await params;
    return success(
      await repository.updateLead(
        context,
        id,
        updateLeadSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
