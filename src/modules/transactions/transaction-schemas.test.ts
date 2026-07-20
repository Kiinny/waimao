import { describe, expect, it } from "vitest";

import {
  paymentSchema,
  productSchema,
  quoteSchema,
  quoteVersionUpdateSchema,
} from "@/modules/transactions/transaction-schemas";

describe("sales transaction request validation", () => {
  it("rejects a product without any configuration version", () => {
    expect(
      productSchema.safeParse({
        sku: "GPU-1",
        name: "GPU Server",
        categoryId: "00000000-0000-4000-8000-000000000001",
        condition: "NEW",
        exportControlRisk: "LOW",
        availability: "AVAILABLE",
        variants: [],
      }).success,
    ).toBe(false);
  });

  it("rejects a quotation without commercial items", () => {
    expect(
      quoteSchema.safeParse({
        customerId: "00000000-0000-4000-8000-000000000001",
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        items: [],
      }).success,
    ).toBe(false);
  });

  it("requires proof metadata for a customer payment", () => {
    expect(
      paymentSchema.safeParse({
        salesOrderId: "00000000-0000-4000-8000-000000000001",
        amount: "100",
        currencyCode: "USD",
        exchangeRateToUsd: "1",
      }).success,
    ).toBe(false);
  });

  it("accepts a revised draft with items and every total-affecting field", () => {
    expect(
      quoteVersionUpdateSchema.safeParse({
        currencyCode: "EUR",
        exchangeRateToUsd: "1.125",
        shipping: "100.005",
        insurance: "25.005",
        tax: "12.3456",
        bankFees: "5.0001",
        incoterm: "CIF",
        items: [
          {
            productId: "00000000-0000-4000-8000-000000000001",
            variantId: "00000000-0000-4000-8000-000000000002",
            quantity: 2,
            unitPrice: "1000.0001",
            discount: "0.0001",
          },
        ],
      }).success,
    ).toBe(true);
  });
});
