import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { purchaseOrderTransitionSchema } from "@/modules/procurement/procurement-schemas";
import { ProcurementService } from "@/modules/procurement/procurement-service";
const service = new ProcurementService();
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const context = await currentAuthorizationContext(); requirePermission(context, "purchase.update"); const { status, expectedVersion } = purchaseOrderTransitionSchema.parse(await request.json()); return success(await service.transitionPurchaseOrder(context, (await params).id, status, expectedVersion)); } catch (error) { return failure(error); } }
