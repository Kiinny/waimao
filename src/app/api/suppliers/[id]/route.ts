import { z } from "zod";

import { currentAuthorizationContext } from "@/lib/current-user";
import { DomainError } from "@/lib/errors";
import { failure, success } from "@/lib/http";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { supplierUpdateSchema } from "@/modules/procurement/procurement-schemas";
import { ProcurementService } from "@/modules/procurement/procurement-service";

const service = new ProcurementService();
const archiveSchema = z.object({ expectedVersion: z.number().int().positive() });

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "supplier.read");
    const row = await service.getSupplier((await params).id, context);
    if (!row) {
      throw new DomainError("SUPPLIER_NOT_FOUND", "Supplier not found", 404);
    }
    return success(row);
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "supplier.update");
    return success(
      await service.updateSupplier(
        context,
        (await params).id,
        supplierUpdateSchema.parse(await request.json()),
      ),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "supplier.update");
    const { expectedVersion } = archiveSchema.parse(await request.json());
    const { id } = await params;
    const archived = await getPrisma().$transaction(async (transaction) => {
      const row = await transaction.supplier.findFirst({
        where: { id, deletedAt: null },
      });
      if (!row) {
        throw new DomainError("SUPPLIER_NOT_FOUND", "Supplier not found", 404);
      }
      const changed = await transaction.supplier.updateMany({
        where: { id, version: expectedVersion, deletedAt: null },
        data: {
          status: "ARCHIVED",
          deletedAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1) {
        throw new DomainError(
          "SUPPLIER_CONFLICT",
          "Supplier changed; refresh and retry",
          409,
        );
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "supplier.archive",
        entityType: "Supplier",
        entityId: id,
        before: { status: row.status, version: row.version },
        after: { status: "ARCHIVED", version: row.version + 1 },
      });
      return { id };
    });
    return success(archived);
  } catch (error) {
    return failure(error);
  }
}
