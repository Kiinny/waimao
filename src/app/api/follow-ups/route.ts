import { z } from "zod";

import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { followUpSchema } from "@/modules/crm/crm-schemas";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

const repository = new PrismaCrmRepository();
const querySchema = z.object({
  overdue: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  customerId: z.uuid().optional(),
  leadId: z.uuid().optional(),
  opportunityId: z.uuid().optional(),
});

export async function GET(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "follow_up.read");
    const filters = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return success(await repository.listFollowUps(context, filters));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "follow_up.create");
    return success(
      await repository.createFollowUp(
        context,
        followUpSchema.parse(await request.json()),
      ),
      201,
    );
  } catch (error) {
    return failure(error);
  }
}
