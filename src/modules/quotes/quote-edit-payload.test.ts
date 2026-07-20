import { describe, expect, it } from "vitest";

import { quoteVersionUpdatePayload } from "@/modules/quotes/quote-edit-payload";

describe("revised draft editor payload", () => {
  it("sends items, configuration identifiers and every total-affecting field", () => {
    expect(
      quoteVersionUpdatePayload({
        currencyCode: "EUR",
        exchangeRateToUsd: "1.125",
        shipping: "100.005",
        insurance: "25.005",
        tax: "12.3456",
        bankFees: "5.0001",
        incoterm: "CIF",
        paymentTerms: "100% T/T Before Purchase",
        deliveryTerms: "30 days",
        warrantyTerms: "12 months",
        remarks: "Revised",
        items: [
          {
            productId: "product-1",
            variantId: "variant-2",
            description: "Revised GPU server",
            quantity: 2,
            unitPrice: "1000.0001",
            discount: "0.0001",
          },
        ],
      }),
    ).toMatchObject({
      exchangeRateToUsd: "1.125",
      shipping: "100.005",
      insurance: "25.005",
      tax: "12.3456",
      bankFees: "5.0001",
      items: [
        {
          productId: "product-1",
          variantId: "variant-2",
          quantity: 2,
          unitPrice: "1000.0001",
          discount: "0.0001",
        },
      ],
    });
  });
});
