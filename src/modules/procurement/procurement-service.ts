import Decimal from "decimal.js";

import type { Prisma } from "@/generated/prisma/client";
import { writeAudit } from "@/lib/audit";
import { DomainError } from "@/lib/errors";
import { getPrisma } from "@/lib/prisma";
import { can, type AuthorizationContext } from "@/lib/rbac";
import { authorizePurchaseTransition } from "@/modules/orders/purchase-gate";
import {
  assertInspectionResult,
  assertPurchaseOrderLineOwnership,
  assertPurchaseOrderQuantities,
  assertPurchaseOrderTransition,
  assertShipmentTransition,
  aggregateInventoryReservations,
  deriveShipmentOrderState,
  inspectionPassesShipmentGate,
  inventoryBalanceAfter,
  nextSerialStatus,
  remainingShippableQuantity,
  type InventoryMutation,
} from "@/modules/procurement/procurement-domain";
import type {
  InspectionInput,
  InventoryMutationInput,
  InventoryTransferInput,
  PurchaseOrderInput,
  PurchaseOrderReceiptInput,
  ShipmentInput,
  SupplierInput,
} from "@/modules/procurement/procurement-schemas";

type Transaction = Prisma.TransactionClient;

async function nextNumber(transaction: Transaction, key: string) {
  const sequence = await transaction.sequence.update({
    where: { key },
    data: { nextValue: { increment: 1 }, version: { increment: 1 } },
  });
  return `${sequence.prefix}-${(sequence.nextValue - BigInt(1))
    .toString()
    .padStart(sequence.padding, "0")}`;
}

export function maskBankAccount(value: string | null | undefined) {
  if (!value) return null;
  const visible = value.slice(-4);
  return `${"*".repeat(Math.max(4, value.length - 4))}${visible}`;
}

function supplierPresentation<T extends { bankAccountNumber?: string | null }>(
  supplier: T,
  context: AuthorizationContext,
) {
  return {
    ...supplier,
    bankAccountNumber: can(context, "supplier.bank.read")
      ? (supplier.bankAccountNumber ?? null)
      : maskBankAccount(supplier.bankAccountNumber),
  };
}

type SupplierOrderForMetrics = {
  totalUsd: { toString(): string } | string;
  status: string;
  expectedAt: Date | null;
  receivedAt: Date | null;
  items: Array<{
    inventoryItems: Array<{
      inspections: Array<{ status: string }>;
      transactions: Array<{ type: string; quantity: number }>;
    }>;
  }>;
};

export function supplierOperationalMetrics(
  purchaseOrders: readonly SupplierOrderForMetrics[],
) {
  const purchaseTotalUsd = purchaseOrders.reduce(
    (total, order) => total.plus(order.totalUsd.toString()),
    new Decimal(0),
  );
  const received = purchaseOrders.filter((order) => order.status === "RECEIVED");
  const onTime = received.filter(
    (order) =>
      order.receivedAt &&
      (!order.expectedAt || order.receivedAt <= order.expectedAt),
  );
  const inspections = purchaseOrders.flatMap((order) =>
    order.items.flatMap((item) =>
      item.inventoryItems.flatMap((inventory) => inventory.inspections),
    ),
  );
  const completedInspections = inspections.filter(
    (inspection) => inspection.status !== "PENDING",
  );
  const passedInspections = completedInspections.filter(
    (inspection) => inspection.status === "PASSED",
  );
  const returnedUnits = purchaseOrders.reduce(
    (total, order) =>
      total +
      order.items.reduce(
        (itemTotal, item) =>
          itemTotal +
          item.inventoryItems.reduce(
            (inventoryTotal, inventory) =>
              inventoryTotal +
              inventory.transactions
                .filter((transaction) => transaction.type === "RETURN")
                .reduce((sum, transaction) => sum + transaction.quantity, 0),
            0,
          ),
        0,
      ),
    0,
  );
  const percentage = (numerator: number, denominator: number) =>
    denominator
      ? new Decimal(numerator).div(denominator).times(100).toFixed(2)
      : "0.00";
  return {
    purchaseTotalUsd: purchaseTotalUsd.toFixed(4),
    orderCount: purchaseOrders.length,
    receivedOrderCount: received.length,
    deliveryRatePercent: percentage(received.length, purchaseOrders.length),
    onTimeDeliveryRatePercent: percentage(onTime.length, received.length),
    passedInspectionCount: passedInspections.length,
    completedInspectionCount: completedInspections.length,
    qualityPassRatePercent: percentage(
      passedInspections.length,
      completedInspections.length,
    ),
    returnedUnits,
  };
}

async function assertFileAssets(
  transaction: Transaction,
  ids: readonly string[] | undefined,
) {
  if (!ids?.length) return;
  const count = await transaction.fileAsset.count({
    where: { id: { in: [...new Set(ids)] }, deletedAt: null },
  });
  if (count !== new Set(ids).size) {
    throw new DomainError(
      "ATTACHMENT_NOT_FOUND",
      "One or more attachments are unavailable",
      409,
    );
  }
}

async function assertSupplierProducts(
  transaction: Transaction,
  relations: SupplierInput["productRelations"],
) {
  if (!relations?.length) return;
  const productIds = relations.map((relation) => relation.productId);
  const count = await transaction.product.count({
    where: {
      id: { in: productIds },
      deletedAt: null,
      status: "ACTIVE",
    },
  });
  if (count !== productIds.length) {
    throw new DomainError(
      "SUPPLIER_PRODUCT_NOT_FOUND",
      "One or more supplier products are unavailable",
      409,
    );
  }
}

async function updateInventoryConditionally(
  transaction: Transaction,
  current: {
    id: string;
    version: number;
    quantityOnHand: number;
    quantityReserved: number;
  },
  next: { onHand: number; reserved: number },
) {
  const changed = await transaction.inventoryItem.updateMany({
    where: {
      id: current.id,
      version: current.version,
      quantityOnHand: current.quantityOnHand,
      quantityReserved: current.quantityReserved,
      deletedAt: null,
    },
    data: {
      quantityOnHand: next.onHand,
      quantityReserved: next.reserved,
      version: { increment: 1 },
    },
  });
  if (changed.count !== 1) {
    throw new DomainError(
      "INVENTORY_CONFLICT",
      "Inventory changed; refresh and retry",
      409,
    );
  }
}

