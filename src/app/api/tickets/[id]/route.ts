import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { ticketUpdateSchema } from "@/modules/management/management-schemas";
import { ManagementService } from "@/modules/management/management-service";

const service = new ManagementService();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "after_sales.update");
    return success(
      await service.updateTicket(
        context,
        (await params).id,
        ticketUpdateSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
