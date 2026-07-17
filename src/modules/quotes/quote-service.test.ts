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
  it("updates an editable draft version", async () => {
    const state = repositoryFor({
      id: "version-1",
      quoteStatus: "DRAFT",
      immutableAt: null,
    });

    await expect(
      updateQuoteVersion(state.repository, "version-1", {
        remarks: "Updated terms",
      }),
    ).resolves.toMatchObject({ remarks: "Updated terms" });
    expect(state.updates).toEqual([{ remarks: "Updated terms" }]);
  });

  it.each(["SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED", "CONVERTED"])(
    "rejects changes when a quotation is %s",
    async (quoteStatus) => {
      const state = repositoryFor({
        id: "version-1",
        quoteStatus,
        immutableAt: new Date("2026-01-01"),
      });

      await expect(
        updateQuoteVersion(state.repository, "version-1", {
          remarks: "Tampered",
        }),
      ).rejects.toMatchObject({ code: "QUOTE_IMMUTABLE", status: 409 });
      expect(state.updates).toEqual([]);
    },
  );
});