export class ProcurementService {
  listSuppliers(context: AuthorizationContext) {
    return getPrisma()
      .supplier.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { purchaseOrders: true, products: true } },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  brand: true,
                  category: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
          purchaseOrders: {
            where: { deletedAt: null },
            orderBy: { updatedAt: "desc" },
            include: {
              items: {
                include: {
                  inventoryItems: {
                    include: {
                      inspections: { select: { status: true } },
                      transactions: {
                        where: { type: "RETURN" },
                        select: { type: true, quantity: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
      .then((rows) =>
        rows.map((row) => {
          const brands = [
            ...new Set(
              row.products
                .map((link) => link.product.brand)
                .filter((brand): brand is string => Boolean(brand)),
            ),
          ];
          const categories = [
            ...new Map(
              row.products.map((link) => [
                link.product.category.id,
                link.product.category,
              ]),
            ).values(),
          ];
          return supplierPresentation(
            {
              ...row,
              brands,
              categories,
              metrics: supplierOperationalMetrics(row.purchaseOrders),
              recentPurchaseOrders: row.purchaseOrders.slice(0, 5).map((order) => ({
                id: order.id,
                purchaseOrderNumber: order.purchaseOrderNumber,
                status: order.status,
                totalUsd: order.totalUsd,
                expectedAt: order.expectedAt,
                receivedAt: order.receivedAt,
              })),
            },
            context,
          );
        }),
      );
  }

  getSupplier(id: string, context: AuthorizationContext) {
    return getPrisma()
      .supplier.findFirst({
        where: { id, deletedAt: null },
        include: {
          products: {
            include: {
              product: { include: { category: true } },
            },
          },
          purchaseOrders: {
            where: { deletedAt: null },
            orderBy: { updatedAt: "desc" },
            include: {
              items: {
                include: {
                  product: true,
                  inventoryItems: {
                    include: {
                      inspections: {
                        include: {
                          inventorySerial: {
                            select: { serialNumber: true },
                          },
                        },
                        orderBy: { createdAt: "desc" },
                      },
                      transactions: {
                        where: { type: "RETURN" },
                        include: {
                          inventorySerial: {
                            select: { serialNumber: true },
                          },
                        },
                        orderBy: { occurredAt: "desc" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
      .then((row) => {
        if (!row) return null;
        const brands = [
          ...new Set(
            row.products
              .map((link) => link.product.brand)
              .filter((brand): brand is string => Boolean(brand)),
          ),
        ];
        const categories = [
          ...new Map(
            row.products.map((link) => [
              link.product.category.id,
              link.product.category,
            ]),
          ).values(),
        ];
        return supplierPresentation(
          {
            ...row,
            brands,
            categories,
            metrics: supplierOperationalMetrics(row.purchaseOrders),
            returnHistory: row.purchaseOrders.flatMap((order) =>
              order.items.flatMap((item) =>
                item.inventoryItems.flatMap((inventory) =>
                  inventory.transactions.map((transaction) => ({
                    id: transaction.id,
                    purchaseOrderId: order.id,
                    purchaseOrderNumber: order.purchaseOrderNumber,
                    productId: inventory.productId,
                    inventoryItemId: inventory.id,
                    serialNumber:
                      transaction.inventorySerial?.serialNumber ?? null,
                    quantity: transaction.quantity,
                    occurredAt: transaction.occurredAt,
                    notes: transaction.notes,
                  })),
                ),
              ),
            ),
          },
          context,
        );
      });
  }

  createSupplier(context: AuthorizationContext, input: SupplierInput) {
    return getPrisma().$transaction(async (transaction) => {
      const { productRelations, ...supplier } = input;
      await assertSupplierProducts(transaction, productRelations);
      const row = await transaction.supplier.create({
        data: {
          ...supplier,
          address: supplier.address ?? undefined,
          products: productRelations?.length
            ? { create: productRelations }
            : undefined,
        },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "supplier.create",
        entityType: "Supplier",
        entityId: row.id,
        after: {
          code: row.code,
          name: row.name,
          bankAccountNumber: maskBankAccount(row.bankAccountNumber),
        },
      });
      return supplierPresentation(row, context);
    });
  }

  updateSupplier(
    context: AuthorizationContext,
    id: string,
    input: Partial<SupplierInput> & { expectedVersion: number },
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const row = await transaction.supplier.findFirst({
        where: { id, deletedAt: null },
      });
      if (!row) {
        throw new DomainError("SUPPLIER_NOT_FOUND", "Supplier not found", 404);
      }
      if (row.version !== input.expectedVersion) {
        throw new DomainError(
          "SUPPLIER_CONFLICT",
          "Supplier changed; refresh and retry",
          409,
        );
      }
      const {
        expectedVersion: _,
        productRelations,
        ...changes
      } = input;
      void _;
      await assertSupplierProducts(transaction, productRelations);
      const changed = await transaction.supplier.updateMany({
        where: { id, version: row.version, deletedAt: null },
        data: {
          ...changes,
          address: changes.address ?? undefined,
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
      if (productRelations) {
        await transaction.supplierProduct.deleteMany({
          where: { supplierId: id },
        });
        if (productRelations.length) {
          await transaction.supplierProduct.createMany({
            data: productRelations.map((relation) => ({
              supplierId: id,
              ...relation,
            })),
          });
        }
      }
      const updated = await transaction.supplier.findUniqueOrThrow({ where: { id } });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "supplier.update",
        entityType: "Supplier",
        entityId: id,
        before: {
          version: row.version,
          bankAccountNumber: maskBankAccount(row.bankAccountNumber),
        },
        after: {
          version: updated.version,
          bankAccountNumber: maskBankAccount(updated.bankAccountNumber),
        },
      });
      return supplierPresentation(updated, context);
    });
  }

  listSupplierProductOptions() {
    return getPrisma().product.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      orderBy: { sku: "asc" },
      select: {
        id: true,
        sku: true,
        name: true,
        brand: true,
        category: { select: { id: true, name: true } },
      },
    });
  }

  listPurchaseOrders(context: AuthorizationContext) {
    return getPrisma()
      .purchaseOrder.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        include: {
          supplier: true,
          salesOrder: {
            select: {
              orderNumber: true,
              purchaseEligibilityFlag: true,
              purchaseOverrideAuditId: true,
            },
          },
          buyer: { select: { name: true } },
          items: { include: { product: true } },
        },
      })
      .then((rows) =>
        rows.map((row) => ({
          ...row,
          supplier: supplierPresentation(row.supplier, context),
        })),
      );
  }

  getPurchaseOrder(id: string, context: AuthorizationContext) {
    return getPrisma()
      .purchaseOrder.findFirst({
        where: { id, deletedAt: null },
        include: {
          supplier: true,
          salesOrder: { select: { orderNumber: true } },
          buyer: { select: { name: true } },
          items: { include: { product: true, inventoryItems: true } },
        },
      })
      .then((row) =>
        row
          ? {
              ...row,
              supplier: supplierPresentation(row.supplier, context),
            }
          : null,
      );
  }

  eligibleOrders() {
    return getPrisma().salesOrder.findMany({
      where: {
        deletedAt: null,
        status: "PURCHASING",
        OR: [
          { purchaseEligibilityFlag: true },
          { purchaseOverrideAuditId: { not: null } },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        currencyCode: true,
        total: true,
        items: true,
      },
    });
  }

  createPurchaseOrder(context: AuthorizationContext, input: PurchaseOrderInput) {
    return getPrisma().$transaction(async (transaction) => {
      const supplier = await transaction.supplier.findFirst({
        where: { id: input.supplierId, status: "ACTIVE", deletedAt: null },
      });
      if (!supplier) {
        throw new DomainError(
          "SUPPLIER_NOT_AVAILABLE",
          "Supplier is not active",
          409,
        );
      }
      await assertFileAssets(transaction, input.attachmentIds);

      let linkedItems = new Map<
        string,
        {
          id: string;
          salesOrderId: string;
          productId: string | null;
          description: string;
          configuration: Prisma.JsonValue;
          quantity: number;
          product: {
            id: string;
            sku: string;
            name: string;
            brand: string | null;
            model: string | null;
            serialized: boolean;
          } | null;
        }
      >();
      let overrideAuditId: string | null = null;
      let lockedOrderVersion: number | null = null;

      if (input.salesOrderId) {
        const lockedOrders = await transaction.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "SalesOrder"
          WHERE "id" = ${input.salesOrderId}::uuid
            AND "deletedAt" IS NULL
          FOR UPDATE
        `;
        if (lockedOrders.length !== 1) {
          throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
        }
        await transaction.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "SalesOrderItem"
          WHERE "salesOrderId" = ${input.salesOrderId}::uuid
          ORDER BY "id"
          FOR UPDATE
        `;
        const order = await transaction.salesOrder.findFirst({
          where: { id: input.salesOrderId, deletedAt: null },
          include: {
            items: { include: { product: true } },
            payments: {
              where: { status: "CONFIRMED", deletedAt: null },
              select: { amountUsd: true },
            },
            refunds: {
              where: { refundedAt: { not: null }, deletedAt: null },
              select: { amountUsd: true },
            },
            purchaseOrders: {
              where: { deletedAt: null, status: { not: "CANCELLED" } },
              include: { items: true },
            },
          },
        });
        if (!order) {
          throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
        }
        lockedOrderVersion = order.version;
        if (order.status !== "PURCHASING") {
          throw new DomainError(
            "ORDER_NOT_READY_FOR_PURCHASE",
            "Sales order must be in purchasing status",
            409,
          );
        }
        authorizePurchaseTransition(
          {
            paymentTerms: order.paymentTerms,
            orderTotalUsd: order.totalUsd.toString(),
            confirmedPaymentsUsd: order.payments.map((payment) =>
              payment.amountUsd.toString(),
            ),
            confirmedRefundsUsd: order.refunds.map((refund) =>
              refund.amountUsd.toString(),
            ),
          },
          order.purchaseOverrideAuditId
            ? {
                actorId: order.purchaseOverrideActorId ?? context.userId,
                reason: order.purchaseOverrideReason ?? "Audited override",
              }
            : undefined,
        );
        if (!order.purchaseEligibilityFlag && !order.purchaseOverrideAuditId) {
          throw new DomainError(
            "PURCHASE_PAYMENT_REQUIRED",
            "Sales order is not eligible for purchasing",
            409,
          );
        }
        overrideAuditId = order.purchaseOverrideAuditId;
        const requestedIds = input.items.map((item) => item.salesOrderItemId);
        if (requestedIds.some((id) => !id)) {
          throw new DomainError(
            "PURCHASE_ORDER_ITEM_REQUIRED",
            "Every linked purchase line requires a sales order item",
            409,
          );
        }
        assertPurchaseOrderLineOwnership(
          order.id,
          order.items,
          requestedIds as string[],
        );
        linkedItems = new Map(order.items.map((item) => [item.id, item]));

        assertPurchaseOrderQuantities(
          order.items,
          order.purchaseOrders.flatMap((purchaseOrder) => purchaseOrder.items),
          input.items,
        );
      } else if (input.items.some((item) => item.salesOrderItemId)) {
        throw new DomainError(
          "STOCK_PURCHASE_ITEM_MISMATCH",
          "Stock purchase lines cannot reference a sales order item",
          409,
        );
      }

      const total = input.items.reduce(
        (sum, item) => sum.plus(new Decimal(item.unitCost).times(item.quantity)),
        new Decimal(0),
      );
      const itemSnapshots: Prisma.PurchaseOrderItemUncheckedCreateWithoutPurchaseOrderInput[] =
        input.items.map((item) => {
        const source = item.salesOrderItemId
          ? linkedItems.get(item.salesOrderItemId)
          : undefined;
        if (!source && !item.description) {
          throw new DomainError(
            "PURCHASE_DESCRIPTION_REQUIRED",
            "Stock purchase lines require a description",
            409,
          );
        }
        return {
          salesOrderItemId: item.salesOrderItemId,
          productId: source?.productId ?? item.productId,
          description: source?.description ?? item.description!,
          productSnapshot: source?.product
            ? {
                id: source.product.id,
                sku: source.product.sku,
                name: source.product.name,
                brand: source.product.brand,
                model: source.product.model,
                serialized: source.product.serialized,
              }
            : undefined,
          configurationSnapshot:
            source?.configuration ??
            item.configurationSnapshot ??
            undefined,
          quantity: item.quantity,
          unitCost: item.unitCost,
          lineTotal: new Decimal(item.unitCost)
            .times(item.quantity)
            .toFixed(4),
        };
      });

      const purchaseOrder = await transaction.purchaseOrder.create({
        data: {
          purchaseOrderNumber: await nextNumber(transaction, "purchase_order"),
          supplierId: input.supplierId,
          salesOrderId: input.salesOrderId,
          buyerId: context.userId,
          currencyCode: input.currencyCode,
          exchangeRateToUsd: input.exchangeRateToUsd,
          total: total.toFixed(4),
          totalUsd: total.times(input.exchangeRateToUsd).toFixed(4),
          paymentTerms: input.paymentTerms ?? supplier.paymentTerms,
          shippingTerms: input.shippingTerms,
          incoterm: input.incoterm,
          deliveryAddress: input.deliveryAddress ?? undefined,
          notes: input.notes,
          attachments: input.attachmentIds ?? [],
          expectedAt: input.expectedAt,
          items: { create: itemSnapshots },
        },
        include: { items: true },
      });

      if (input.salesOrderId && lockedOrderVersion !== null) {
        const orderClaimed = await transaction.salesOrder.updateMany({
          where: {
            id: input.salesOrderId,
            version: lockedOrderVersion,
            deletedAt: null,
          },
          data: { version: { increment: 1 } },
        });
        if (orderClaimed.count !== 1) {
          throw new DomainError(
            "PURCHASE_ORDER_CONFLICT",
            "Sales order changed while creating the purchase order; refresh and retry",
            409,
          );
        }
      }

      if (input.attachmentIds?.length) {
        await transaction.fileAsset.updateMany({
          where: { id: { in: input.attachmentIds }, deletedAt: null },
          data: { entityType: "PurchaseOrder", entityId: purchaseOrder.id },
        });
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "purchase_order.create",
        entityType: "PurchaseOrder",
        entityId: purchaseOrder.id,
        after: {
          number: purchaseOrder.purchaseOrderNumber,
          salesOrderId: purchaseOrder.salesOrderId,
          purchaseOverrideAuditId: overrideAuditId,
          totalUsd: purchaseOrder.totalUsd.toString(),
        },
      });
      return purchaseOrder;
    });
  }

  transitionPurchaseOrder(
    context: AuthorizationContext,
    id: string,
    status: string,
    expectedVersion: number,
  ) {
    return getPrisma().$transaction(async (transaction) => {
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
      assertPurchaseOrderTransition(row.status, status);
      if (["PARTIALLY_RECEIVED", "RECEIVED"].includes(status)) {
        throw new DomainError(
          "PURCHASE_RECEIPT_ENDPOINT_REQUIRED",
          "Use the receiving workflow to record received quantities and inventory",
          409,
        );
      }
      const changed = await transaction.purchaseOrder.updateMany({
        where: {
          id,
          status: row.status,
          version: expectedVersion,
          deletedAt: null,
        },
        data: {
          status: status as never,
          receivedAt: status === "RECEIVED" ? new Date() : row.receivedAt,
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
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "purchase_order.status_change",
        entityType: "PurchaseOrder",
        entityId: id,
        before: { status: row.status, version: row.version },
        after: { status, version: row.version + 1 },
      });
      return transaction.purchaseOrder.findUniqueOrThrow({ where: { id } });
    });
  }

  receivePurchaseOrder(
    context: AuthorizationContext,
    id: string,
    input: PurchaseOrderReceiptInput,
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const purchaseOrder = await transaction.purchaseOrder.findFirst({
        where: { id, deletedAt: null },
        include: { items: { include: { product: true } } },
      });
      if (!purchaseOrder) {
        throw new DomainError(
          "PURCHASE_ORDER_NOT_FOUND",
          "Purchase order not found",
          404,
        );
      }
      if (!["SENT", "PARTIALLY_RECEIVED"].includes(purchaseOrder.status)) {
        throw new DomainError(
          "PURCHASE_ORDER_NOT_RECEIVABLE",
          "Purchase order must be sent before receiving",
          409,
        );
      }
      if (purchaseOrder.version !== input.expectedVersion) {
        throw new DomainError(
          "PURCHASE_ORDER_CONFLICT",
          "Purchase order changed; refresh and retry",
          409,
        );
      }
      const location = await transaction.warehouseLocation.findUnique({
        where: { id: input.locationId },
        include: { warehouse: true },
      });
      if (!location || location.warehouse.deletedAt) {
        throw new DomainError(
          "WAREHOUSE_LOCATION_NOT_FOUND",
          "Warehouse location not found",
          404,
        );
      }
      const requestedIds = new Set(input.items.map((item) => item.purchaseOrderItemId));
      if (requestedIds.size !== input.items.length) {
        throw new DomainError(
          "DUPLICATE_RECEIPT_ITEM",
          "A receipt can include each purchase line once",
          409,
        );
      }

      for (const receipt of input.items) {
        const line = purchaseOrder.items.find(
          (item) => item.id === receipt.purchaseOrderItemId,
        );
        if (!line) {
          throw new DomainError(
            "PURCHASE_RECEIPT_ITEM_MISMATCH",
            "Receipt line does not belong to the purchase order",
            409,
          );
        }
        if (line.receivedQuantity + receipt.quantity > line.quantity) {
          throw new DomainError(
            "PURCHASE_RECEIPT_OVER_QUANTITY",
            "Received quantity exceeds the purchase order line",
            409,
          );
        }
        if (!line.productId || !line.product) {
          throw new DomainError(
            "PURCHASE_RECEIPT_PRODUCT_REQUIRED",
            "Purchase line must identify a product before receiving",
            409,
          );
        }
        const serialNumbers = receipt.serialNumbers ?? [];
        if (line.product.serialized && serialNumbers.length !== receipt.quantity) {
          throw new DomainError(
            "PURCHASE_RECEIPT_SERIAL_COUNT",
            "Serialized receipt requires one unique serial per unit",
            409,
          );
        }
        if (!line.product.serialized && serialNumbers.length) {
          throw new DomainError(
            "PURCHASE_RECEIPT_UNEXPECTED_SERIAL",
            "Non-serialized receipt cannot include serial numbers",
            409,
          );
        }
        if (new Set(serialNumbers).size !== serialNumbers.length) {
          throw new DomainError(
            "DUPLICATE_SERIAL",
            "Serial numbers must be unique",
            409,
          );
        }

        let inventory = await transaction.inventoryItem.findFirst({
          where: {
            productId: line.productId,
            locationId: input.locationId,
            purchaseOrderItemId: line.id,
            deletedAt: null,
          },
        });
        if (!inventory) {
          inventory = await transaction.inventoryItem.create({
            data: {
              productId: line.productId,
              locationId: input.locationId,
              purchaseOrderItemId: line.id,
              quantityOnHand: 0,
              unitCostUsd: new Decimal(line.unitCost)
                .times(purchaseOrder.exchangeRateToUsd)
                .toFixed(4),
            },
          });
        }
        const next = inventoryBalanceAfter(
          {
            onHand: inventory.quantityOnHand,
            reserved: inventory.quantityReserved,
          },
          "RECEIPT",
          receipt.quantity,
        );
        await updateInventoryConditionally(transaction, inventory, next);

        if (line.product.serialized) {
          for (const serialNumber of serialNumbers) {
            const serial = await transaction.inventorySerial.create({
              data: {
                inventoryItemId: inventory.id,
                serialNumber,
                status: "AVAILABLE",
                receivedAt: new Date(),
              },
            });
            await transaction.inventoryTransaction.create({
              data: {
                inventoryItemId: inventory.id,
                inventorySerialId: serial.id,
                type: "RECEIPT",
                quantity: 1,
                toLocationId: input.locationId,
                referenceType: "PurchaseOrder",
                referenceId: purchaseOrder.id,
                createdById: context.userId,
              },
            });
          }
        } else {
          await transaction.inventoryTransaction.create({
            data: {
              inventoryItemId: inventory.id,
              type: "RECEIPT",
              quantity: receipt.quantity,
              toLocationId: input.locationId,
              referenceType: "PurchaseOrder",
              referenceId: purchaseOrder.id,
              createdById: context.userId,
            },
          });
        }
        const changedLine = await transaction.purchaseOrderItem.updateMany({
          where: { id: line.id, receivedQuantity: line.receivedQuantity },
          data: { receivedQuantity: { increment: receipt.quantity } },
        });
        if (changedLine.count !== 1) {
          throw new DomainError(
            "PURCHASE_RECEIPT_CONFLICT",
            "Purchase receipt changed; refresh and retry",
            409,
          );
        }
      }

      const refreshedItems = await transaction.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });
      const fullyReceived = refreshedItems.every(
        (item) => item.receivedQuantity === item.quantity,
      );
      const changed = await transaction.purchaseOrder.updateMany({
        where: {
          id,
          version: input.expectedVersion,
          status: purchaseOrder.status,
        },
        data: {
          status: fullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
          receivedAt: fullyReceived ? new Date() : null,
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
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "purchase_order.receive",
        entityType: "PurchaseOrder",
        entityId: id,
        before: { status: purchaseOrder.status },
        after: {
          status: fullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
          locationId: input.locationId,
          items: input.items.map((item) => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            quantity: item.quantity,
          })),
        },
      });
      return transaction.purchaseOrder.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });
    });
  }

  listInventory() {
    return getPrisma().inventoryItem.findMany({
      where: { deletedAt: null },
      include: {
        product: true,
        location: { include: { warehouse: true } },
        serials: true,
        inspections: { orderBy: { createdAt: "desc" }, take: 5 },
        purchaseOrderItem: { include: { purchaseOrder: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  listWarehouseLocations() {
    return getPrisma().warehouseLocation.findMany({
      where: { warehouse: { deletedAt: null, status: "ACTIVE" } },
      include: { warehouse: true },
      orderBy: [{ warehouse: { code: "asc" } }, { code: "asc" }],
    });
  }

  mutateInventory(context: AuthorizationContext, input: InventoryMutationInput) {
    return getPrisma().$transaction(async (transaction) => {
      const item = await transaction.inventoryItem.findFirst({
        where: { id: input.inventoryItemId, deletedAt: null },
        include: { product: true },
      });
      if (!item) {
        throw new DomainError("INVENTORY_NOT_FOUND", "Inventory item not found", 404);
      }
      if (item.version !== input.expectedVersion) {
        throw new DomainError(
          "INVENTORY_CONFLICT",
          "Inventory changed; refresh and retry",
          409,
        );
      }

      const existingSerial = input.serialNumber
        ? await transaction.inventorySerial.findUnique({
            where: { serialNumber: input.serialNumber },
          })
        : null;
      if (
        existingSerial &&
        existingSerial.inventoryItemId !== item.id
      ) {
        throw new DomainError(
          "SERIAL_IN_DIFFERENT_STOCK",
          "Serial number belongs to another inventory item",
          409,
        );
      }
      const serialStatus = nextSerialStatus({
        mutation: input.type,
        serialized: item.product.serialized,
        quantity: input.quantity,
        serialNumber: input.serialNumber,
        currentStatus: existingSerial?.status,
      });
      if (!item.product.serialized && input.serialNumber) {
        throw new DomainError(
          "UNEXPECTED_SERIAL",
          "Non-serialized inventory cannot include a serial number",
          409,
        );
      }
      const consumeReserved =
        input.type === "ISSUE" && existingSerial?.status === "RESERVED";
      const next = inventoryBalanceAfter(
        { onHand: item.quantityOnHand, reserved: item.quantityReserved },
        input.type as InventoryMutation,
        input.quantity,
        { consumeReserved },
      );

      let serialId: string | undefined;
      if (item.product.serialized && input.type === "RECEIPT") {
        if (existingSerial) {
          throw new DomainError(
            "DUPLICATE_SERIAL",
            "Serial number already exists",
            409,
          );
        }
        const serial = await transaction.inventorySerial.create({
          data: {
            inventoryItemId: item.id,
            serialNumber: input.serialNumber!,
            status: serialStatus,
            receivedAt: new Date(),
          },
        });
        serialId = serial.id;
      } else if (item.product.serialized) {
        if (!existingSerial) {
          throw new DomainError("SERIAL_NOT_FOUND", "Serial number not found", 404);
        }
        const serialChanged = await transaction.inventorySerial.updateMany({
          where: { id: existingSerial.id, status: existingSerial.status },
          data: {
            status: serialStatus,
            issuedAt:
              input.type === "ISSUE"
                ? new Date()
                : input.type === "RETURN"
                  ? null
                  : existingSerial.issuedAt,
          },
        });
        if (serialChanged.count !== 1) {
          throw new DomainError(
            "SERIAL_CONFLICT",
            "Serial state changed; refresh and retry",
            409,
          );
        }
        serialId = existingSerial.id;
      }

      await updateInventoryConditionally(transaction, item, next);
      await transaction.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          inventorySerialId: serialId,
          type: input.type,
          quantity: input.quantity,
          referenceType: "manual",
          notes: input.notes,
          createdById: context.userId,
        },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "inventory.mutate",
        entityType: "InventoryItem",
        entityId: item.id,
        before: {
          onHand: item.quantityOnHand,
          reserved: item.quantityReserved,
          version: item.version,
          serialStatus: existingSerial?.status,
        },
        after: {
          ...next,
          version: item.version + 1,
          serialNumber: input.serialNumber,
          serialStatus,
        },
      });
      return transaction.inventoryItem.findUniqueOrThrow({
        where: { id: item.id },
        include: { serials: true },
      });
    });
  }

  transferInventory(
    context: AuthorizationContext,
    input: InventoryTransferInput,
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const source = await transaction.inventoryItem.findFirst({
        where: { id: input.inventoryItemId, deletedAt: null },
        include: { product: true },
      });
      if (!source) {
        throw new DomainError("INVENTORY_NOT_FOUND", "Inventory item not found", 404);
      }
      if (source.version !== input.expectedVersion) {
        throw new DomainError(
          "INVENTORY_CONFLICT",
          "Inventory changed; refresh and retry",
          409,
        );
      }
      if (source.locationId === input.toLocationId) {
        throw new DomainError(
          "SAME_WAREHOUSE_LOCATION",
          "Source and destination locations must differ",
          409,
        );
      }
      const destinationLocation = await transaction.warehouseLocation.findUnique({
        where: { id: input.toLocationId },
        include: { warehouse: true },
      });
      if (!destinationLocation || destinationLocation.warehouse.deletedAt) {
        throw new DomainError(
          "WAREHOUSE_LOCATION_NOT_FOUND",
          "Destination warehouse location not found",
          404,
        );
      }
      const serialNumbers = input.serialNumbers ?? [];
      if (
        source.product.serialized &&
        serialNumbers.length !== input.quantity
      ) {
        throw new DomainError(
          "TRANSFER_SERIAL_COUNT",
          "Serialized transfer requires one serial per unit",
          409,
        );
      }
      if (!source.product.serialized && serialNumbers.length) {
        throw new DomainError(
          "UNEXPECTED_SERIAL",
          "Non-serialized transfer cannot include serial numbers",
          409,
        );
      }
      const serials = source.product.serialized
        ? await transaction.inventorySerial.findMany({
            where: {
              inventoryItemId: source.id,
              serialNumber: { in: serialNumbers },
              status: "AVAILABLE",
            },
          })
        : [];
      if (source.product.serialized && serials.length !== input.quantity) {
        throw new DomainError(
          "SERIAL_UNAVAILABLE",
          "Every transferred serial must be available in the source location",
          409,
        );
      }
      const sourceNext = inventoryBalanceAfter(
        { onHand: source.quantityOnHand, reserved: source.quantityReserved },
        "ISSUE",
        input.quantity,
      );
      await updateInventoryConditionally(transaction, source, sourceNext);

      let destination = await transaction.inventoryItem.findFirst({
        where: {
          productId: source.productId,
          locationId: input.toLocationId,
          purchaseOrderItemId: source.purchaseOrderItemId,
          deletedAt: null,
        },
      });
      if (!destination) {
        destination = await transaction.inventoryItem.create({
          data: {
            productId: source.productId,
            locationId: input.toLocationId,
            purchaseOrderItemId: source.purchaseOrderItemId,
            quantityOnHand: 0,
            unitCostUsd: source.unitCostUsd,
          },
        });
      }
      const destinationNext = inventoryBalanceAfter(
        {
          onHand: destination.quantityOnHand,
          reserved: destination.quantityReserved,
        },
        "RECEIPT",
        input.quantity,
      );
      await updateInventoryConditionally(transaction, destination, destinationNext);

      for (const serial of serials) {
        const changed = await transaction.inventorySerial.updateMany({
          where: {
            id: serial.id,
            inventoryItemId: source.id,
            status: "AVAILABLE",
          },
          data: { inventoryItemId: destination.id },
        });
        if (changed.count !== 1) {
          throw new DomainError(
            "SERIAL_CONFLICT",
            "Serial state changed; refresh and retry",
            409,
          );
        }
      }
      await transaction.inventoryTransaction.create({
        data: {
          inventoryItemId: source.id,
          type: "TRANSFER",
          quantity: input.quantity,
          fromLocationId: source.locationId,
          toLocationId: input.toLocationId,
          referenceType: "InventoryTransfer",
          notes: input.notes,
          createdById: context.userId,
        },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "inventory.transfer",
        entityType: "InventoryItem",
        entityId: source.id,
        before: { locationId: source.locationId, ...sourceNext },
        after: {
          locationId: input.toLocationId,
          inventoryItemId: destination.id,
          ...destinationNext,
          serialNumbers,
        },
      });
      return { source: sourceNext, destination: destinationNext };
    });
  }

  listInspections() {
    return getPrisma().qualityInspection.findMany({
      include: {
        inventoryItem: { include: { product: true } },
        inventorySerial: true,
        inspector: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  createInspection(context: AuthorizationContext, input: InspectionInput) {
    assertInspectionResult(input.status, input.checklist);
    return getPrisma().$transaction(async (transaction) => {
      const inventory = await transaction.inventoryItem.findFirst({
        where: { id: input.inventoryItemId, deletedAt: null },
        include: { product: true },
      });
      if (!inventory) {
        throw new DomainError("INVENTORY_NOT_FOUND", "Inventory item not found", 404);
      }
      if (inventory.product.serialized && !input.inventorySerialId) {
        throw new DomainError(
          "INSPECTION_SERIAL_REQUIRED",
          "Serialized inventory must be inspected by serial number",
          409,
        );
      }
      if (input.inventorySerialId) {
        const serial = await transaction.inventorySerial.findFirst({
          where: {
            id: input.inventorySerialId,
            inventoryItemId: inventory.id,
            status: { in: ["AVAILABLE", "RESERVED"] },
          },
        });
        if (!serial) {
          throw new DomainError(
            "INSPECTION_SERIAL_MISMATCH",
            "Inspection serial does not belong to the inventory item",
            409,
          );
        }
      }
      const inspection = await transaction.qualityInspection.create({
        data: {
          inventoryItemId: input.inventoryItemId,
          inventorySerialId: input.inventorySerialId,
          inspectorId: context.userId,
          status: input.status,
          checklist: {
            ...input.checklist,
            evidence: input.evidence ?? [],
          },
          notes: input.notes,
          inspectedAt: input.status === "PENDING" ? null : new Date(),
        },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "quality_inspection.create",
        entityType: "QualityInspection",
        entityId: inspection.id,
        after: {
          status: inspection.status,
          inventoryItemId: inspection.inventoryItemId,
          inventorySerialId: inspection.inventorySerialId,
        },
      });
      return inspection;
    });
  }

  listShipments() {
    return getPrisma().shipment.findMany({
      where: { deletedAt: null },
      include: {
        salesOrder: { select: { orderNumber: true } },
        coordinator: { select: { name: true } },
        items: {
          include: {
            inventoryItem: { include: { product: true } },
            serials: { include: { inventorySerial: true } },
          },
        },
        documents: { include: { fileAsset: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  eligibleShipmentOrders() {
    return getPrisma().salesOrder.findMany({
      where: {
        deletedAt: null,
        status: { in: ["PURCHASING", "FULFILLING"] },
      },
      include: {
        items: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  createShipment(context: AuthorizationContext, input: ShipmentInput) {
    return getPrisma().$transaction(async (transaction) => {
      const order = await transaction.salesOrder.findFirst({
        where: {
          id: input.salesOrderId,
          deletedAt: null,
          status: { in: ["FULFILLING", "PURCHASING"] },
        },
        include: {
          items: true,
          shipments: {
            where: { deletedAt: null, status: { not: "CANCELLED" } },
            include: { items: true },
          },
        },
      });
      if (!order) {
        throw new DomainError(
          "ORDER_NOT_READY_FOR_SHIPMENT",
          "Order must be purchasing or fulfilling before shipment",
          409,
        );
      }
      await assertFileAssets(transaction, input.documentIds);
      if (new Set(input.items.map((item) => item.salesOrderItemId)).size !== input.items.length) {
        throw new DomainError(
          "DUPLICATE_SHIPMENT_ITEM",
          "A shipment can include each sales order line once",
          409,
        );
      }

      const reservationPlans: Array<{
        input: ShipmentInput["items"][number];
        inventory: Awaited<
          ReturnType<Transaction["inventoryItem"]["findFirstOrThrow"]>
        > & {
          product: { serialized: boolean };
        };
        serials: Array<{ id: string; status: string; serialNumber: string }>;
      }> = [];

      for (const item of input.items) {
        const source = order.items.find(
          (orderItem) => orderItem.id === item.salesOrderItemId,
        );
        if (!source || !source.productId) {
          throw new DomainError(
            "INVALID_SHIPMENT_ITEM",
            "Shipment item does not belong to the sales order or has no product",
            409,
          );
        }
        const activeQuantities = order.shipments.flatMap((shipment) =>
          shipment.items
            .filter(
              (shipmentItem) =>
                shipmentItem.salesOrderItemId === item.salesOrderItemId,
            )
            .map((shipmentItem) => shipmentItem.quantity),
        );
        const remaining = remainingShippableQuantity(
          source.quantity,
          activeQuantities,
        );
        if (item.quantity > remaining) {
          throw new DomainError(
            "SHIPMENT_OVER_QUANTITY",
            "Shipment quantity exceeds the remaining sales order quantity",
            409,
          );
        }
        const inventory = await transaction.inventoryItem.findFirst({
          where: {
            id: item.inventoryItemId,
            productId: source.productId,
            deletedAt: null,
          },
          include: { product: true },
        });
        if (!inventory) {
          throw new DomainError(
            "SHIPMENT_INVENTORY_MISMATCH",
            "Shipment inventory does not match the sales order product",
            409,
          );
        }
        inventoryBalanceAfter(
          {
            onHand: inventory.quantityOnHand,
            reserved: inventory.quantityReserved,
          },
          "RESERVATION",
          item.quantity,
        );

        const serialNumbers = item.serialNumbers ?? [];
        let serials: Array<{ id: string; status: string; serialNumber: string }> = [];
        if (inventory.product.serialized) {
          if (
            serialNumbers.length !== item.quantity ||
            new Set(serialNumbers).size !== serialNumbers.length
          ) {
            throw new DomainError(
              "SHIPMENT_SERIAL_COUNT",
              "Serialized shipment requires one unique serial per unit",
              409,
            );
          }
          serials = await transaction.inventorySerial.findMany({
            where: {
              inventoryItemId: inventory.id,
              serialNumber: { in: serialNumbers },
              status: "AVAILABLE",
            },
            select: { id: true, status: true, serialNumber: true },
          });
          if (serials.length !== item.quantity) {
            throw new DomainError(
              "SERIAL_UNAVAILABLE",
              "Every shipment serial must be available",
              409,
            );
          }
          const inspections = await transaction.qualityInspection.findMany({
            where: {
              inventorySerialId: { in: serials.map((serial) => serial.id) },
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: {
              inventorySerialId: true,
              status: true,
              checklist: true,
            },
          });
          const latestBySerial = new Map<
            string,
            (typeof inspections)[number]
          >();
          for (const inspection of inspections) {
            if (
              inspection.inventorySerialId &&
              !latestBySerial.has(inspection.inventorySerialId)
            ) {
              latestBySerial.set(inspection.inventorySerialId, inspection);
            }
          }
          if (
            serials.some((serial) => {
              const latest = latestBySerial.get(serial.id);
              return !latest || !inspectionPassesShipmentGate(latest);
            })
          ) {
            throw new DomainError(
              "SHIPMENT_INSPECTION_REQUIRED",
              "Every serialized shipment unit requires a latest passing inspection with a completed checklist",
              409,
            );
          }
        } else {
          if (serialNumbers.length) {
            throw new DomainError(
              "UNEXPECTED_SERIAL",
              "Non-serialized shipment cannot include serial numbers",
              409,
            );
          }
          const latestInspection = await transaction.qualityInspection.findFirst({
            where: {
              inventoryItemId: inventory.id,
              inventorySerialId: null,
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { status: true, checklist: true },
          });
          if (
            !latestInspection ||
            !inspectionPassesShipmentGate(latestInspection)
          ) {
            throw new DomainError(
              "SHIPMENT_INSPECTION_REQUIRED",
              "Inventory requires a latest passing inspection with a completed checklist before shipment",
              409,
            );
          }
        }
        reservationPlans.push({ input: item, inventory, serials });
      }

      const freightCostUsd =
        input.freightCost &&
        input.freightExchangeRateToUsd
          ? new Decimal(input.freightCost)
              .times(input.freightExchangeRateToUsd)
              .toFixed(4)
          : null;
      const shipment = await transaction.shipment.create({
        data: {
          shipmentNumber: await nextNumber(transaction, "shipment"),
          salesOrderId: input.salesOrderId,
          coordinatorId: context.userId,
          status: "BOOKED",
          method: input.method,
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          incoterm: input.incoterm,
          origin: input.origin,
          destination: input.destination,
          originPort: input.originPort,
          destinationPort: input.destinationPort,
          grossWeightKg: input.grossWeightKg,
          volumeCbm: input.volumeCbm,
          freightCost: input.freightCost,
          freightCurrencyCode: input.freightCurrencyCode,
          freightExchangeRateToUsd: input.freightExchangeRateToUsd,
          freightCostUsd,
          estimatedDepartureAt: input.estimatedDepartureAt,
          estimatedArrivalAt: input.estimatedArrivalAt,
        },
      });

      const uniqueInventory = new Map(
        reservationPlans.map((plan) => [plan.inventory.id, plan.inventory]),
      );
      const projectedReservations = aggregateInventoryReservations(
        Object.fromEntries(
          [...uniqueInventory].map(([inventoryItemId, inventory]) => [
            inventoryItemId,
            {
              onHand: inventory.quantityOnHand,
              reserved: inventory.quantityReserved,
            },
          ]),
        ),
        reservationPlans.map((plan) => ({
          inventoryItemId: plan.inventory.id,
          quantity: plan.input.quantity,
        })),
      );
      for (const [inventoryItemId, inventory] of uniqueInventory) {
        await updateInventoryConditionally(
          transaction,
          inventory,
          projectedReservations[inventoryItemId],
        );
      }

      for (const plan of reservationPlans) {
        const shipmentItem = await transaction.shipmentItem.create({
          data: {
            shipmentId: shipment.id,
            salesOrderItemId: plan.input.salesOrderItemId,
            inventoryItemId: plan.inventory.id,
            quantity: plan.input.quantity,
          },
        });
        if (plan.inventory.product.serialized) {
          for (const serial of plan.serials) {
            const changed = await transaction.inventorySerial.updateMany({
              where: { id: serial.id, status: "AVAILABLE" },
              data: { status: "RESERVED" },
            });
            if (changed.count !== 1) {
              throw new DomainError(
                "SERIAL_CONFLICT",
                "Serial state changed; refresh and retry",
                409,
              );
            }
            await transaction.shipmentSerial.create({
              data: {
                shipmentItemId: shipmentItem.id,
                inventorySerialId: serial.id,
                status: "RESERVED",
              },
            });
            await transaction.inventoryTransaction.create({
              data: {
                inventoryItemId: plan.inventory.id,
                inventorySerialId: serial.id,
                type: "RESERVATION",
                quantity: 1,
                referenceType: "Shipment",
                referenceId: shipment.id,
                createdById: context.userId,
              },
            });
          }
        } else {
          await transaction.inventoryTransaction.create({
            data: {
              inventoryItemId: plan.inventory.id,
              type: "RESERVATION",
              quantity: plan.input.quantity,
              referenceType: "Shipment",
              referenceId: shipment.id,
              createdById: context.userId,
            },
          });
        }
      }
      if (input.documentIds?.length) {
        await transaction.shipmentDocument.createMany({
          data: input.documentIds.map((fileAssetId) => ({
            shipmentId: shipment.id,
            fileAssetId,
            documentType: "OTHER",
          })),
        });
        await transaction.fileAsset.updateMany({
          where: { id: { in: input.documentIds }, deletedAt: null },
          data: { entityType: "Shipment", entityId: shipment.id },
        });
      }
      const orderChanged = await transaction.salesOrder.updateMany({
        where: { id: order.id, version: order.version },
        data: {
          status: "FULFILLING",
          shipmentStatus: "BOOKED",
          version: { increment: 1 },
        },
      });
      if (orderChanged.count !== 1) {
        throw new DomainError(
          "ORDER_SHIPMENT_CONFLICT",
          "Order changed while reserving shipment; refresh and retry",
          409,
        );
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "shipment.create",
        entityType: "Shipment",
        entityId: shipment.id,
        after: {
          number: shipment.shipmentNumber,
          orderId: shipment.salesOrderId,
          items: reservationPlans.map((plan) => ({
            salesOrderItemId: plan.input.salesOrderItemId,
            inventoryItemId: plan.input.inventoryItemId,
            quantity: plan.input.quantity,
            serialNumbers: plan.serials.map((serial) => serial.serialNumber),
          })),
        },
      });
      return transaction.shipment.findUniqueOrThrow({
        where: { id: shipment.id },
        include: {
          items: {
            include: {
              serials: { include: { inventorySerial: true } },
            },
          },
          documents: true,
        },
      });
    });
  }

  transitionShipment(
    context: AuthorizationContext,
    id: string,
    status: string,
    expectedVersion: number,
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const shipment = await transaction.shipment.findFirst({
        where: { id, deletedAt: null },
        include: {
          items: {
            include: {
              inventoryItem: true,
              serials: { include: { inventorySerial: true } },
            },
          },
          salesOrder: { include: { items: true } },
        },
      });
      if (!shipment) {
        throw new DomainError("SHIPMENT_NOT_FOUND", "Shipment not found", 404);
      }
      assertShipmentTransition(shipment.status, status);
      const changed = await transaction.shipment.updateMany({
        where: {
          id,
          status: shipment.status,
          version: expectedVersion,
          deletedAt: null,
        },
        data: {
          status: status as never,
          shippedAt: status === "IN_TRANSIT" ? new Date() : shipment.shippedAt,
          deliveredAt: status === "DELIVERED" ? new Date() : shipment.deliveredAt,
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

      if (status === "IN_TRANSIT" || status === "CANCELLED") {
        const inventoryById = new Map<
          string,
          NonNullable<(typeof shipment.items)[number]["inventoryItem"]>
        >();
        const projected: Record<string, { onHand: number; reserved: number }> = {};
        for (const item of shipment.items) {
          if (!item.inventoryItem) {
            throw new DomainError(
              "SHIPMENT_INVENTORY_MISSING",
              "Shipment item has no inventory assignment",
              409,
            );
          }
          inventoryById.set(item.inventoryItem.id, item.inventoryItem);
          const current = projected[item.inventoryItem.id] ?? {
            onHand: item.inventoryItem.quantityOnHand,
            reserved: item.inventoryItem.quantityReserved,
          };
          projected[item.inventoryItem.id] = inventoryBalanceAfter(
            current,
            status === "IN_TRANSIT" ? "ISSUE" : "RELEASE",
            item.quantity,
            { consumeReserved: status === "IN_TRANSIT" },
          );
        }
        for (const [inventoryItemId, inventory] of inventoryById) {
          await updateInventoryConditionally(
            transaction,
            inventory,
            projected[inventoryItemId],
          );
        }

        for (const item of shipment.items) {
          if (!item.inventoryItem) {
            throw new DomainError(
              "SHIPMENT_INVENTORY_MISSING",
              "Shipment item has no inventory assignment",
              409,
            );
          }
          const mutation = status === "IN_TRANSIT" ? "ISSUE" : "RELEASE";
          if (item.serials.length) {
            if (item.serials.length !== item.quantity) {
              throw new DomainError(
                "SHIPMENT_SERIAL_TRAIL_INCOMPLETE",
                "Shipment serial trail does not match the shipment quantity",
                409,
              );
            }
            for (const trail of item.serials) {
              const nextStatus = status === "IN_TRANSIT" ? "ISSUED" : "AVAILABLE";
              const serialChanged = await transaction.inventorySerial.updateMany({
                where: {
                  id: trail.inventorySerialId,
                  status: "RESERVED",
                },
                data: {
                  status: nextStatus,
                  issuedAt: status === "IN_TRANSIT" ? new Date() : null,
                },
              });
              if (serialChanged.count !== 1) {
                throw new DomainError(
                  "SERIAL_CONFLICT",
                  "Serial state changed; refresh and retry",
                  409,
                );
              }
              await transaction.shipmentSerial.update({
                where: { id: trail.id },
                data:
                  status === "IN_TRANSIT"
                    ? { status: "ISSUED", issuedAt: new Date() }
                    : { status: "RELEASED", releasedAt: new Date() },
              });
              await transaction.inventoryTransaction.create({
                data: {
                  inventoryItemId: item.inventoryItem.id,
                  inventorySerialId: trail.inventorySerialId,
                  type: mutation,
                  quantity: 1,
                  referenceType: "Shipment",
                  referenceId: shipment.id,
                  createdById: context.userId,
                },
              });
            }
          } else {
            await transaction.inventoryTransaction.create({
              data: {
                inventoryItemId: item.inventoryItem.id,
                type: mutation,
                quantity: item.quantity,
                referenceType: "Shipment",
                referenceId: shipment.id,
                createdById: context.userId,
              },
            });
          }
        }
      }

      const orderShipments = await transaction.shipment.findMany({
        where: {
          salesOrderId: shipment.salesOrderId,
          deletedAt: null,
          status: { not: "CANCELLED" },
        },
        include: { items: true },
      });
      const { orderStatus, shipmentStatus } = deriveShipmentOrderState(
        shipment.salesOrder.items,
        orderShipments.flatMap((row) =>
          row.items.map((item) => ({
            status: row.status,
            salesOrderItemId: item.salesOrderItemId,
            quantity: item.quantity,
          })),
        ),
      );
      const orderChanged = await transaction.salesOrder.updateMany({
        where: {
          id: shipment.salesOrderId,
          version: shipment.salesOrder.version,
          deletedAt: null,
        },
        data: {
          status: orderStatus,
          shipmentStatus,
          version: { increment: 1 },
        },
      });
      if (orderChanged.count !== 1) {
        throw new DomainError(
          "ORDER_SHIPMENT_CONFLICT",
          "Order changed while synchronizing shipment; refresh and retry",
          409,
        );
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "shipment.status_change",
        entityType: "Shipment",
        entityId: id,
        before: { status: shipment.status, version: shipment.version },
        after: {
          status,
          version: shipment.version + 1,
          orderStatus,
          shipmentStatus,
        },
      });
      return transaction.shipment.findUniqueOrThrow({ where: { id } });
    });
  }
}
