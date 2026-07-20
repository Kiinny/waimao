import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { settingsUpdateSchema } from "@/modules/management/management-schemas";
import { ManagementService } from "@/modules/management/management-service";

const service = new ManagementService();

export async function GET() {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "settings.read");
    return success(await service.listSettings(context));
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "settings.update");
    return success(
      await service.updateSetting(
        context,
        settingsUpdateSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}
