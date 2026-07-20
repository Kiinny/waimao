# Task 4 review package

diff --git a/prisma/seed.ts b/prisma/seed.ts
index a09619c..bb141ee 100644
--- a/prisma/seed.ts
+++ b/prisma/seed.ts
@@ -886,19 +886,50 @@ async function main() {
             paymentStatus === "CONFIRMED" ? deterministicId(3, 5) : null,
           verifiedAt:
             paymentStatus === "CONFIRMED"
               ? new Date(Date.UTC(2026, 6, 10 + index))
               : null,
           receivedAt: new Date(Date.UTC(2026, 6, 9 + index)),
         },
       });
     }
   }
+
+  const supplierNames = ["Shenzhen Compute Supply", "NVIDIA Channel HK", "Pacific Server Parts", "EuroRack Renewed", "Vertex Logistics Hardware"];
+  for (let index = 0; index < supplierNames.length; index += 1) {
+    const supplierId = deterministicId(40, index + 1);
+    await prisma.supplier.upsert({
+      where: { id: supplierId },
+      update: { name: supplierNames[index], status: "ACTIVE", deletedAt: null },
+      create: { id: supplierId, code: `SUP-${String(index + 1).padStart(3, "0")}`, name: supplierNames[index], countryCode: index < 3 ? "CN" : index === 3 ? "DE" : "SG", contactName: `Supplier Contact ${index + 1}`, email: `sales${index + 1}@supplier.example`, phone: `+86-755-${(5000 + index).toString()}` },
+    });
+  }
+  const warehouse = await prisma.warehouse.upsert({ where: { code: "SZ-01" }, update: { name: "Shenzhen Export Warehouse", deletedAt: null }, create: { id: deterministicId(41, 1), code: "SZ-01", name: "Shenzhen Export Warehouse" } });
+  const location = await prisma.warehouseLocation.upsert({ where: { warehouseId_code: { warehouseId: warehouse.id, code: "A-01" } }, update: { name: "Inbound QC" }, create: { id: deterministicId(42, 1), warehouseId: warehouse.id, code: "A-01", name: "Inbound QC" } });
+  for (let index = 0; index < 3; index += 1) {
+    const inventoryId = deterministicId(43, index + 1);
+    await prisma.inventoryItem.upsert({
+      where: { id: inventoryId },
+      update: { quantityOnHand: 2, quantityReserved: index === 0 ? 1 : 0, deletedAt: null },
+      create: { id: inventoryId, productId: deterministicId(20, index + 1), locationId: location.id, quantityOnHand: 2, quantityReserved: index === 0 ? 1 : 0, unitCostUsd: String(3500 + index * 1700) },
+    });
+    await prisma.inventorySerial.upsert({ where: { serialNumber: `ATLAS-${index + 1}-0001` }, update: { inventoryItemId: inventoryId, status: index === 0 ? "RESERVED" : "AVAILABLE" }, create: { inventoryItemId: inventoryId, serialNumber: `ATLAS-${index + 1}-0001`, status: index === 0 ? "RESERVED" : "AVAILABLE", receivedAt: new Date(Date.UTC(2026, 6, 12)) } });
+    await prisma.qualityInspection.upsert({ where: { id: deterministicId(44, index + 1) }, update: { inventoryItemId: inventoryId, status: "PASSED", checklist: { serial: true, boot: true, burnIn: true } }, create: { id: deterministicId(44, index + 1), inventoryItemId: inventoryId, inspectorId: deterministicId(3, 7), status: "PASSED", checklist: { serial: true, boot: true, burnIn: true }, inspectedAt: new Date(Date.UTC(2026, 6, 13)) } });
+  }
+  for (let index = 0; index < 2; index += 1) {
+    const poId = deterministicId(45, index + 1);
+    await prisma.purchaseOrder.upsert({
+      where: { id: poId },
+      update: { supplierId: deterministicId(40, index + 1), salesOrderId: deterministicId(33, index + 1), status: index === 0 ? "SENT" : "APPROVED" },
+      create: { id: poId, purchaseOrderNumber: `PURCHASE-ORDER-${String(index + 1).padStart(6, "0")}`, supplierId: deterministicId(40, index + 1), salesOrderId: deterministicId(33, index + 1), buyerId: deterministicId(3, 6), status: index === 0 ? "SENT" : "APPROVED", currencyCode: "USD", exchangeRateToUsd: "1", total: "12000", totalUsd: "12000", expectedAt: new Date(Date.UTC(2026, 7, 1)), items: { create: { salesOrderItemId: deterministicId(34, index + 1), description: productNames[index], quantity: 1, unitCost: "12000", lineTotal: "12000" } } },
+    });
+  }
+  await prisma.shipment.upsert({ where: { shipmentNumber: "SHIPMENT-000001" }, update: { status: "BOOKED" }, create: { id: deterministicId(46, 1), shipmentNumber: "SHIPMENT-000001", salesOrderId: deterministicId(33, 1), coordinatorId: deterministicId(3, 8), status: "BOOKED", carrier: "DHL Global Forwarding", trackingNumber: "DHL-ATLAS-001", origin: "Shenzhen", destination: "Frankfurt", items: { create: { salesOrderItemId: deterministicId(34, 1), quantity: 1 } } } });
 }
 
 main()
   .then(async () => prisma.$disconnect())
   .catch(async (error) => {
     console.error(error);
     await prisma.$disconnect();
     process.exit(1);
   });
