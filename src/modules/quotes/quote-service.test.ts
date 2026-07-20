import { describe, expect, it } from "vitest";

import {
  updateQuoteVersion,
  type QuoteVersionRepository,
  type QuoteVersionState,
} from "@/modules/quotes/quote-service";

function repositoryFor(state: QuoteVersionState) {
  const updates: Array<Parameters<QuoteVersionRepository["updateVersion"]>[1]> =
    [];
  const repository: QuoteVersionRepository = {
    findVersionState: async () => state,
    updateVersion: async (_id, changes) => {
      updates.push(changes);
      return { id: state.id, ...changes };
    },
  };
  return { repository, updates };
}

describe("quotation immutability", () => {
  const salesRep = {
    userId: "sales-1",
    roles: ["SALES_REP"],
    permissions: ["quote.update"],
  };

  it("updates an editable draft version", async () => {
    const state = repositoryFor({
      id: "version-1",
      quoteStatus: "DRAFT",
      immutableAt: null,
      quoteOwnerId: "sales-1",
    });

    await expect(
      updateQuoteVersion(state.repository, salesRep, "version-1", {
        remarks: "Updated terms",
      }),
    ).resolves.toMatchObject({ remarks: "Updated terms" });
    expect(state.updates).toEqual([{ remarks: "Updated terms" }]);
  });

  it("forwards a complete commercial draft update for server-side snapshot and total recomputation", async () => {
    const state = repositoryFor({
      id: "version-1",
      quoteStatus: "DRAFT",
      immutableAt: null,
      quoteOwnerId: "sales-1",
    });
    const changes = {
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
      remarks: "Revised configuration",
      items: [
        {
          productId: "00000000-0000-4000-8000-000000000001",
          variantId: "00000000-0000-4000-8000-000000000002",
          quantity: 2,
          unitPrice: "1000.0001",
          discount: "0.0001",
        },
      ],
    };

    await updateQuoteVersion(
      state.repository,
      salesRep,
      "version-1",
      changes,
    );

    expect(state.updates).toEqual([changes]);
  });

  it.each(["SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"])(
    "rejects changes when a quotation is %s",
    async (quoteStatus) => {
      const state = repositoryFor({
        id: "version-1",
        quoteStatus,
        immutableAt: new Date("2026-01-01"),
        quoteOwnerId: "sales-1",
      });

      await expect(
        updateQuoteVersion(state.repository, salesRep, "version-1", {
          remarks: "Tampered",
        }),
      ).rejects.toMatchObject({ code: "QUOTE_IMMUTABLE", status: 409 });
      expect(state.updates).toEqual([]);
    },
  );

  it("rejects a Sales Representative updating another owner's draft", async () => {
    const state = repositoryFor({
      id: "version-1",
      quoteStatus: "DRAFT",
      immutableAt: null,
      quoteOwnerId: "sales-2",
    });

    await expect(
      updateQuoteVersion(state.repository, salesRep, "version-1", {
        remarks: "Cross-owner change",
      }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
    expect(state.updates).toEqual([]);
  });

  it("allows a Sales Manager updating a representative's draft", async () => {
    const state = repositoryFor({
      id: "version-1",
      quoteStatus: "DRAFT",
      immutableAt: null,
      quoteOwnerId: "sales-2",
    });

    await expect(
      updateQuoteVersion(
        state.repository,
        {
          userId: "manager-1",
          roles: ["SALES_MANAGER"],
          permissions: ["quote.update"],
        },
        "version-1",
        { remarks: "Manager review" },
      ),
    ).resolves.toMatchObject({ remarks: "Manager review" });
  });
});
