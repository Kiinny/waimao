import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { ticketSchema } from "@/modules/management/management-schemas";
import { ManagementService } from "@/modules/management/management-service";

const service = new ManagementService();

export async function GET() {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "after_sales.read");
    return success(await service.listTickets());
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "after_sales.create");
    return success(
      await service.createTicket(context, ticketSchema.parse(await request.json())),
      201,
    );
  } catch (error) {
    return failure(error);
  }
}
