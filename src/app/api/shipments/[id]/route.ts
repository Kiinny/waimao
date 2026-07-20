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
  carrier: z.string().trim().max(200).nullable().optional(),
  trackingNumber: z.string().trim().max(200).nullable().optional(),
  incoterm: z.string().trim().max(20).nullable().optional(),
  origin: z.string().trim().max(200).nullable().optional(),
  destination: z.string().trim().max(200).nullable().optional(),
  originPort: z.string().trim().max(100).nullable().optional(),
  destinationPort: z.string().trim().max(100).nullable().optional(),
  estimatedDepartureAt: z.coerce.date().nullable().optional(),
  estimatedArrivalAt: z.coerce.date().nullable().optional(),
  documentIds: assetIdListSchema.optional(),
});

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "shipment.read");
    const { id } = await params;
    const row = (await service.listShipments()).find((shipment) => shipment.id === id);
    if (!row) {
      throw new DomainError("SHIPMENT_NOT_FOUND", "Shipment not found", 404);
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
    requirePermission(context, "shipment.update");
    const input = updateSchema.parse(await request.json());
    const { id } = await params;
    const updated = await getPrisma().$transaction(async (transaction) => {
      const row = await transaction.shipment.findFirst({
        where: { id, deletedAt: null },
        include: { documents: true },
      });
      if (!row) {
        throw new DomainError("SHIPMENT_NOT_FOUND", "Shipment not found", 404);
      }
      const documentIds = input.documentIds
        ? [...new Set(input.documentIds)]
        : undefined;
      if (documentIds) {
        const assetCount = await transaction.fileAsset.count({
          where: { id: { in: documentIds }, deletedAt: null },
        });
        if (assetCount !== documentIds.length) {
          throw new DomainError(
            "ATTACHMENT_NOT_FOUND",
            "One or more shipment documents are unavailable",
            409,
          );
        }
      }
      const changed = await transaction.shipment.updateMany({
        where: {
          id,
          version: input.expectedVersion,
          deletedAt: null,
        },
        data: {
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          incoterm: input.incoterm,
          origin: input.origin,
          destination: input.destination,
          originPort: input.originPort,
          destinationPort: input.destinationPort,
          estimatedDepartureAt: input.estimatedDepartureAt,
          estimatedArrivalAt: input.estimatedArrivalAt,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1) {
        throw new DomainError(
          "SHIPMENT_CONFLICT",
          "Shipment changed; refresh and retry",
          409,
        );
      }
      if (documentIds) {
        const previousIds = [
          ...new Set(row.documents.map((document) => document.fileAssetId)),
        ];
        const removedIds = previousIds.filter(
          (fileAssetId) => !documentIds.includes(fileAssetId),
        );
        const addedIds = documentIds.filter(
          (fileAssetId) => !previousIds.includes(fileAssetId),
        );
        if (removedIds.length) {
          await transaction.shipmentDocument.deleteMany({
            where: { shipmentId: id, fileAssetId: { in: removedIds } },
          });
          await transaction.fileAsset.updateMany({
            where: {
              id: { in: removedIds },
              entityType: "Shipment",
              entityId: id,
            },
            data: { entityType: null, entityId: null },
          });
        }
        if (addedIds.length) {
          await transaction.shipmentDocument.createMany({
            data: addedIds.map((fileAssetId) => ({
              shipmentId: id,
              fileAssetId,
              documentType: "OTHER",
            })),
          });
        }
        if (documentIds.length) {
          await transaction.fileAsset.updateMany({
            where: { id: { in: documentIds }, deletedAt: null },
            data: { entityType: "Shipment", entityId: id },
          });
        }
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "shipment.update",
        entityType: "Shipment",
        entityId: id,
        before: {
          version: row.version,
          trackingNumber: row.trackingNumber,
          documentIds: row.documents.map((document) => document.fileAssetId),
        },
        after: {
          version: row.version + 1,
          trackingNumber: input.trackingNumber ?? row.trackingNumber,
          documentIds:
            documentIds ??
            row.documents.map((document) => document.fileAssetId),
        },
      });
      return transaction.shipment.findUniqueOrThrow({
        where: { id },
        include: {
          items: {
            include: {
              inventoryItem: { include: { product: true } },
              serials: { include: { inventorySerial: true } },
            },
          },
          documents: { include: { fileAsset: true } },
        },
      });
    });
    return success(updated);
  } catch (error) {
    return failure(error);
  }
}
