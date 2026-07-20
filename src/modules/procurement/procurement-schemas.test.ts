import { describe, expect, it } from "vitest";

import {
  inspectionSchema,
  inventoryMutationSchema,
  purchaseOrderSchema,
  shipmentSchema,
  supplierSchema,
  supplierUpdateSchema,
} from "@/modules/procurement/procurement-schemas";

describe("procurement workflow schemas", () => {
  it("accepts operational supplier and masked-bank fields", () => {
    expect(
      supplierSchema.parse({
        code: "SUP-01",
        name: "Atlas Supplier",
        countryCode: "cn",
        supplierType: "DISTRIBUTOR",
        rating: 4,
        bankName: "Example Bank",
        bankAccountName: "Atlas Supplier Ltd",
        bankAccountNumber: "6222000012345678",
      }),
    ).toMatchObject({ countryCode: "CN", rating: 4 });
  });

  it("validates supplier status and product relationship maintenance", () => {
    expect(
      supplierUpdateSchema.parse({
        expectedVersion: 3,
        status: "INACTIVE",
        productRelations: [
          {
            productId: "4f22669d-bfe5-4b21-81c3-47e4814a1976",
            supplierSku: "SUP-GPU-01",
            leadTimeDays: 14,
            lastCost: "725.50",
            currencyCode: "usd",
          },
        ],
      }),
    ).toMatchObject({
      status: "INACTIVE",
      productRelations: [{ currencyCode: "USD" }],
    });

    expect(() =>
      supplierSchema.parse({
        code: "SUP-02",
        name: "Duplicate Relations",
        countryCode: "CN",
        productRelations: [
          { productId: "4f22669d-bfe5-4b21-81c3-47e4814a1976" },
          { productId: "4f22669d-bfe5-4b21-81c3-47e4814a1976" },
        ],
      }),
    ).toThrow();
  });

  it("captures purchase terms, snapshots and attachment identifiers", () => {
    expect(
      purchaseOrderSchema.parse({
        supplierId: "b5138961-b5ac-4bf0-b464-c56627662ae3",
        salesOrderId: "a42fedde-afb8-4a1d-a05b-05b684a73fd8",
        currencyCode: "usd",
        exchangeRateToUsd: "1",
        paymentTerms: "30% deposit",
        incoterm: "FOB",
        attachmentIds: ["4f22669d-bfe5-4b21-81c3-47e4814a1976"],
        items: [
          {
            salesOrderItemId: "b58d3e78-1d91-419f-8444-acfb49b6c555",
            quantity: 1,
            unitCost: "1000",
          },
        ],
      }),
    ).toMatchObject({ currencyCode: "USD", incoterm: "FOB" });
  });

  it("rejects duplicate purchase attachments and shipment documents", () => {
    const duplicateId = "4f22669d-bfe5-4b21-81c3-47e4814a1976";
    expect(() =>
      purchaseOrderSchema.parse({
        supplierId: "b5138961-b5ac-4bf0-b464-c56627662ae3",
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        attachmentIds: [duplicateId, duplicateId],
        items: [{ description: "GPU", quantity: 1, unitCost: "1000" }],
      }),
    ).toThrow();
    expect(() =>
      shipmentSchema.parse({
        salesOrderId: "262ed90a-a6c5-44ee-b576-63840735eb18",
        method: "AIR",
        documentIds: [duplicateId, duplicateId],
        items: [
          {
            salesOrderItemId: "5f5e5e17-a8af-4f18-af8d-c9f125276fbe",
            inventoryItemId: "265c80e0-01ca-4874-9f9d-2a8d2ff7c520",
            quantity: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("captures serial-specific inspection and shipment logistics", () => {
    expect(
      inspectionSchema.parse({
        inventoryItemId: "262ed90a-a6c5-44ee-b576-63840735eb18",
        inventorySerialId: "79d03d8b-6112-4bb1-90b4-b3abec2e333f",
        status: "PASSED",
        checklist: { appearance: true, boot: true, burnIn: true },
      }),
    ).toMatchObject({ status: "PASSED" });
    expect(
      shipmentSchema.parse({
        salesOrderId: "262ed90a-a6c5-44ee-b576-63840735eb18",
        method: "AIR",
        originPort: "SZX",
        destinationPort: "FRA",
        grossWeightKg: "24.5",
        volumeCbm: "0.18",
        freightCost: "800",
        freightCurrencyCode: "USD",
        freightExchangeRateToUsd: "1",
        documentIds: ["79d03d8b-6112-4bb1-90b4-b3abec2e333f"],
        items: [
          {
            salesOrderItemId: "5f5e5e17-a8af-4f18-af8d-c9f125276fbe",
            inventoryItemId: "265c80e0-01ca-4874-9f9d-2a8d2ff7c520",
            quantity: 1,
            serialNumbers: ["GPU-001"],
          },
        ],
      }),
    ).toMatchObject({ method: "AIR", freightCost: "800" });
  });

  it("requires an expected version for inventory mutations", () => {
    expect(() =>
      inventoryMutationSchema.parse({
        inventoryItemId: "262ed90a-a6c5-44ee-b576-63840735eb18",
        type: "RESERVATION",
        quantity: 1,
      }),
    ).toThrow();
  });
});
