import { describe, expect, it } from "vitest";

import { searchOwnershipFilter } from "@/modules/search/search-scope";

describe("global search ownership scope", () => {
  it("limits a Sales Representative to records they own", () => {
    expect(
      searchOwnershipFilter({
        userId: "sales-1",
        roles: ["SALES_REP"],
        permissions: ["customer.read", "order.read", "quote.read"],
      }),
    ).toEqual({ ownerId: "sales-1" });
  });

  it("keeps Sales Manager search scope broad", () => {
    expect(
      searchOwnershipFilter({
        userId: "manager-1",
        roles: ["SALES_MANAGER"],
        permissions: ["customer.read", "order.read", "quote.read"],
      }),
    ).toEqual({});
  });

  it("keeps wildcard administrator search scope broad", () => {
    expect(
      searchOwnershipFilter({
        userId: "admin-1",
        roles: ["SUPER_ADMIN"],
        permissions: ["*"],
      }),
    ).toEqual({});
  });
});
