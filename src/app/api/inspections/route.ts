import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { inspectionSchema } from "@/modules/procurement/procurement-schemas";
import { ProcurementService } from "@/modules/procurement/procurement-service";
const service = new ProcurementService();
export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "quality.read"); return success(await service.listInspections()); } catch (error) { return failure(error); } }
export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "quality.update"); return success(await service.createInspection(context, inspectionSchema.parse(await request.json())), 201); } catch (error) { return failure(error); } }
