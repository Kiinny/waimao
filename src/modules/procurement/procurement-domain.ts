import { DomainError } from "@/lib/errors";

const PURCHASE_ORDER_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  DRAFT: ["APPROVED", "CANCELLED"],
  APPROVED: ["SENT", "CANCELLED"],
  SENT: ["CANCELLED"],
  PARTIALLY_RECEIVED: ["CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
};

const SHIPMENT_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  DRAFT: ["BOOKED", "CANCELLED"],
  BOOKED: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export type InventoryMutation =
  | "RECEIPT"
  | "ISSUE"
  | "RESERVATION"
  | "RELEASE"
  | "DAMAGE"
  | "RETURN"
  | "COUNT";

type SerialStatus = "AVAILABLE" | "RESERVED" | "ISSUED" | "DAMAGED";

export function assertPurchaseOrderTransition(from: string, to: string) {
  if (!PURCHASE_ORDER_TRANSITIONS[from]?.includes(to)) {
    throw new DomainError(
      "INVALID_PURCHASE_ORDER_TRANSITION",
      `Purchase order cannot move from ${from} to ${to}`,
      409,
    );
  }
}

export function assertShipmentTransition(from: string, to: string) {
  if (!SHIPMENT_TRANSITIONS[from]?.includes(to)) {
    throw new DomainError(
      "INVALID_SHIPMENT_TRANSITION",
      `Shipment cannot move from ${from} to ${to}`,
      409,
    );
  }
}

export function assertInspectionResult(status: string, checklist: Record<string, boolean>) {
  if (
    status === "PASSED" &&
    (Object.keys(checklist).length === 0 ||
      Object.values(checklist).some((complete) => !complete))
  ) {
    throw new DomainError(
      "INSPECTION_CHECKLIST_INCOMPLETE",
      "A passing inspection requires every checklist item to be complete",
      409,
    );
  }
}

export function inspectionPassesShipmentGate(input: {
  status: string;
  checklist: unknown;
}) {
  if (
    input.status !== "PASSED" ||
    !input.checklist ||
    typeof input.checklist !== "object" ||
    Array.isArray(input.checklist)
  ) {
    return false;
  }
  const completed = Object.values(input.checklist).filter(
    (value): value is boolean => typeof value === "boolean",
  );
  return completed.length > 0 && completed.every(Boolean);
}

export function inventoryBalanceAfter(
  current: { onHand: number; reserved: number },
  type: InventoryMutation,
  quantity: number,
  options: { consumeReserved?: boolean } = {},
) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new DomainError("INVALID_INVENTORY_QUANTITY", "Inventory quantity must be a positive integer");
  }
  const available = current.onHand - current.reserved;
  let onHand = current.onHand;
  let reserved = current.reserved;
  switch (type) {
    case "RECEIPT":
    case "RETURN": onHand += quantity; break;
    case "RESERVATION":
      if (available < quantity) throw new DomainError("INVENTORY_UNAVAILABLE", "Insufficient available inventory", 409);
      reserved += quantity; break;
    case "RELEASE":
      if (reserved < quantity) throw new DomainError("INVENTORY_RELEASE_EXCEEDS_RESERVED", "Cannot release more than reserved inventory", 409);
      reserved -= quantity; break;
    case "ISSUE":
      if (options.consumeReserved) {
        if (reserved < quantity) {
          throw new DomainError(
            "INVENTORY_RESERVED_UNAVAILABLE",
            "Insufficient reserved inventory",
            409,
          );
        }
        onHand -= quantity;
        reserved -= quantity;
        break;
      }
      if (available < quantity) throw new DomainError("INVENTORY_UNAVAILABLE", "Insufficient available inventory", 409);
      onHand -= quantity;
      break;
    case "DAMAGE":
      if (available < quantity) throw new DomainError("INVENTORY_UNAVAILABLE", "Insufficient available inventory", 409);
      onHand -= quantity; break;
    case "COUNT": onHand = quantity; break;
  }
  if (onHand < 0 || reserved < 0 || reserved > onHand) {
    throw new DomainError("INVENTORY_INVARIANT_VIOLATION", "Inventory quantities cannot become negative", 409);
  }
  return { onHand, reserved };
}

export function nextSerialStatus(input: {
  mutation: InventoryMutation;
  serialized: boolean;
  quantity: number;
  serialNumber?: string;
  currentStatus?: string;
}): SerialStatus | undefined {
  if (!input.serialized) return undefined;
  if (!input.serialNumber) {
    throw new DomainError(
      "SERIAL_REQUIRED",
      "Serial number is required for serialized inventory",
      409,
    );
  }
  if (input.quantity !== 1) {
    throw new DomainError(
      "INVALID_SERIAL_QUANTITY",
      "Serialized inventory mutations require exactly one unit",
      409,
    );
  }
  if (input.mutation === "COUNT") {
    throw new DomainError(
      "SERIAL_COUNT_UNSUPPORTED",
      "Inventory count is not supported for serialized stock; reconcile each serial instead",
      409,
    );
  }

  const expected: Partial<Record<InventoryMutation, string | undefined>> = {
    RECEIPT: undefined,
    RESERVATION: "AVAILABLE",
    RELEASE: "RESERVED",
    ISSUE: "RESERVED",
    DAMAGE: "AVAILABLE",
    RETURN: "ISSUED",
  };
  if (input.currentStatus !== expected[input.mutation]) {
    throw new DomainError(
      "INVALID_SERIAL_TRANSITION",
      `Serial ${input.serialNumber} cannot move from ${input.currentStatus ?? "NEW"} using ${input.mutation}`,
      409,
    );
  }

  const next: Partial<Record<InventoryMutation, SerialStatus>> = {
    RECEIPT: "AVAILABLE",
    RESERVATION: "RESERVED",
    RELEASE: "AVAILABLE",
    ISSUE: "ISSUED",
    DAMAGE: "DAMAGED",
    RETURN: "AVAILABLE",
  };
  return next[input.mutation];
}

