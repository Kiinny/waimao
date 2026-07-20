import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";
const service = new ProcurementService();
export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "inventory.read"); return success(await service.listInventory()); } catch (error) { return failure(error); } }
