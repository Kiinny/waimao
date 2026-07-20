import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { ManagementService } from "@/modules/management/management-service";

const service = new ManagementService();

export async function GET(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "audit.read");
    const params = new URL(request.url).searchParams;
    return success(
      await service.listActivityLogs({
        actorId: params.get("actorId") ?? undefined,
        action: params.get("action") ?? undefined,
        entityType: params.get("entityType") ?? undefined,
        entityId: params.get("entityId") ?? undefined,
        from: params.get("from") ? new Date(params.get("from")!) : undefined,
        to: params.get("to") ? new Date(params.get("to")!) : undefined,
      }),
    );
  } catch (error) {
    return failure(error);
  }
}
