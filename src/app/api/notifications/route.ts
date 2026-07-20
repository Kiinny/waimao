import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { ManagementService } from "@/modules/management/management-service";

const service = new ManagementService();

export async function GET() {
  try {
    const context = await currentAuthorizationContext();
    return success(await service.listNotifications(context));
  } catch (error) {
    return failure(error);
  }
}
