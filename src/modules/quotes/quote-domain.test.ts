import { describe, expect, it } from "vitest";

import {
  assertQuoteApprovalRole,
  assertQuoteTransition,
  calculateQuoteVersion,
  nextQuoteRevision,
} from "@/modules/quotes/quote-domain";

describe("quotation totals", () => {
  it("calculates decimal-safe line totals, charges, total and estimated profit", () => {
    expect(
      calculateQuoteVersion({
        exchangeRateToUsd: "1.25",
        items: [
          {
            quantity: 3,
            unitPrice: "10.005",
            discount: "0.015",
            estimatedUnitCostUsd: "8",
          },
          {
            quantity: 2,
            unitPrice: "99.9999",
            discount: "10",
            estimatedUnitCostUsd: "70.125",
          },
        ],
        shipping: "12.34",
        insurance: "1.11",
        tax: "0.55",
        bankFees: "2.20",
      }),
    ).toEqual({
      items: [
        { lineTotal: "30.0000", estimatedCostUsd: "24.0000" },
        { lineTotal: "189.9998", estimatedCostUsd: "140.2500" },
      ],
      subtotal: "219.9998",
      total: "236.1998",
      totalUsd: "295.2498",
      estimatedCostUsd: "164.2500",
      estimatedProfitUsd: "130.9998",
      estimatedMarginPercent: "44.3691",
    });
  });

  it("rejects a discount greater than the line gross amount", () => {
    expect(() =>
      calculateQuoteVersion({
        exchangeRateToUsd: "1",
        items: [
          {
            quantity: 1,
            unitPrice: "10",
            discount: "10.01",
            estimatedUnitCostUsd: "1",
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_QUOTE_DISCOUNT" }));
  });
});

describe("quotation workflow", () => {
  it.each([
    ["DRAFT", "PENDING_APPROVAL"],
    ["PENDING_APPROVAL", "APPROVED"],
    ["PENDING_APPROVAL", "REJECTED"],
    ["APPROVED", "SENT"],
    ["SENT", "VIEWED"],
    ["SENT", "ACCEPTED"],
    ["VIEWED", "ACCEPTED"],
    ["SENT", "REJECTED"],
    ["SENT", "EXPIRED"],
    ["ACCEPTED", "CONVERTED"],
  ])("allows %s to transition to %s", (from, to) => {
    expect(() => assertQuoteTransition(from, to)).not.toThrow();
  });

  it("rejects skipping approval", () => {
    expect(() => assertQuoteTransition("DRAFT", "SENT")).toThrowError(
      expect.objectContaining({ code: "INVALID_QUOTE_TRANSITION" }),
    );
  });

  it("limits approval to Super Admin and Sales Manager roles", () => {
    expect(() => assertQuoteApprovalRole(["SALES_REP"])).toThrowError(
      expect.objectContaining({ code: "PERMISSION_DENIED" }),
    );
    expect(() => assertQuoteApprovalRole(["SALES_MANAGER"])).not.toThrow();
    expect(() => assertQuoteApprovalRole(["SUPER_ADMIN"])).not.toThrow();
  });

  it("creates the next editable revision from the latest immutable version", () => {
    expect(
      nextQuoteRevision({
        currentVersion: 3,
        source: {
          id: "version-3",
          number: 3,
          immutableAt: new Date("2026-07-17T00:00:00Z"),
          currencyCode: "USD",
          exchangeRateToUsd: "1",
          shipping: "100",
          insurance: "20",
          tax: "0",
          bankFees: "15",
          incoterm: "CIF",
          paymentTerms: "100% T/T Before Purchase",
          deliveryTerms: "30 days",
          warrantyTerms: "12 months",
          remarks: "Original",
          items: [{ description: "Server", quantity: 1 }],
        },
      }),
    ).toMatchObject({
      number: 4,
      sourceVersionId: "version-3",
      immutableAt: null,
      status: "DRAFT",
      items: [{ description: "Server", quantity: 1 }],
    });
  });
});