diff --git a/src/components/app-shell.tsx b/src/components/app-shell.tsx
index 14dd4a4..ab2ff2e 100644
--- a/src/components/app-shell.tsx
+++ b/src/components/app-shell.tsx
@@ -16,20 +16,25 @@ export function AppShell({
 }) {
   const dictionary = getDictionary(locale);
   const nav = [
     ["dashboard", "D", dictionary.nav.dashboard],
     ["leads", "L", dictionary.nav.leads],
     ["customers", "C", dictionary.nav.customers],
     ["opportunities", "O", dictionary.nav.opportunities],
     ["products", "P", locale === "zh" ? "产品" : "Products"],
     ["quotes", "Q", locale === "zh" ? "报价" : "Quotes"],
     ["orders", "S", locale === "zh" ? "订单" : "Orders"],
+    ["suppliers", "V", locale === "zh" ? "供应商" : "Suppliers"],
+    ["purchase-orders", "B", locale === "zh" ? "采购订单" : "Purchase orders"],
+    ["inventory", "I", locale === "zh" ? "库存" : "Inventory"],
+    ["inspections", "Q", locale === "zh" ? "质检" : "Quality"],
+    ["shipments", "H", locale === "zh" ? "物流" : "Shipments"],
     ["users", "U", dictionary.nav.users],
     ["roles", "R", dictionary.nav.roles],
   ] as const;
   const targetLocale = locale === "en" ? "zh" : "en";
   const targetDictionary = getDictionary(targetLocale);
 
   async function logout() {
     "use server";
     await signOut({ redirectTo: `/${locale}/login` });
   }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.test.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.test.ts"
new file mode 100644
index 0000000..730970d
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.test.ts"
@@ -0,0 +1,41 @@
+import { describe, expect, it } from "vitest";
+
+import {
+  assertInspectionResult,
+  assertPurchaseOrderTransition,
+  assertShipmentTransition,
+  inventoryBalanceAfter,
+} from "@/modules/procurement/procurement-domain";
+
+describe("procurement fulfillment domain", () => {
+  it("allows purchase orders to advance through the receiving lifecycle", () => {
+    expect(() => assertPurchaseOrderTransition("DRAFT", "APPROVED")).not.toThrow();
+    expect(() => assertPurchaseOrderTransition("APPROVED", "RECEIVED")).toThrow(
+      "Purchase order cannot move",
+    );
+  });
+
+  it("never lets an inventory issue or reservation exceed on-hand stock", () => {
+    expect(inventoryBalanceAfter({ onHand: 3, reserved: 1 }, "RESERVATION", 2)).toEqual({
+      onHand: 3,
+      reserved: 3,
+    });
+    expect(() => inventoryBalanceAfter({ onHand: 3, reserved: 1 }, "ISSUE", 3)).toThrow(
+      "available inventory",
+    );
+  });
+
+  it("requires a completed checklist for a passing inspection", () => {
+    expect(() => assertInspectionResult("PASSED", { serial: true, burnIn: false })).toThrow(
+      "checklist",
+    );
+    expect(() => assertInspectionResult("PASSED", { serial: true, burnIn: true })).not.toThrow();
+  });
+
+  it("synchronizes only valid shipment transitions", () => {
+    expect(() => assertShipmentTransition("BOOKED", "IN_TRANSIT")).not.toThrow();
+    expect(() => assertShipmentTransition("DRAFT", "DELIVERED")).toThrow(
+      "Shipment cannot move",
+    );
+  });
+});
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.ts"
new file mode 100644
index 0000000..9d43434
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-domain.ts"
@@ -0,0 +1,89 @@
+import { DomainError } from "@/lib/errors";
+
+const PURCHASE_ORDER_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
+  DRAFT: ["APPROVED", "CANCELLED"],
+  APPROVED: ["SENT", "CANCELLED"],
+  SENT: ["PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"],
+  PARTIALLY_RECEIVED: ["RECEIVED", "CANCELLED"],
+  RECEIVED: [],
+  CANCELLED: [],
+};
+
+const SHIPMENT_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
+  DRAFT: ["BOOKED", "CANCELLED"],
+  BOOKED: ["IN_TRANSIT", "CANCELLED"],
+  IN_TRANSIT: ["DELIVERED", "CANCELLED"],
+  DELIVERED: [],
+  CANCELLED: [],
+};
+
+export type InventoryMutation =
+  | "RECEIPT"
+  | "ISSUE"
+  | "RESERVATION"
+  | "RELEASE"
+  | "DAMAGE"
+  | "RETURN"
+  | "COUNT";
+
+export function assertPurchaseOrderTransition(from: string, to: string) {
+  if (!PURCHASE_ORDER_TRANSITIONS[from]?.includes(to)) {
+    throw new DomainError(
+      "INVALID_PURCHASE_ORDER_TRANSITION",
+      `Purchase order cannot move from ${from} to ${to}`,
+      409,
+    );
+  }
+}
+
+export function assertShipmentTransition(from: string, to: string) {
+  if (!SHIPMENT_TRANSITIONS[from]?.includes(to)) {
+    throw new DomainError(
+      "INVALID_SHIPMENT_TRANSITION",
+      `Shipment cannot move from ${from} to ${to}`,
+      409,
+    );
+  }
+}
+
+export function assertInspectionResult(status: string, checklist: Record<string, boolean>) {
+  if (status === "PASSED" && Object.values(checklist).some((complete) => !complete)) {
+    throw new DomainError(
+      "INSPECTION_CHECKLIST_INCOMPLETE",
+      "A passing inspection requires every checklist item to be complete",
+      409,
+    );
+  }
+}
+
+export function inventoryBalanceAfter(
+  current: { onHand: number; reserved: number },
+  type: InventoryMutation,
+  quantity: number,
+) {
+  if (!Number.isInteger(quantity) || quantity <= 0) {
+    throw new DomainError("INVALID_INVENTORY_QUANTITY", "Inventory quantity must be a positive integer");
+  }
+  const available = current.onHand - current.reserved;
+  let onHand = current.onHand;
+  let reserved = current.reserved;
+  switch (type) {
+    case "RECEIPT":
+    case "RETURN": onHand += quantity; break;
+    case "RESERVATION":
+      if (available < quantity) throw new DomainError("INVENTORY_UNAVAILABLE", "Insufficient available inventory", 409);
+      reserved += quantity; break;
+    case "RELEASE":
+      if (reserved < quantity) throw new DomainError("INVENTORY_RELEASE_EXCEEDS_RESERVED", "Cannot release more than reserved inventory", 409);
+      reserved -= quantity; break;
+    case "ISSUE":
+    case "DAMAGE":
+      if (available < quantity) throw new DomainError("INVENTORY_UNAVAILABLE", "Insufficient available inventory", 409);
+      onHand -= quantity; break;
+    case "COUNT": onHand = quantity; break;
+  }
+  if (onHand < 0 || reserved < 0 || reserved > onHand) {
+    throw new DomainError("INVENTORY_INVARIANT_VIOLATION", "Inventory quantities cannot become negative", 409);
+  }
+  return { onHand, reserved };
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.ts"
new file mode 100644
index 0000000..64ad1f0
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-schemas.ts"
@@ -0,0 +1,24 @@
+import { z } from "zod";
+
+const uuid = z.string().uuid();
+const money = z.string().regex(/^\d+(?:\.\d{1,4})?$/);
+const currency = z.string().trim().length(3).transform((value) => value.toUpperCase());
+const rate = z.string().regex(/^\d+(?:\.\d{1,12})?$/).refine((value) => Number(value) > 0);
+const json = z.record(z.string(), z.json());
+
+export const supplierSchema = z.object({
+  code: z.string().trim().min(1).max(50), name: z.string().trim().min(1).max(200),
+  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
+  contactName: z.string().max(200).nullable().optional(), email: z.string().email().nullable().optional(),
+  phone: z.string().max(50).nullable().optional(), address: json.nullable().optional(),
+});
+export const purchaseOrderSchema = z.object({
+  supplierId: uuid, salesOrderId: uuid.nullable().optional(), currencyCode: currency, exchangeRateToUsd: rate,
+  expectedAt: z.coerce.date().nullable().optional(),
+  items: z.array(z.object({ salesOrderItemId: uuid.nullable().optional(), description: z.string().trim().min(1).max(1000), quantity: z.number().int().positive(), unitCost: money.refine((value) => Number(value) > 0) })).min(1),
+});
+export const purchaseOrderTransitionSchema = z.object({ status: z.enum(["APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]) });
+export const inventoryMutationSchema = z.object({ inventoryItemId: uuid, type: z.enum(["RECEIPT", "ISSUE", "RESERVATION", "RELEASE", "DAMAGE", "RETURN", "COUNT"]), quantity: z.number().int().positive(), notes: z.string().max(2000).optional(), serialNumber: z.string().trim().min(1).max(200).optional() });
+export const inspectionSchema = z.object({ inventoryItemId: uuid, status: z.enum(["PENDING", "PASSED", "FAILED", "CONDITIONAL"]), checklist: z.record(z.string(), z.boolean()), notes: z.string().max(5000).nullable().optional(), evidence: z.array(json).optional() });
+export const shipmentSchema = z.object({ salesOrderId: uuid, carrier: z.string().max(200).nullable().optional(), trackingNumber: z.string().max(200).nullable().optional(), incoterm: z.string().max(20).nullable().optional(), origin: z.string().max(200).nullable().optional(), destination: z.string().max(200).nullable().optional(), items: z.array(z.object({ salesOrderItemId: uuid, quantity: z.number().int().positive() })).min(1) });
+export const shipmentTransitionSchema = z.object({ status: z.enum(["BOOKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]) });
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.ts"
new file mode 100644
index 0000000..805f96f
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\modules\\procurement\\procurement-service.ts"
@@ -0,0 +1,35 @@
+import Decimal from "decimal.js";
+import type { Prisma } from "@/generated/prisma/client";
+import { writeAudit } from "@/lib/audit";
+import { DomainError } from "@/lib/errors";
+import { getPrisma } from "@/lib/prisma";
+import type { AuthorizationContext } from "@/lib/rbac";
+import { authorizePurchaseTransition } from "@/modules/orders/purchase-gate";
+import { assertInspectionResult, assertPurchaseOrderTransition, assertShipmentTransition, inventoryBalanceAfter, type InventoryMutation } from "@/modules/procurement/procurement-domain";
+
+async function nextNumber(transaction: Prisma.TransactionClient, key: string) {
+  const sequence = await transaction.sequence.update({ where: { key }, data: { nextValue: { increment: 1 }, version: { increment: 1 } } });
+  return `${sequence.prefix}-${(sequence.nextValue - BigInt(1)).toString().padStart(sequence.padding, "0")}`;
+}
+
+export class ProcurementService {
+  listSuppliers() { return getPrisma().supplier.findMany({ where: { deletedAt: null }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { purchaseOrders: true, products: true } } } }); }
+  getSupplier(id: string) { return getPrisma().supplier.findFirst({ where: { id, deletedAt: null }, include: { products: { include: { product: true } }, purchaseOrders: { orderBy: { updatedAt: "desc" }, take: 20 } } }); }
+  createSupplier(context: AuthorizationContext, input: Prisma.SupplierCreateInput) { return getPrisma().$transaction(async (tx) => { const row = await tx.supplier.create({ data: input }); await writeAudit(tx, { actorId: context.userId, action: "supplier.create", entityType: "Supplier", entityId: row.id, after: { code: row.code, name: row.name } }); return row; }); }
+  async updateSupplier(context: AuthorizationContext, id: string, input: Prisma.SupplierUpdateInput) { return getPrisma().$transaction(async (tx) => { const row = await tx.supplier.findFirst({ where: { id, deletedAt: null } }); if (!row) throw new DomainError("SUPPLIER_NOT_FOUND", "Supplier not found", 404); const updated = await tx.supplier.update({ where: { id }, data: { ...input, version: { increment: 1 } } }); await writeAudit(tx, { actorId: context.userId, action: "supplier.update", entityType: "Supplier", entityId: id, before: { version: row.version }, after: { version: updated.version } }); return updated; }); }
+  listPurchaseOrders() { return getPrisma().purchaseOrder.findMany({ where: { deletedAt: null }, orderBy: { updatedAt: "desc" }, include: { supplier: true, salesOrder: { select: { orderNumber: true, purchaseEligibilityFlag: true, purchaseOverrideAuditId: true } }, buyer: { select: { name: true } }, items: true } }); }
+  eligibleOrders() { return getPrisma().salesOrder.findMany({ where: { deletedAt: null, status: "PURCHASING", OR: [{ purchaseEligibilityFlag: true }, { purchaseOverrideAuditId: { not: null } }] }, select: { id: true, orderNumber: true, currencyCode: true, total: true, items: true } }); }
+  createPurchaseOrder(context: AuthorizationContext, input: { supplierId: string; salesOrderId?: string | null; currencyCode: string; exchangeRateToUsd: string; expectedAt?: Date | null; items: Array<{ salesOrderItemId?: string | null; description: string; quantity: number; unitCost: string }> }) { return getPrisma().$transaction(async (tx) => { await tx.supplier.findFirstOrThrow({ where: { id: input.supplierId, deletedAt: null } }); if (input.salesOrderId) { const order = await tx.salesOrder.findFirst({ where: { id: input.salesOrderId, deletedAt: null }, include: { payments: { where: { status: "CONFIRMED", deletedAt: null }, select: { amountUsd: true } }, refunds: { where: { refundedAt: { not: null }, deletedAt: null }, select: { amountUsd: true } } } }); if (!order) throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404); authorizePurchaseTransition({ paymentTerms: order.paymentTerms, orderTotalUsd: order.totalUsd.toString(), confirmedPaymentsUsd: order.payments.map((p) => p.amountUsd.toString()), confirmedRefundsUsd: order.refunds.map((r) => r.amountUsd.toString()) }, order.purchaseOverrideAuditId ? { actorId: order.purchaseOverrideActorId ?? context.userId, reason: order.purchaseOverrideReason ?? "Audited override" } : undefined); if (!order.purchaseEligibilityFlag && !order.purchaseOverrideAuditId) throw new DomainError("PURCHASE_PAYMENT_REQUIRED", "Sales order is not eligible for purchasing", 409); }
+    const total = input.items.reduce((sum, item) => sum.plus(new Decimal(item.unitCost).times(item.quantity)), new Decimal(0));
+    const po = await tx.purchaseOrder.create({ data: { purchaseOrderNumber: await nextNumber(tx, "purchase_order"), supplierId: input.supplierId, salesOrderId: input.salesOrderId, buyerId: context.userId, currencyCode: input.currencyCode, exchangeRateToUsd: input.exchangeRateToUsd, total: total.toFixed(4), totalUsd: total.times(input.exchangeRateToUsd).toFixed(4), expectedAt: input.expectedAt, items: { create: input.items.map((item) => ({ ...item, lineTotal: new Decimal(item.unitCost).times(item.quantity).toFixed(4) })) }, }, include: { items: true } }); await writeAudit(tx, { actorId: context.userId, action: "purchase_order.create", entityType: "PurchaseOrder", entityId: po.id, after: { number: po.purchaseOrderNumber, salesOrderId: po.salesOrderId } }); return po; }); }
+  transitionPurchaseOrder(context: AuthorizationContext, id: string, status: string) { return getPrisma().$transaction(async (tx) => { const row = await tx.purchaseOrder.findFirst({ where: { id, deletedAt: null } }); if (!row) throw new DomainError("PURCHASE_ORDER_NOT_FOUND", "Purchase order not found", 404); assertPurchaseOrderTransition(row.status, status); const changed = await tx.purchaseOrder.updateMany({ where: { id, status: row.status }, data: { status: status as never, version: { increment: 1 } } }); if (changed.count !== 1) throw new DomainError("PURCHASE_ORDER_CONFLICT", "Purchase order changed; refresh and retry", 409); await writeAudit(tx, { actorId: context.userId, action: "purchase_order.status_change", entityType: "PurchaseOrder", entityId: id, before: { status: row.status }, after: { status } }); return tx.purchaseOrder.findUniqueOrThrow({ where: { id } }); }); }
+  listInventory() { return getPrisma().inventoryItem.findMany({ where: { deletedAt: null }, include: { product: true, location: { include: { warehouse: true } }, serials: true, purchaseOrderItem: { include: { purchaseOrder: true } } }, orderBy: { updatedAt: "desc" } }); }
+  mutateInventory(context: AuthorizationContext, input: { inventoryItemId: string; type: InventoryMutation; quantity: number; notes?: string; serialNumber?: string }) { return getPrisma().$transaction(async (tx) => { const item = await tx.inventoryItem.findFirst({ where: { id: input.inventoryItemId, deletedAt: null }, include: { product: true } }); if (!item) throw new DomainError("INVENTORY_NOT_FOUND", "Inventory item not found", 404); const next = inventoryBalanceAfter({ onHand: item.quantityOnHand, reserved: item.quantityReserved }, input.type, input.quantity); if (input.serialNumber) { if (!item.product.serialized || input.quantity !== 1) throw new DomainError("INVALID_SERIAL_MUTATION", "Serialized inventory mutations require exactly one serialized unit", 409); if (input.type === "RECEIPT" || input.type === "RETURN") await tx.inventorySerial.create({ data: { inventoryItemId: item.id, serialNumber: input.serialNumber, status: "AVAILABLE", receivedAt: new Date() } }); else { const serial = await tx.inventorySerial.findFirst({ where: { inventoryItemId: item.id, serialNumber: input.serialNumber } }); if (!serial || serial.status !== "AVAILABLE") throw new DomainError("SERIAL_UNAVAILABLE", "Serial number is not available", 409); await tx.inventorySerial.update({ where: { id: serial.id }, data: { status: input.type === "RESERVATION" ? "RESERVED" : "ISSUED", issuedAt: input.type === "ISSUE" ? new Date() : null } }); }
+    }
+    const updated = await tx.inventoryItem.update({ where: { id: item.id }, data: { quantityOnHand: next.onHand, quantityReserved: next.reserved, version: { increment: 1 } } }); await tx.inventoryTransaction.create({ data: { inventoryItemId: item.id, type: input.type, quantity: input.quantity, referenceType: "manual", notes: input.notes, createdById: context.userId } }); await writeAudit(tx, { actorId: context.userId, action: "inventory.mutate", entityType: "InventoryItem", entityId: item.id, before: { onHand: item.quantityOnHand, reserved: item.quantityReserved }, after: next }); return updated; }); }
+  listInspections() { return getPrisma().qualityInspection.findMany({ include: { inventoryItem: { include: { product: true } }, inspector: { select: { name: true } } }, orderBy: { updatedAt: "desc" } }); }
+  createInspection(context: AuthorizationContext, input: { inventoryItemId: string; status: "PENDING" | "PASSED" | "FAILED" | "CONDITIONAL"; checklist: Record<string, boolean>; notes?: string | null; evidence?: Prisma.InputJsonValue[] }) { assertInspectionResult(input.status, input.checklist); return getPrisma().$transaction(async (tx) => { await tx.inventoryItem.findFirstOrThrow({ where: { id: input.inventoryItemId, deletedAt: null } }); const inspection = await tx.qualityInspection.create({ data: { inventoryItemId: input.inventoryItemId, inspectorId: context.userId, status: input.status, checklist: { ...input.checklist, evidence: input.evidence ?? [] }, notes: input.notes, inspectedAt: input.status === "PENDING" ? null : new Date() } }); await writeAudit(tx, { actorId: context.userId, action: "quality_inspection.create", entityType: "QualityInspection", entityId: inspection.id, after: { status: inspection.status } }); return inspection; }); }
+  listShipments() { return getPrisma().shipment.findMany({ where: { deletedAt: null }, include: { salesOrder: { select: { orderNumber: true } }, coordinator: { select: { name: true } }, items: true }, orderBy: { updatedAt: "desc" } }); }
+  createShipment(context: AuthorizationContext, input: { salesOrderId: string; carrier?: string | null; trackingNumber?: string | null; incoterm?: string | null; origin?: string | null; destination?: string | null; items: Array<{ salesOrderItemId: string; quantity: number }> }) { return getPrisma().$transaction(async (tx) => { const order = await tx.salesOrder.findFirst({ where: { id: input.salesOrderId, deletedAt: null, status: { in: ["FULFILLING", "PURCHASING"] } }, include: { items: true } }); if (!order) throw new DomainError("ORDER_NOT_READY_FOR_SHIPMENT", "Order must be purchasing or fulfilling before shipment", 409); for (const item of input.items) { const source = order.items.find((orderItem) => orderItem.id === item.salesOrderItemId); if (!source || item.quantity > source.quantity) throw new DomainError("INVALID_SHIPMENT_ITEM", "Shipment quantity exceeds its sales order item", 409); } const shipment = await tx.shipment.create({ data: { shipmentNumber: await nextNumber(tx, "shipment"), salesOrderId: input.salesOrderId, coordinatorId: context.userId, carrier: input.carrier, trackingNumber: input.trackingNumber, incoterm: input.incoterm, origin: input.origin, destination: input.destination, items: { create: input.items } }, include: { items: true } }); await writeAudit(tx, { actorId: context.userId, action: "shipment.create", entityType: "Shipment", entityId: shipment.id, after: { number: shipment.shipmentNumber, orderId: shipment.salesOrderId } }); return shipment; }); }
+  transitionShipment(context: AuthorizationContext, id: string, status: string) { return getPrisma().$transaction(async (tx) => { const shipment = await tx.shipment.findFirst({ where: { id, deletedAt: null } }); if (!shipment) throw new DomainError("SHIPMENT_NOT_FOUND", "Shipment not found", 404); assertShipmentTransition(shipment.status, status); const updated = await tx.shipment.update({ where: { id }, data: { status: status as never, shippedAt: status === "IN_TRANSIT" ? new Date() : shipment.shippedAt, deliveredAt: status === "DELIVERED" ? new Date() : shipment.deliveredAt, version: { increment: 1 } } }); if (status === "IN_TRANSIT") await tx.salesOrder.update({ where: { id: shipment.salesOrderId }, data: { status: "SHIPPED", shipmentStatus: "SHIPPED", version: { increment: 1 } } }); if (status === "DELIVERED") await tx.salesOrder.update({ where: { id: shipment.salesOrderId }, data: { shipmentStatus: "DELIVERED", version: { increment: 1 } } }); await writeAudit(tx, { actorId: context.userId, action: "shipment.status_change", entityType: "Shipment", entityId: id, before: { status: shipment.status }, after: { status } }); return updated; }); }
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\procurement\\workflow-json-form.tsx" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\procurement\\workflow-json-form.tsx"
new file mode 100644
index 0000000..b78aaae
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\components\\procurement\\workflow-json-form.tsx"
@@ -0,0 +1,12 @@
+"use client";
+
+import { useRouter } from "next/navigation";
+import { useState } from "react";
+
+export function WorkflowJsonForm({ endpoint, title, example }: { endpoint: string; title: string; example: string }) {
+  const router = useRouter(); const [payload, setPayload] = useState(example); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
+  return <form className="crm-form" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setMessage(""); try { const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload }); const result = await response.json() as { success?: boolean; error?: { message?: string } }; if (!response.ok || !result.success) throw new Error(result.error?.message ?? "Request failed"); setMessage("Saved successfully."); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); } finally { setBusy(false); } }}>
+    <label>{title}<textarea aria-label={title} value={payload} onChange={(event) => setPayload(event.target.value)} rows={8} /></label>
+    <button className="button" disabled={busy} type="submit">{busy ? "Saving…" : "Save"}</button>{message ? <p className="form-feedback" role="status">{message}</p> : null}
+  </form>;
+}
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\route.ts"
new file mode 100644
index 0000000..6e4cb31
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\route.ts"
@@ -0,0 +1,8 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { supplierSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.read"); return success(await service.listSuppliers()); } catch (error) { return failure(error); } }
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.create"); return success(await service.createSupplier(context, supplierSchema.parse(await request.json()) as never), 201); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\[id]\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\[id]\\route.ts"
new file mode 100644
index 0000000..ad1a343
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\suppliers\\[id]\\route.ts"
@@ -0,0 +1,9 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { DomainError } from "@/lib/errors";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { supplierSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.read"); const row = await service.getSupplier((await params).id); if (!row) throw new DomainError("SUPPLIER_NOT_FOUND", "Supplier not found", 404); return success(row); } catch (error) { return failure(error); } }
+export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const context = await currentAuthorizationContext(); requirePermission(context, "supplier.update"); return success(await service.updateSupplier(context, (await params).id, supplierSchema.partial().parse(await request.json()) as never)); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\route.ts"
new file mode 100644
index 0000000..0504922
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\route.ts"
@@ -0,0 +1,8 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { purchaseOrderSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "purchase.read"); return success(await service.listPurchaseOrders()); } catch (error) { return failure(error); } }
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "purchase.create"); return success(await service.createPurchaseOrder(context, purchaseOrderSchema.parse(await request.json())), 201); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\transition\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\transition\\route.ts"
new file mode 100644
index 0000000..d645641
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\purchase-orders\\[id]\\transition\\route.ts"
@@ -0,0 +1,7 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { purchaseOrderTransitionSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const context = await currentAuthorizationContext(); requirePermission(context, "purchase.update"); const { status } = purchaseOrderTransitionSchema.parse(await request.json()); return success(await service.transitionPurchaseOrder(context, (await params).id, status)); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\route.ts"
new file mode 100644
index 0000000..925e1f0
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\route.ts"
@@ -0,0 +1,6 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "inventory.read"); return success(await service.listInventory()); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\transactions\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\transactions\\route.ts"
new file mode 100644
index 0000000..bf17bc5
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inventory\\transactions\\route.ts"
@@ -0,0 +1,7 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { inventoryMutationSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "inventory.update"); return success(await service.mutateInventory(context, inventoryMutationSchema.parse(await request.json()))); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inspections\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inspections\\route.ts"
new file mode 100644
index 0000000..62b4495
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\inspections\\route.ts"
@@ -0,0 +1,8 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { inspectionSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "quality.read"); return success(await service.listInspections()); } catch (error) { return failure(error); } }
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "quality.update"); return success(await service.createInspection(context, inspectionSchema.parse(await request.json())), 201); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\route.ts"
new file mode 100644
index 0000000..a8b00de
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\route.ts"
@@ -0,0 +1,8 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { shipmentSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function GET() { try { const context = await currentAuthorizationContext(); requirePermission(context, "shipment.read"); return success(await service.listShipments()); } catch (error) { return failure(error); } }
+export async function POST(request: Request) { try { const context = await currentAuthorizationContext(); requirePermission(context, "shipment.update"); return success(await service.createShipment(context, shipmentSchema.parse(await request.json())), 201); } catch (error) { return failure(error); } }
diff --git "a/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\[id]\\transition\\route.ts" "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\[id]\\transition\\route.ts"
new file mode 100644
index 0000000..0262a80
--- /dev/null
+++ "b/C:\\Users\\Admin\\Documents\\\345\244\226\350\264\270\\src\\app\\api\\shipments\\[id]\\transition\\route.ts"
@@ -0,0 +1,7 @@
+import { currentAuthorizationContext } from "@/lib/current-user";
+import { failure, success } from "@/lib/http";
+import { requirePermission } from "@/lib/rbac";
+import { shipmentTransitionSchema } from "@/modules/procurement/procurement-schemas";
+import { ProcurementService } from "@/modules/procurement/procurement-service";
+const service = new ProcurementService();
+export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const context = await currentAuthorizationContext(); requirePermission(context, "shipment.update"); const { status } = shipmentTransitionSchema.parse(await request.json()); return success(await service.transitionShipment(context, (await params).id, status)); } catch (error) { return failure(error); } }
