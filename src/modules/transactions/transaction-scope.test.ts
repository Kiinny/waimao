import { describe, expect, it } from "vitest";

import { transactionOrderWhere } from "@/modules/transactions/transaction-scope";

describe("transaction order scope", () => {
  it("keeps Sales Representatives scoped to their own orders", () => {
    expect(
      transactionOrderWhere({
        userId: "sales-1",
        roles: ["SALES_REP"],
        permissions: ["order.read"],
      }),
    ).toEqual({ ownerId: "sales-1" });
  });

  it.each(["FINANCE", "PROCUREMENT", "OPERATIONS"])(
    "lets %s users work their explicitly permitted cross-owner orders",
    (role) => {
      expect(
        transactionOrderWhere({
          userId: `${role.toLowerCase()}-1`,
          roles: [role],
          permissions: ["order.read"],
        }),
      ).toEqual({});
    },
  );
});
