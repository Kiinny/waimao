import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { shipmentTransitionSchema } from "@/modules/procurement/procurement-schemas";
import { ProcurementService } from "@/modules/procurement/procurement-service";
const service = new ProcurementService();
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const context = await currentAuthorizationContext(); requirePermission(context, "shipment.update"); const { status, expectedVersion } = shipmentTransitionSchema.parse(await request.json()); return success(await service.transitionShipment(context, (await params).id, status, expectedVersion)); } catch (error) { return failure(error); } }
