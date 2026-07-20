import { describe, expect, it } from "vitest";

import {
  assertInspectionResult,
  assertPurchaseOrderQuantities,
  assertPurchaseOrderLineOwnership,
  assertPurchaseOrderTransition,
  assertShipmentTransition,
  aggregateInventoryReservations,
  deriveShipmentOrderState,
  inventoryBalanceAfter,
  inspectionPassesShipmentGate,
  nextSerialStatus,
  remainingShippableQuantity,
} from "@/modules/procurement/procurement-domain";

describe("procurement fulfillment domain", () => {
  it("allows purchase orders to advance through the receiving lifecycle", () => {
    expect(() => assertPurchaseOrderTransition("DRAFT", "APPROVED")).not.toThrow();
    expect(() => assertPurchaseOrderTransition("APPROVED", "RECEIVED")).toThrow(
      "Purchase order cannot move",
    );
  });

  it("never lets an inventory issue or reservation exceed on-hand stock", () => {
    expect(inventoryBalanceAfter({ onHand: 3, reserved: 1 }, "RESERVATION", 2)).toEqual({
      onHand: 3,
      reserved: 3,
    });
    expect(() => inventoryBalanceAfter({ onHand: 3, reserved: 1 }, "ISSUE", 3)).toThrow(
      "available inventory",
    );
  });

  it("requires a completed checklist for a passing inspection", () => {
    expect(() => assertInspectionResult("PASSED", {})).toThrow("checklist");
    expect(() => assertInspectionResult("PASSED", { serial: true, burnIn: false })).toThrow(
      "checklist",
    );
    expect(() => assertInspectionResult("PASSED", { serial: true, burnIn: true })).not.toThrow();
  });

  it("accepts only a latest passing inspection with a non-empty completed checklist", () => {
    expect(
      inspectionPassesShipmentGate({
        status: "PASSED",
        checklist: { appearance: true, burnIn: true, evidence: [] },
      }),
    ).toBe(true);
    expect(
      inspectionPassesShipmentGate({
        status: "PASSED",
        checklist: { evidence: [] },
      }),
    ).toBe(false);
    expect(
      inspectionPassesShipmentGate({
        status: "FAILED",
        checklist: { appearance: true, burnIn: true },
      }),
    ).toBe(false);
  });

  it("synchronizes only valid shipment transitions", () => {
    expect(() => assertShipmentTransition("BOOKED", "IN_TRANSIT")).not.toThrow();
    expect(() => assertShipmentTransition("IN_TRANSIT", "CANCELLED")).toThrow(
      "Shipment cannot move",
    );
    expect(() => assertShipmentTransition("DRAFT", "DELIVERED")).toThrow(
      "Shipment cannot move",
    );
  });

  it("requires one serial for every serialized stock mutation", () => {
    expect(() =>
      nextSerialStatus({
        mutation: "RESERVATION",
        serialized: true,
        quantity: 1,
        serialNumber: undefined,
        currentStatus: undefined,
      }),
    ).toThrow("Serial number is required");
    expect(() =>
      nextSerialStatus({
        mutation: "COUNT",
        serialized: true,
        quantity: 1,
        serialNumber: "GPU-001",
        currentStatus: "AVAILABLE",
      }),
    ).toThrow("not supported");
  });

  it("moves serialized inventory through reservation, release, issue and return states", () => {
    expect(
      nextSerialStatus({
        mutation: "RESERVATION",
        serialized: true,
        quantity: 1,
        serialNumber: "GPU-001",
        currentStatus: "AVAILABLE",
      }),
    ).toBe("RESERVED");
    expect(
      nextSerialStatus({
        mutation: "RELEASE",
        serialized: true,
        quantity: 1,
        serialNumber: "GPU-001",
        currentStatus: "RESERVED",
      }),
    ).toBe("AVAILABLE");
    expect(
      nextSerialStatus({
        mutation: "ISSUE",
        serialized: true,
        quantity: 1,
        serialNumber: "GPU-001",
        currentStatus: "RESERVED",
      }),
    ).toBe("ISSUED");
    expect(
      nextSerialStatus({
        mutation: "RETURN",
        serialized: true,
        quantity: 1,
        serialNumber: "GPU-001",
        currentStatus: "ISSUED",
      }),
    ).toBe("AVAILABLE");
  });

  it("consumes a reserved unit when the outbound issue names a reserved serial", () => {
    expect(
      inventoryBalanceAfter({ onHand: 3, reserved: 2 }, "ISSUE", 1, {
        consumeReserved: true,
      }),
    ).toEqual({ onHand: 2, reserved: 1 });
  });

  it("rejects purchase-order lines from another sales order", () => {
    expect(() =>
      assertPurchaseOrderLineOwnership(
        "order-a",
        [{ id: "line-a", salesOrderId: "order-a" }],
        ["line-a"],
      ),
    ).not.toThrow();
    expect(() =>
      assertPurchaseOrderLineOwnership(
        "order-a",
        [{ id: "line-b", salesOrderId: "order-b" }],
        ["line-b"],
      ),
    ).toThrow("does not belong");
  });

  it("aggregates duplicate sibling purchase lines before enforcing the order limit", () => {
    expect(() =>
      assertPurchaseOrderQuantities(
        [{ id: "line-a", quantity: 2 }],
        [{ salesOrderItemId: "line-a", quantity: 1 }],
        [
          { salesOrderItemId: "line-a", quantity: 1 },
          { salesOrderItemId: "line-a", quantity: 1 },
        ],
      ),
    ).toThrow("exceeds sales order item line-a");

    expect(() =>
      assertPurchaseOrderQuantities(
        [{ id: "line-a", quantity: 3 }],
        [{ salesOrderItemId: "line-a", quantity: 1 }],
        [
          { salesOrderItemId: "line-a", quantity: 1 },
          { salesOrderItemId: "line-a", quantity: 1 },
        ],
      ),
    ).not.toThrow();
  });

  it("prevents cumulative overshipment across active shipments", () => {
    expect(remainingShippableQuantity(3, [1, 1])).toBe(1);
    expect(() => remainingShippableQuantity(3, [2, 2])).toThrow(
      "exceeds the sales order",
    );
  });

  it("aggregates reservations against one inventory version", () => {
    expect(
      aggregateInventoryReservations(
        { stock: { onHand: 3, reserved: 0 } },
        [
          { inventoryItemId: "stock", quantity: 1 },
          { inventoryItemId: "stock", quantity: 2 },
        ],
      ),
    ).toEqual({ stock: { onHand: 3, reserved: 3 } });
    expect(() =>
      aggregateInventoryReservations(
        { stock: { onHand: 3, reserved: 0 } },
        [
          { inventoryItemId: "stock", quantity: 2 },
          { inventoryItemId: "stock", quantity: 2 },
        ],
      ),
    ).toThrow("available inventory");
  });

  it("derives partial, shipped and delivered order synchronization", () => {
    const orderItems = [
      { id: "a", quantity: 2 },
      { id: "b", quantity: 1 },
    ];
    expect(
      deriveShipmentOrderState(orderItems, [
        { status: "IN_TRANSIT", salesOrderItemId: "a", quantity: 1 },
      ]),
    ).toEqual({ orderStatus: "FULFILLING", shipmentStatus: "PARTIALLY_SHIPPED" });
    expect(
      deriveShipmentOrderState(orderItems, [
        { status: "IN_TRANSIT", salesOrderItemId: "a", quantity: 2 },
        { status: "IN_TRANSIT", salesOrderItemId: "b", quantity: 1 },
      ]),
    ).toEqual({ orderStatus: "SHIPPED", shipmentStatus: "SHIPPED" });
    expect(
      deriveShipmentOrderState(orderItems, [
        { status: "DELIVERED", salesOrderItemId: "a", quantity: 2 },
        { status: "DELIVERED", salesOrderItemId: "b", quantity: 1 },
      ]),
    ).toEqual({ orderStatus: "COMPLETED", shipmentStatus: "DELIVERED" });
  });
});
