import { describe, expect, it } from "vitest";

import {
  approveQuote,
  convertAcceptedQuote,
  reviseQuote,
  transitionQuote,
  type TransactionRepository,
} from "@/modules/transactions/transaction-service";

function repository(): TransactionRepository & {
  approvals: string[];
  conversions: string[];
  revisions: number[];
} {
  const approvals: string[] = [];
  const conversions: string[] = [];
  const revisions: number[] = [];
  return {
    approvals,
    conversions,
    revisions,
    findQuote: async () => ({
      id: "quote-1",
      ownerId: "sales-1",
      status: "PENDING_APPROVAL",
      currentVersion: 1,
      orderId: null,
      current: {
        id: "version-1",
        number: 1,
        immutableAt: new Date("2026-07-17"),
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        shipping: "0",
        insurance: "0",
        tax: "0",
        bankFees: "0",
        items: [{ description: "Server", quantity: 1 }],
      },
    }),
    transitionQuote: async (_context, quote, status) => {
      if (status === "APPROVED") approvals.push(quote.id);
      return { id: quote.id, status };
    },
    createRevision: async (_context, quote, revision) => {
      revisions.push(revision.number);
      return { id: quote.id, currentVersion: revision.number, status: "DRAFT" };
    },
    convertQuote: async (_context, quote) => {
      if (conversions.includes(quote.id)) {
        throw Object.assign(new Error("duplicate"), {
          code: "QUOTE_ALREADY_CONVERTED",
          status: 409,
        });
      }
      conversions.push(quote.id);
      return { id: "order-1", quoteId: quote.id };
    },
  };
}

const manager = {
  userId: "manager-1",
  roles: ["SALES_MANAGER"],
  permissions: ["quote.read", "quote.update", "quote.approve", "order.create"],
};

describe("quotation transactions", () => {
  it("approves through the audited repository boundary", async () => {
    const repo = repository();
    await expect(
      approveQuote(repo, manager, "quote-1", "Margin reviewed"),
    ).resolves.toEqual({ id: "quote-1", status: "APPROVED" });
    expect(repo.approvals).toEqual(["quote-1"]);
  });

  it("does not let an ordinary sales representative approve", async () => {
    const repo = repository();
    await expect(
      approveQuote(
        repo,
        {
          userId: "sales-1",
          roles: ["SALES_REP"],
          permissions: ["quote.update", "quote.approve"],
        },
        "quote-1",
        "Self approval",
      ),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
    expect(repo.approvals).toEqual([]);
  });

  it("applies a valid non-approval transition through the repository", async () => {
    const repo = repository();
    await expect(
      transitionQuote(repo, manager, "quote-1", "REJECTED"),
    ).resolves.toEqual({ id: "quote-1", status: "REJECTED" });
  });

  it("does not let a Sales Representative reject a pending approval", async () => {
    const repo = repository();
    await expect(
      transitionQuote(
        repo,
        {
          userId: "sales-1",
          roles: ["SALES_REP"],
          permissions: ["quote.update", "quote.approve"],
        },
        "quote-1",
        "REJECTED",
      ),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
  });

  it("creates a sequential revision copied from the immutable current version", async () => {
    const repo = repository();
    await expect(reviseQuote(repo, manager, "quote-1")).resolves.toMatchObject({
      currentVersion: 2,
      status: "DRAFT",
    });
    expect(repo.revisions).toEqual([2]);
  });

  it("converts the accepted version only once", async () => {
    const repo = repository();
    repo.findQuote = async () => ({
      id: "quote-1",
      ownerId: "sales-1",
      status: "ACCEPTED",
      currentVersion: 1,
      orderId: null,
      current: {
        id: "version-1",
        number: 1,
        immutableAt: new Date("2026-07-17"),
        currencyCode: "USD",
        exchangeRateToUsd: "1",
        shipping: "0",
        insurance: "0",
        tax: "0",
        bankFees: "0",
        items: [{ description: "Server", quantity: 1 }],
      },
    });

    await expect(convertAcceptedQuote(repo, manager, "quote-1")).resolves.toEqual(
      { id: "order-1", quoteId: "quote-1" },
    );
    await expect(convertAcceptedQuote(repo, manager, "quote-1")).rejects.toMatchObject(
      { code: "QUOTE_ALREADY_CONVERTED", status: 409 },
    );
  });

  it("rejects conversion before customer acceptance", async () => {
    const repo = repository();
    await expect(convertAcceptedQuote(repo, manager, "quote-1")).rejects.toMatchObject(
      { code: "QUOTE_NOT_ACCEPTED", status: 409 },
    );
    expect(repo.conversions).toEqual([]);
  });
});
