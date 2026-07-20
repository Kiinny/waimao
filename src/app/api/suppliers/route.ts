import { currentAuthorizationContext } from "@/lib/current-user";
import { failure, success } from "@/lib/http";
import { requirePermission } from "@/lib/rbac";
import { supplierSchema } from "@/modules/procurement/procurement-schemas";
import { ProcurementService } from "@/modules/procurement/procurement-service";
const service = new ProcurementService();
export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.read"); return success(await service.listSuppliers(context)); } catch (error) { return failure(error); } }
export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.create"); return success(await service.createSupplier(context, supplierSchema.parse(await request.json()) as never), 201); } catch (error) { return failure(error); } }
