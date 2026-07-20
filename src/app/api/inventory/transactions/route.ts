import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { inventoryMutationSchema } from "@/modules/procurement/procurement-schemas";
import { ProcurementService } from "@/modules/procurement/procurement-service";
const service = new ProcurementService();
export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "inventory.update"); return success(await service.mutateInventory(context, inventoryMutationSchema.parse(await request.json()))); } catch (error) { return failure(error); } }
