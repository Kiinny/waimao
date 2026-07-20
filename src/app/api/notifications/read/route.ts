import { z } from "zod";

import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { ManagementService } from "@/modules/management/management-service";

const service = new ManagementService();
const schema = z.object({ ids: z.array(z.string().uuid()).optional() });

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    const { ids } = schema.parse(await request.json());
    return success(await service.markNotificationsRead(context, ids));
  } catch (error) {
    return failure(error);
  }
}
