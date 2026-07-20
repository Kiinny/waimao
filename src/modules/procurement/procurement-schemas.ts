import { z } from "zod";

const uuid = z.string().uuid();
const money = z.string().regex(/^\d+(?:\.\d{1,4})?$/);
const currency = z.string().trim().length(3).transform((value) => value.toUpperCase());
const rate = z.string().regex(/^\d+(?:\.\d{1,12})?$/).refine((value) => Number(value) > 0);
const json = z.record(z.string(), z.json());
export const assetIdListSchema = z
  .array(uuid)
  .max(20)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "Asset identifiers must be unique",
  });
const supplierProductRelationSchema = z.object({
  productId: uuid,
  supplierSku: z.string().trim().max(100).nullable().optional(),
  leadTimeDays: z.number().int().min(0).max(3650).nullable().optional(),
  lastCost: money.nullable().optional(),
  currencyCode: currency.nullable().optional(),
});
const supplierProductRelationsSchema = z
  .array(supplierProductRelationSchema)
  .max(200)
  .refine(
    (relations) =>
      new Set(relations.map((relation) => relation.productId)).size ===
      relations.length,
    { message: "Supplier product relationships must be unique" },
  );

export const supplierSchema = z.object({
  code: z.string().trim().min(1).max(50), name: z.string().trim().min(1).max(200),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  contactName: z.string().max(200).nullable().optional(), email: z.string().email().nullable().optional(),
  phone: z.string().max(50).nullable().optional(), address: json.nullable().optional(),
  supplierType: z.enum(["MANUFACTURER", "DISTRIBUTOR", "BROKER", "REFURBISHER", "LOGISTICS", "OTHER"]).optional(),
  website: z.string().url().nullable().optional(),
  taxId: z.string().trim().max(100).nullable().optional(),
  paymentTerms: z.string().trim().max(500).nullable().optional(),
  leadTimeDays: z.number().int().min(0).max(3650).nullable().optional(),
  minimumOrderValue: money.nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  bankName: z.string().trim().max(200).nullable().optional(),
  bankAccountName: z.string().trim().max(200).nullable().optional(),
  bankAccountNumber: z.string().trim().max(200).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  productRelations: supplierProductRelationsSchema.optional(),
});
export const supplierUpdateSchema = supplierSchema.partial().extend({
  expectedVersion: z.number().int().positive(),
});
export const purchaseOrderSchema = z.object({
  supplierId: uuid, salesOrderId: uuid.nullable().optional(), currencyCode: currency, exchangeRateToUsd: rate,
  expectedAt: z.coerce.date().nullable().optional(),
  paymentTerms: z.string().trim().max(1000).nullable().optional(),
  shippingTerms: z.string().trim().max(1000).nullable().optional(),
  incoterm: z.string().trim().max(20).nullable().optional(),
  deliveryAddress: json.nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  attachmentIds: assetIdListSchema.optional(),
  items: z.array(z.object({
    salesOrderItemId: uuid.nullable().optional(),
    productId: uuid.nullable().optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    configurationSnapshot: json.nullable().optional(),
    quantity: z.number().int().positive(),
    unitCost: money.refine((value) => Number(value) > 0),
  })).min(1),
});
export const purchaseOrderTransitionSchema = z.object({
  status: z.enum(["APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]),
  expectedVersion: z.number().int().positive(),
});
export const purchaseOrderReceiptSchema = z.object({
  expectedVersion: z.number().int().positive(),
  locationId: uuid,
  items: z.array(z.object({
    purchaseOrderItemId: uuid,
    quantity: z.number().int().positive(),
    serialNumbers: z.array(z.string().trim().min(1).max(200)).optional(),
  })).min(1),
});
export const inventoryMutationSchema = z.object({
  inventoryItemId: uuid,
  expectedVersion: z.number().int().positive(),
  type: z.enum(["RECEIPT", "ISSUE", "RESERVATION", "RELEASE", "DAMAGE", "RETURN", "COUNT"]),
  quantity: z.number().int().positive(),
  notes: z.string().max(2000).optional(),
  serialNumber: z.string().trim().min(1).max(200).optional(),
});
export const inventoryTransferSchema = z.object({
  inventoryItemId: uuid,
  expectedVersion: z.number().int().positive(),
  toLocationId: uuid,
  quantity: z.number().int().positive(),
  serialNumbers: z.array(z.string().trim().min(1).max(200)).optional(),
  notes: z.string().max(2000).optional(),
});
export const inspectionSchema = z.object({
  inventoryItemId: uuid,
  inventorySerialId: uuid.nullable().optional(),
  status: z.enum(["PENDING", "PASSED", "FAILED", "CONDITIONAL"]),
  checklist: z.record(z.string(), z.boolean()),
  notes: z.string().max(5000).nullable().optional(),
  evidence: z.array(json).optional(),
});
export const shipmentSchema = z.object({
  salesOrderId: uuid,
  method: z.enum(["AIR", "SEA", "ROAD", "RAIL", "COURIER", "CUSTOMER_PICKUP"]),
  carrier: z.string().max(200).nullable().optional(),
  trackingNumber: z.string().max(200).nullable().optional(),
  incoterm: z.string().max(20).nullable().optional(),
  origin: z.string().max(200).nullable().optional(),
  destination: z.string().max(200).nullable().optional(),
  originPort: z.string().max(100).nullable().optional(),
  destinationPort: z.string().max(100).nullable().optional(),
  grossWeightKg: money.nullable().optional(),
  volumeCbm: money.nullable().optional(),
  freightCost: money.nullable().optional(),
  freightCurrencyCode: currency.nullable().optional(),
  freightExchangeRateToUsd: rate.nullable().optional(),
  estimatedDepartureAt: z.coerce.date().nullable().optional(),
  estimatedArrivalAt: z.coerce.date().nullable().optional(),
  documentIds: assetIdListSchema.optional(),
  items: z.array(z.object({
    salesOrderItemId: uuid,
    inventoryItemId: uuid,
    quantity: z.number().int().positive(),
    serialNumbers: z.array(z.string().trim().min(1).max(200)).optional(),
  })).min(1),
});
export const shipmentTransitionSchema = z.object({
  status: z.enum(["BOOKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]),
  expectedVersion: z.number().int().positive(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderReceiptInput = z.infer<typeof purchaseOrderReceiptSchema>;
export type InventoryMutationInput = z.infer<typeof inventoryMutationSchema>;
export type InventoryTransferInput = z.infer<typeof inventoryTransferSchema>;
export type InspectionInput = z.infer<typeof inspectionSchema>;
export type ShipmentInput = z.infer<typeof shipmentSchema>;
