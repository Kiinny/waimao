import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { currentAuthorizationContext } from "@/lib/current-user";
import { DomainError } from "@/lib/errors";
import { failure, success } from "@/lib/http";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { assetIdListSchema } from "@/modules/procurement/procurement-schemas";
import { ProcurementService } from "@/modules/procurement/procurement-service";

const service = new ProcurementService();
const updateSchema = z.object({
  expectedVersion: z.number().int().positive(),
  paymentTerms: z.string().trim().max(1000).nullable().optional(),
  shippingTerms: z.string().trim().max(1000).nullable().optional(),
  incoterm: z.string().trim().max(20).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  expectedAt: z.coerce.date().nullable().optional(),
  attachmentIds: assetIdListSchema.optional(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "purchase.read");
    const row = await service.getPurchaseOrder((await params).id, context);
    if (!row) {
      throw new DomainError(
        "PURCHASE_ORDER_NOT_FOUND",
        "Purchase order not found",
        404,
      );
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
    requirePermission(context, "purchase.update");
    const input = updateSchema.parse(await request.json());
    const { id } = await params;
    const updated = await getPrisma().$transaction(async (transaction) => {
      const row = await transaction.purchaseOrder.findFirst({
        where: { id, deletedAt: null },
      });
      if (!row) {
        throw new DomainError(
          "PURCHASE_ORDER_NOT_FOUND",
          "Purchase order not found",
          404,
        );
      }
      if (input.attachmentIds) {
        const uniqueIds = [...new Set(input.attachmentIds)];
        const assetCount = await transaction.fileAsset.count({
          where: { id: { in: uniqueIds }, deletedAt: null },
        });
        if (assetCount !== uniqueIds.length) {
          throw new DomainError(
            "ATTACHMENT_NOT_FOUND",
            "One or more attachments are unavailable",
            409,
          );
        }
      }
      const changed = await transaction.purchaseOrder.updateMany({
        where: {
          id,
          version: input.expectedVersion,
          deletedAt: null,
        },
        data: {
          paymentTerms: input.paymentTerms,
          shippingTerms: input.shippingTerms,
          incoterm: input.incoterm,
          notes: input.notes,
          expectedAt: input.expectedAt,
          ...(input.attachmentIds ? { attachments: input.attachmentIds } : {}),
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1) {
        throw new DomainError(
          "PURCHASE_ORDER_CONFLICT",
          "Purchase order changed; refresh and retry",
          409,
        );
      }
      if (input.attachmentIds) {
        const previousIds = Array.isArray(row.attachments)
          ? row.attachments.filter(
              (value): value is string => typeof value === "string",
            )
          : [];
        const removedIds = previousIds.filter(
          (fileAssetId) => !input.attachmentIds?.includes(fileAssetId),
        );
        if (removedIds.length) {
          await transaction.fileAsset.updateMany({
            where: {
              id: { in: removedIds },
              entityType: "PurchaseOrder",
              entityId: id,
            },
            data: { entityType: null, entityId: null },
          });
        }
        if (input.attachmentIds.length) {
          await transaction.fileAsset.updateMany({
            where: { id: { in: input.attachmentIds }, deletedAt: null },
            data: { entityType: "PurchaseOrder", entityId: id },
          });
        }
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "purchase_order.update",
        entityType: "PurchaseOrder",
        entityId: id,
        before: { version: row.version, attachments: row.attachments },
        after: {
          version: row.version + 1,
          attachments: input.attachmentIds ?? row.attachments,
        },
      });
      return transaction.purchaseOrder.findUniqueOrThrow({ where: { id } });
    });
    return success(updated);
  } catch (error) {
    return failure(error);
  }
}
