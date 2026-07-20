import { describe, expect, it } from "vitest";

import {
  orderDetailCapabilities,
  productDetailCapabilities,
  quoteDetailCapabilities,
} from "@/modules/transactions/detail-capabilities";

describe("transaction detail action capabilities", () => {
  it("hides quote approval from a Sales Representative despite quote update permission", () => {
    expect(
      quoteDetailCapabilities(
        {
          userId: "sales-1",
          roles: ["SALES_REP"],
          permissions: ["quote.read", "quote.update", "quote.approve"],
        },
        { ownerId: "sales-1", immutable: false },
      ),
    ).toMatchObject({ edit: true, approve: false, revise: false });
  });

  it("shows quote approval to a Sales Manager with approval permission", () => {
    expect(
      quoteDetailCapabilities(
        {
          userId: "manager-1",
          roles: ["SALES_MANAGER"],
          permissions: ["quote.read", "quote.update", "quote.approve"],
        },
        { ownerId: "sales-1", immutable: false },
      ).approve,
    ).toBe(true);
  });

  it("hides purchasing and finance actions from a Sales Representative", () => {
    expect(
      orderDetailCapabilities(
        {
          userId: "sales-1",
          roles: ["SALES_REP"],
          permissions: ["order.read", "order.update"],
        },
        { ownerId: "sales-1" },
      ),
    ).toMatchObject({
      transition: true,
      purchase: false,
      createPayment: false,
      verifyPayment: false,
      refund: false,
    });
  });

  it("shows only explicitly permitted Finance actions", () => {
    expect(
      orderDetailCapabilities(
        {
          userId: "finance-1",
          roles: ["FINANCE"],
          permissions: [
            "order.read",
            "payment.create",
            "payment.verify",
            "refund.create",
          ],
        },
        { ownerId: "sales-1" },
      ),
    ).toMatchObject({
      transition: false,
      purchase: false,
      createPayment: true,
      verifyPayment: true,
      refund: true,
    });
  });

  it("hides product editing from a read-only Procurement user", () => {
    expect(
      productDetailCapabilities({
        userId: "procurement-1",
        roles: ["PROCUREMENT"],
        permissions: ["product.read"],
      }).edit,
    ).toBe(false);
  });
});
