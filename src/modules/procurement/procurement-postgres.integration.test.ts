import "dotenv/config";

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getPrisma } from "@/lib/prisma";
import type { AuthorizationContext } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";

const integration =
  process.env.RUN_POSTGRES_INTEGRATION === "1" ? describe : describe.skip;

integration("procurement PostgreSQL transactions", () => {
  const prisma = getPrisma();
  const service = new ProcurementService();
  const runId = randomUUID().slice(0, 8);
  const createdOrderIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdInventoryIds: string[] = [];
  const createdPurchaseOrderIds: string[] = [];
  const createdShipmentIds: string[] = [];
  let context: AuthorizationContext;
  let supplierId: string;
  let customerId: string;
  let categoryId: string;
  let locationId: string;
  let serializedProductId: string;
  let concurrentOrderId: string;
  let concurrentOrderItemId: string;
  let successfulPurchaseOrderId: string;

  async function createEligibleOrder(suffix: string, quantity: number) {
    const id = randomUUID();
    const itemId = randomUUID();
    createdOrderIds.push(id);
    return prisma.salesOrder.create({
      data: {
        id,
        orderNumber: `IT-${runId}-${suffix}`,
        customerId,
        ownerId: context.userId,
        status: "PURCHASING",
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        total: String(quantity * 100),
        totalUsd: String(quantity * 100),
        paymentTerms: "Net 30",
        paymentStatus: "PAID",
        purchaseStatus: "PURCHASING",
        purchaseEligibilityFlag: true,
        items: {
          create: {
            id: itemId,
            productId: serializedProductId,
            description: `Integration GPU ${runId}`,
            configuration: { testRun: runId },
            quantity,
            unitPrice: "100",
            lineTotal: String(quantity * 100),
          },
        },
      },
      include: { items: true },
    });
  }

  beforeAll(async () => {
    const [actor, category, location] = await Promise.all([
      prisma.user.findFirstOrThrow({
        where: { email: "admin@atlascrm.dev", deletedAt: null },
      }),
      prisma.productCategory.findFirstOrThrow({ where: { deletedAt: null } }),
      prisma.warehouseLocation.findFirstOrThrow({
        where: { warehouse: { deletedAt: null } },
      }),
    ]);
    context = {
      userId: actor.id,
      roles: ["SUPER_ADMIN"],
      permissions: ["*"],
    };
    categoryId = category.id;
    locationId = location.id;

    const customer = await prisma.customer.create({
      data: {
        companyName: `Integration Customer ${runId}`,
        countryCode: "CN",
        ownerId: actor.id,
      },
    });
    customerId = customer.id;

    const supplier = await prisma.supplier.create({
      data: {
        code: `IT-SUP-${runId}`,
        name: `Integration Supplier ${runId}`,
        countryCode: "CN",
      },
    });
    supplierId = supplier.id;

    const serializedProduct = await prisma.product.create({
      data: {
        sku: `IT-GPU-${runId}`,
        name: `Integration GPU ${runId}`,
        categoryId,
        serialized: true,
      },
    });
    serializedProductId = serializedProduct.id;
    createdProductIds.push(serializedProduct.id);
  });

  afterAll(async () => {
    if (createdShipmentIds.length) {
      await prisma.shipment.deleteMany({
        where: { id: { in: createdShipmentIds } },
      });
    }
    if (createdInventoryIds.length) {
      await prisma.qualityInspection.deleteMany({
        where: { inventoryItemId: { in: createdInventoryIds } },
      });
      await prisma.inventoryTransaction.deleteMany({
        where: { inventoryItemId: { in: createdInventoryIds } },
      });
      await prisma.inventorySerial.deleteMany({
        where: { inventoryItemId: { in: createdInventoryIds } },
      });
      await prisma.inventoryItem.deleteMany({
        where: { id: { in: createdInventoryIds } },
      });
    }
    if (createdPurchaseOrderIds.length) {
      await prisma.purchaseOrder.deleteMany({
        where: { id: { in: createdPurchaseOrderIds } },
      });
    }
    if (createdOrderIds.length) {
      await prisma.salesOrder.deleteMany({
        where: { id: { in: createdOrderIds } },
      });
    }
    if (supplierId) {
      await prisma.supplier.deleteMany({ where: { id: supplierId } });
    }
    if (createdProductIds.length) {
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } },
      });
    }
    if (customerId) {
      await prisma.customer.deleteMany({ where: { id: customerId } });
    }
  });

  it("rejects duplicate sibling PO lines whose aggregate exceeds the sales line", async () => {
    const order = await createEligibleOrder("SIBLING", 2);
    await expect(
      service.createPurchaseOrder(context, {
        supplierId,
        salesOrderId: order.id,
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        items: [
          {
            salesOrderItemId: order.items[0].id,
            quantity: 2,
            unitCost: "60",
          },
          {
            salesOrderItemId: order.items[0].id,
            quantity: 1,
            unitCost: "60",
          },
        ],
      }),
    ).rejects.toMatchObject({ code: "PURCHASE_ORDER_OVER_QUANTITY", status: 409 });
    expect(
      await prisma.purchaseOrder.count({ where: { salesOrderId: order.id } }),
    ).toBe(0);
  });

  it("serializes concurrent PO creation so only one can purchase the remaining quantity", async () => {
    const order = await createEligibleOrder("RACE", 2);
    concurrentOrderId = order.id;
    concurrentOrderItemId = order.items[0].id;
    const input = {
      supplierId,
      salesOrderId: order.id,
      currencyCode: "USD",
      exchangeRateToUsd: "1",
      items: [
        {
          salesOrderItemId: order.items[0].id,
          quantity: 2,
          unitCost: "60",
        },
      ],
    };

    const results = await Promise.allSettled([
      service.createPurchaseOrder(context, input),
      service.createPurchaseOrder(context, input),
    ]);
    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof service.createPurchaseOrder>>> =>
        result.status === "fulfilled",
    );
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    expect(
      fulfilled,
      JSON.stringify(
        results.map((result) =>
          result.status === "fulfilled"
            ? { status: result.status, id: result.value.id }
            : {
                status: result.status,
                code: result.reason?.code,
                message: result.reason?.message,
              },
        ),
      ),
    ).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatchObject({
      code: "PURCHASE_ORDER_OVER_QUANTITY",
      status: 409,
    });
    successfulPurchaseOrderId = fulfilled[0].value.id;
    createdPurchaseOrderIds.push(successfulPurchaseOrderId);
    expect(
      await prisma.purchaseOrderItem.aggregate({
        where: {
          purchaseOrder: {
            salesOrderId: order.id,
            status: { not: "CANCELLED" },
          },
          salesOrderItemId: order.items[0].id,
        },
        _sum: { quantity: true },
      }),
    ).toMatchObject({ _sum: { quantity: 2 } });
    expect(
      (await prisma.salesOrder.findUniqueOrThrow({ where: { id: order.id } }))
        .version,
    ).toBe(2);
  });

  it("uses conditional inventory versions so only one concurrent reservation succeeds", async () => {
    const product = await prisma.product.create({
      data: {
        sku: `IT-BULK-${runId}`,
        name: `Integration bulk stock ${runId}`,
        categoryId,
        serialized: false,
      },
    });
    createdProductIds.push(product.id);
    const inventory = await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        locationId,
        quantityOnHand: 1,
      },
    });
    createdInventoryIds.push(inventory.id);

    const results = await Promise.allSettled([
      service.mutateInventory(context, {
        inventoryItemId: inventory.id,
        expectedVersion: inventory.version,
        type: "RESERVATION",
        quantity: 1,
      }),
      service.mutateInventory(context, {
        inventoryItemId: inventory.id,
        expectedVersion: inventory.version,
        type: "RESERVATION",
        quantity: 1,
      }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(
      await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventory.id } }),
    ).toMatchObject({ quantityOnHand: 1, quantityReserved: 1, version: 2 });
  });

  it("receives a serialized PO into linked inventory and immutable serial trails", async () => {
    let purchaseOrder = await service.transitionPurchaseOrder(
      context,
      successfulPurchaseOrderId,
      "APPROVED",
      1,
    );
    purchaseOrder = await service.transitionPurchaseOrder(
      context,
      purchaseOrder.id,
      "SENT",
      purchaseOrder.version,
    );
    const line = await prisma.purchaseOrderItem.findFirstOrThrow({
      where: { purchaseOrderId: purchaseOrder.id },
    });
    const serialNumbers = [`IT-${runId}-001`, `IT-${runId}-002`];
    const received = await service.receivePurchaseOrder(context, purchaseOrder.id, {
      expectedVersion: purchaseOrder.version,
      locationId,
      items: [
        {
          purchaseOrderItemId: line.id,
          quantity: 2,
          serialNumbers,
        },
      ],
    });
    expect(received).toMatchObject({ status: "RECEIVED", version: 4 });
    const inventory = await prisma.inventoryItem.findFirstOrThrow({
      where: { purchaseOrderItemId: line.id, locationId },
      include: {
        serials: { orderBy: { serialNumber: "asc" } },
        transactions: { orderBy: { occurredAt: "asc" } },
      },
    });
    createdInventoryIds.push(inventory.id);
    expect(inventory.quantityOnHand).toBe(2);
    expect(inventory.quantityReserved).toBe(0);
    expect(inventory.serials.map((serial) => serial.serialNumber)).toEqual(
      serialNumbers,
    );
    expect(inventory.transactions).toHaveLength(2);
    expect(
      inventory.transactions.every(
        (transaction) =>
          transaction.type === "RECEIPT" &&
          transaction.referenceId === purchaseOrder.id &&
          Boolean(transaction.inventorySerialId),
      ),
    ).toBe(true);
  });

  it("blocks stale QC, then reserves, issues and delivers with synchronized order state", async () => {
    const inventory = await prisma.inventoryItem.findFirstOrThrow({
      where: {
        purchaseOrderItem: { purchaseOrderId: successfulPurchaseOrderId },
      },
      include: { serials: { orderBy: { serialNumber: "asc" } } },
    });
    for (const serial of inventory.serials) {
      await service.createInspection(context, {
        inventoryItemId: inventory.id,
        inventorySerialId: serial.id,
        status: "PASSED",
        checklist: { appearance: true, serialVerified: true, burnIn: true },
      });
    }
    const failed = await service.createInspection(context, {
      inventoryItemId: inventory.id,
      inventorySerialId: inventory.serials[0].id,
      status: "FAILED",
      checklist: { appearance: true, serialVerified: true, burnIn: false },
    });
    await prisma.qualityInspection.update({
      where: { id: failed.id },
      data: { createdAt: new Date(Date.now() + 1_000) },
    });
    const shipmentInput = {
      salesOrderId: concurrentOrderId,
      method: "AIR" as const,
      carrier: "Integration Air",
      origin: "Shenzhen",
      destination: "Frankfurt",
      items: [
        {
          salesOrderItemId: concurrentOrderItemId,
          inventoryItemId: inventory.id,
          quantity: 2,
          serialNumbers: inventory.serials.map((serial) => serial.serialNumber),
        },
      ],
    };
    await expect(
      service.createShipment(context, shipmentInput),
    ).rejects.toMatchObject({ code: "SHIPMENT_INSPECTION_REQUIRED", status: 409 });

    const repassed = await service.createInspection(context, {
      inventoryItemId: inventory.id,
      inventorySerialId: inventory.serials[0].id,
      status: "PASSED",
      checklist: { appearance: true, serialVerified: true, burnIn: true },
    });
    await prisma.qualityInspection.update({
      where: { id: repassed.id },
      data: { createdAt: new Date(Date.now() + 2_000) },
    });

    let shipment: Awaited<ReturnType<typeof service.transitionShipment>> =
      await service.createShipment(context, shipmentInput);
    createdShipmentIds.push(shipment.id);
    expect(shipment.status).toBe("BOOKED");
    expect(
      await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventory.id } }),
    ).toMatchObject({ quantityOnHand: 2, quantityReserved: 2 });
    shipment = await service.transitionShipment(
      context,
      shipment.id,
      "IN_TRANSIT",
      shipment.version,
    );
    expect(
      await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventory.id } }),
    ).toMatchObject({ quantityOnHand: 0, quantityReserved: 0 });
    expect(
      await prisma.inventorySerial.count({
        where: { inventoryItemId: inventory.id, status: "ISSUED" },
      }),
    ).toBe(2);
    expect(
      await prisma.salesOrder.findUniqueOrThrow({ where: { id: concurrentOrderId } }),
    ).toMatchObject({ status: "SHIPPED", shipmentStatus: "SHIPPED" });

    shipment = await service.transitionShipment(
      context,
      shipment.id,
      "DELIVERED",
      shipment.version,
    );
    expect(shipment.status).toBe("DELIVERED");
    expect(
      await prisma.salesOrder.findUniqueOrThrow({ where: { id: concurrentOrderId } }),
    ).toMatchObject({ status: "COMPLETED", shipmentStatus: "DELIVERED" });
  });
});
