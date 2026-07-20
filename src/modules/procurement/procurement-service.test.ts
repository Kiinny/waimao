import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  database: null as unknown,
  writeAudit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => mocks.database,
}));
vi.mock("@/lib/audit", () => ({
  writeAudit: mocks.writeAudit,
}));

import {
  ProcurementService,
  maskBankAccount,
  supplierOperationalMetrics,
} from "@/modules/procurement/procurement-service";

const context = {
  userId: "045a6c7e-d408-41af-8b6f-8b5e525d76c8",
  roleCodes: ["OPERATIONS"],
  permissions: ["inventory.update"],
  isSuperAdmin: false,
};

const supplierBankContext = {
  ...context,
  permissions: ["purchase.read", "supplier.bank.read"],
};

describe("procurement service transaction guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("masks supplier bank details outside the write boundary", () => {
    expect(maskBankAccount("6222000012345678")).toBe("************5678");
    expect(maskBankAccount(null)).toBeNull();
  });

  it("masks suppliers nested in PO reads unless the caller has field access", async () => {
    const purchaseOrder = {
      id: "po-1",
      supplier: {
        id: "supplier-1",
        bankAccountNumber: "6222000012345678",
      },
    };
    const findMany = vi.fn().mockResolvedValue([purchaseOrder]);
    const findFirst = vi.fn().mockResolvedValue(purchaseOrder);
    mocks.database = { purchaseOrder: { findMany, findFirst } };
    const service = new ProcurementService();

    await expect(
      service.listPurchaseOrders({ ...context, permissions: ["purchase.read"] }),
    ).resolves.toMatchObject([
      { supplier: { bankAccountNumber: "************5678" } },
    ]);
    await expect(
      service.getPurchaseOrder(
        "po-1",
        supplierBankContext,
      ),
    ).resolves.toMatchObject({
      supplier: { bankAccountNumber: "6222000012345678" },
    });
  });

  it("creates a stock-reserving shipment and its order in BOOKED state atomically", async () => {
    let createdShipment: Record<string, unknown> | undefined;
    const shipmentCreate = vi.fn().mockImplementation(({ data }) => {
      createdShipment = {
        id: "shipment-1",
        status: data.status ?? "DRAFT",
        ...data,
      };
      return createdShipment;
    });
    const orderUpdate = vi.fn().mockResolvedValue({ count: 1 });
    const transaction = {
      salesOrder: {
        findFirst: vi.fn().mockResolvedValue({
          id: "order-1",
          version: 4,
          items: [
            {
              id: "order-item-1",
              productId: "product-1",
              quantity: 2,
            },
          ],
          shipments: [],
        }),
        updateMany: orderUpdate,
      },
      fileAsset: { count: vi.fn() },
      inventoryItem: {
        findFirst: vi.fn().mockResolvedValue({
          id: "inventory-1",
          productId: "product-1",
          quantityOnHand: 2,
          quantityReserved: 0,
          version: 3,
          product: { serialized: false },
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      qualityInspection: {
        findFirst: vi.fn().mockResolvedValue({
          status: "PASSED",
          checklist: { appearance: true },
        }),
      },
      sequence: {
        update: vi.fn().mockResolvedValue({
          prefix: "SHIP",
          nextValue: BigInt(2),
          padding: 6,
        }),
      },
      shipment: {
        create: shipmentCreate,
        findUniqueOrThrow: vi.fn().mockImplementation(() => createdShipment),
      },
      shipmentItem: {
        create: vi.fn().mockResolvedValue({ id: "shipment-item-1" }),
      },
      inventoryTransaction: { create: vi.fn().mockResolvedValue({}) },
    };
    mocks.database = {
      $transaction: (callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
    };

    await expect(
      new ProcurementService().createShipment(context, {
        salesOrderId: "order-1",
        method: "AIR",
        items: [
          {
            salesOrderItemId: "order-item-1",
            inventoryItemId: "inventory-1",
            quantity: 1,
          },
        ],
      }),
    ).resolves.toMatchObject({ status: "BOOKED" });
    expect(shipmentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "BOOKED" }),
    });
    expect(orderUpdate).toHaveBeenCalledWith({
      where: { id: "order-1", version: 4 },
      data: {
        status: "FULFILLING",
        shipmentStatus: "BOOKED",
        version: { increment: 1 },
      },
    });
  });

  it("replaces validated supplier product relationships in the supplier transaction", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const transaction = {
      supplier: {
        findFirst: vi.fn().mockResolvedValue({
          id: "supplier-1",
          version: 2,
          bankAccountNumber: null,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "supplier-1",
          version: 3,
          bankAccountNumber: null,
        }),
      },
      product: { count: vi.fn().mockResolvedValue(1) },
      supplierProduct: { deleteMany, createMany },
    };
    mocks.database = {
      $transaction: (callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
    };

    await new ProcurementService().updateSupplier(
      context,
      "supplier-1",
      {
        expectedVersion: 2,
        status: "INACTIVE",
        productRelations: [
          {
            productId: "4f22669d-bfe5-4b21-81c3-47e4814a1976",
            supplierSku: "SUP-GPU-01",
          },
        ],
      },
    );

    expect(deleteMany).toHaveBeenCalledWith({
      where: { supplierId: "supplier-1" },
    });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          supplierId: "supplier-1",
          productId: "4f22669d-bfe5-4b21-81c3-47e4814a1976",
          supplierSku: "SUP-GPU-01",
        },
      ],
    });
  });

  it("summarizes supplier spend, delivery, quality and return performance", () => {
    expect(
      supplierOperationalMetrics([
        {
          totalUsd: "120.50",
          status: "RECEIVED",
          expectedAt: new Date("2026-07-15T00:00:00Z"),
          receivedAt: new Date("2026-07-14T00:00:00Z"),
          items: [
            {
              inventoryItems: [
                {
                  inspections: [{ status: "PASSED" }, { status: "FAILED" }],
                  transactions: [{ type: "RETURN", quantity: 1 }],
                },
              ],
            },
          ],
        },
        {
          totalUsd: "79.50",
          status: "SENT",
          expectedAt: null,
          receivedAt: null,
          items: [],
        },
      ]),
    ).toEqual({
      purchaseTotalUsd: "200.0000",
      orderCount: 2,
      receivedOrderCount: 1,
      deliveryRatePercent: "50.00",
      onTimeDeliveryRatePercent: "100.00",
      passedInspectionCount: 1,
      completedInspectionCount: 2,
      qualityPassRatePercent: "50.00",
      returnedUnits: 1,
    });
  });

  it("uses the read version and balances in the inventory conditional update", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const transaction = {
      inventoryItem: {
        findFirst: vi.fn().mockResolvedValue({
          id: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
          productId: "e61d1149-ecef-4a78-b7d7-f282ee628887",
          locationId: "fdd1cae5-b451-4636-987d-a37c13c295a2",
          purchaseOrderItemId: null,
          quantityOnHand: 2,
          quantityReserved: 0,
          version: 7,
          deletedAt: null,
          product: { serialized: false },
        }),
        updateMany,
      },
      inventorySerial: { findUnique: vi.fn() },
    };
    mocks.database = {
      $transaction: (callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
    };

    await expect(
      new ProcurementService().mutateInventory(context, {
        inventoryItemId: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
        expectedVersion: 7,
        type: "RESERVATION",
        quantity: 1,
      }),
    ).rejects.toMatchObject({ code: "INVENTORY_CONFLICT", status: 409 });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
        version: 7,
        quantityOnHand: 2,
        quantityReserved: 0,
        deletedAt: null,
      },
      data: {
        quantityOnHand: 2,
        quantityReserved: 1,
        version: { increment: 1 },
      },
    });
  });

  it("releases a reserved serial and records its immutable transaction trail", async () => {
    const serialUpdate = vi.fn().mockResolvedValue({ count: 1 });
    const inventoryTransactionCreate = vi.fn().mockResolvedValue({ id: "trail" });
    const transaction = {
      inventoryItem: {
        findFirst: vi.fn().mockResolvedValue({
          id: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
          productId: "e61d1149-ecef-4a78-b7d7-f282ee628887",
          locationId: "fdd1cae5-b451-4636-987d-a37c13c295a2",
          purchaseOrderItemId: null,
          quantityOnHand: 2,
          quantityReserved: 1,
          version: 7,
          deletedAt: null,
          product: { serialized: true },
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
          quantityOnHand: 2,
          quantityReserved: 0,
          version: 8,
          serials: [{ serialNumber: "GPU-001", status: "AVAILABLE" }],
        }),
      },
      inventorySerial: {
        findUnique: vi.fn().mockResolvedValue({
          id: "25d6b60a-b0eb-457c-a2a2-85a83503f3d7",
          inventoryItemId: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
          serialNumber: "GPU-001",
          status: "RESERVED",
          issuedAt: null,
        }),
        updateMany: serialUpdate,
      },
      inventoryTransaction: { create: inventoryTransactionCreate },
    };
    mocks.database = {
      $transaction: (callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
    };

    await new ProcurementService().mutateInventory(context, {
      inventoryItemId: "f6f83600-aa5f-4a71-98e3-5d98c0dfdaaa",
      expectedVersion: 7,
      type: "RELEASE",
      quantity: 1,
      serialNumber: "GPU-001",
    });

    expect(serialUpdate).toHaveBeenCalledWith({
      where: {
        id: "25d6b60a-b0eb-457c-a2a2-85a83503f3d7",
        status: "RESERVED",
      },
      data: { status: "AVAILABLE", issuedAt: null },
    });
    expect(inventoryTransactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        inventorySerialId: "25d6b60a-b0eb-457c-a2a2-85a83503f3d7",
        type: "RELEASE",
        referenceType: "manual",
      }),
    });
    expect(mocks.writeAudit).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({ action: "inventory.mutate" }),
    );
  });
});