export function assertPurchaseOrderLineOwnership(
  salesOrderId: string,
  orderItems: ReadonlyArray<{ id: string; salesOrderId: string }>,
  requestedItemIds: readonly string[],
) {
  const owned = new Set(
    orderItems
      .filter((item) => item.salesOrderId === salesOrderId)
      .map((item) => item.id),
  );
  const foreign = requestedItemIds.find((id) => !owned.has(id));
  if (foreign) {
    throw new DomainError(
      "PURCHASE_ORDER_ITEM_MISMATCH",
      `Sales order item ${foreign} does not belong to sales order ${salesOrderId}`,
      409,
    );
  }
}

export function assertPurchaseOrderQuantities(
  orderItems: ReadonlyArray<{ id: string; quantity: number }>,
  existingPurchaseItems: ReadonlyArray<{
    salesOrderItemId: string | null;
    quantity: number;
  }>,
  requestedItems: ReadonlyArray<{
    salesOrderItemId?: string | null;
    quantity: number;
  }>,
) {
  const purchasedByLine = new Map<string, number>();
  for (const item of [...existingPurchaseItems, ...requestedItems]) {
    if (!item.salesOrderItemId) continue;
    purchasedByLine.set(
      item.salesOrderItemId,
      (purchasedByLine.get(item.salesOrderItemId) ?? 0) + item.quantity,
    );
  }
  for (const orderItem of orderItems) {
    if ((purchasedByLine.get(orderItem.id) ?? 0) > orderItem.quantity) {
      throw new DomainError(
        "PURCHASE_ORDER_OVER_QUANTITY",
        `Purchase quantity exceeds sales order item ${orderItem.id}`,
        409,
      );
    }
  }
}

export function remainingShippableQuantity(
  orderedQuantity: number,
  activeShipmentQuantities: readonly number[],
) {
  const shippedOrReserved = activeShipmentQuantities.reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const remaining = orderedQuantity - shippedOrReserved;
  if (remaining < 0) {
    throw new DomainError(
      "SHIPMENT_OVER_QUANTITY",
      "Cumulative shipment quantity exceeds the sales order",
      409,
    );
  }
  return remaining;
}

export function aggregateInventoryReservations(
  inventory: Readonly<Record<string, { onHand: number; reserved: number }>>,
  reservations: ReadonlyArray<{ inventoryItemId: string; quantity: number }>,
) {
  const projected: Record<string, { onHand: number; reserved: number }> =
    Object.fromEntries(
      Object.entries(inventory).map(([id, balance]) => [id, { ...balance }]),
    );
  for (const reservation of reservations) {
    const current = projected[reservation.inventoryItemId];
    if (!current) {
      throw new DomainError(
        "INVENTORY_NOT_FOUND",
        `Inventory item ${reservation.inventoryItemId} not found`,
        404,
      );
    }
    projected[reservation.inventoryItemId] = inventoryBalanceAfter(
      current,
      "RESERVATION",
      reservation.quantity,
    );
  }
  return projected;
}

export function deriveShipmentOrderState(
  orderItems: ReadonlyArray<{ id: string; quantity: number }>,
  shipmentItems: ReadonlyArray<{
    status: string;
    salesOrderItemId: string;
    quantity: number;
  }>,
): {
  orderStatus: "FULFILLING" | "SHIPPED" | "COMPLETED";
  shipmentStatus:
    | "NOT_STARTED"
    | "BOOKED"
    | "PARTIALLY_SHIPPED"
    | "SHIPPED"
    | "DELIVERED";
} {
  const quantityFor = (orderItemId: string, statuses: readonly string[]) =>
    shipmentItems
      .filter(
        (item) =>
          item.salesOrderItemId === orderItemId &&
          statuses.includes(item.status),
      )
      .reduce((sum, item) => sum + item.quantity, 0);
  const allIssued = orderItems.every(
    (item) =>
      quantityFor(item.id, ["IN_TRANSIT", "DELIVERED"]) >= item.quantity,
  );
  const allDelivered = orderItems.every(
    (item) => quantityFor(item.id, ["DELIVERED"]) >= item.quantity,
  );
  const anyIssued = shipmentItems.some((item) =>
    ["IN_TRANSIT", "DELIVERED"].includes(item.status),
  );
  const anyBooked = shipmentItems.some((item) => item.status === "BOOKED");
  return {
    orderStatus: allDelivered
      ? "COMPLETED"
      : allIssued
        ? "SHIPPED"
        : "FULFILLING",
    shipmentStatus: allDelivered
      ? "DELIVERED"
      : allIssued
        ? "SHIPPED"
        : anyIssued
          ? "PARTIALLY_SHIPPED"
          : anyBooked
            ? "BOOKED"
            : "NOT_STARTED",
  };
}
