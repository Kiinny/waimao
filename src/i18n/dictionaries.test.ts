import { describe, expect, it } from "vitest";

import { getDictionary } from "@/i18n/dictionaries";

describe("locale dictionaries", () => {
  it("contains readable Chinese navigation and authentication copy", () => {
    const dictionary = getDictionary("zh");

    expect(dictionary.appName).toBe("Atlas \u5916\u8d38 CRM");
    expect(dictionary.nav.dashboard).toBe("\u4eea\u8868\u76d8");
    expect(dictionary.auth.signIn).toBe("\u5b89\u5168\u767b\u5f55");
    expect(dictionary.languageName).toBe("\u4e2d\u6587");
  });

  it("provides localized user, role, dashboard and risk headings", () => {
    const dictionary = getDictionary("zh");

    expect(dictionary.users.title).toBe("\u7528\u6237");
    expect(dictionary.roles.title).toBe("\u89d2\u8272");
    expect(dictionary.dashboard.table.company).toBe("\u516c\u53f8");
    expect(dictionary.dashboard.risks.title).toBe(
      "\u901a\u77e5\u4e0e\u98ce\u9669",
    );
  });

  it("provides Chinese search labels and shell accessibility text", () => {
    const dictionary = getDictionary("zh");

    expect(dictionary.search.table.type).toBe("\u7c7b\u578b");
    expect(dictionary.search.entities.customer).toBe("\u5ba2\u6237");
    expect(dictionary.search.entities.order).toBe("\u8ba2\u5355");
    expect(dictionary.search.entities.quote).toBe("\u62a5\u4ef7");
    expect(dictionary.signOutLabel).toBe("\u9000\u51fa\u767b\u5f55");
    expect(dictionary.themeLabel).toBe("\u5207\u6362\u989c\u8272\u4e3b\u9898");
    expect(dictionary.dashboard.metricsLabel).toBe(
      "\u4e1a\u52a1\u6307\u6807",
    );
  });

  it("keeps English punctuation readable", () => {
    expect(getDictionary("en").search.placeholder).toBe(
      "Search customers, orders, quotes\u2026",
    );
  });
});
