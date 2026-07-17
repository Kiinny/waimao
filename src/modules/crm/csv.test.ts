import { describe, expect, it } from "vitest";

import {
  exportLeadCsv,
  previewLeadCsv,
} from "@/modules/crm/csv";

describe("lead CSV preview", () => {
  it("parses quoted commas and reports row validation errors before commit", () => {
    const result = previewLeadCsv(
      [
        "companyName,contactName,email,phone,countryCode,source",
        '"Northstar, Inc.",Maya Chen,maya@northstar.example,+12065550180,US,Referral',
        "Invalid Co,Ivy,not-an-email,,USA,",
      ].join("\n"),
    );

    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]).toMatchObject({
      companyName: "Northstar, Inc.",
      countryCode: "US",
    });
    expect(result.errors).toEqual([
      expect.objectContaining({
        row: 3,
        issues: expect.arrayContaining(["email", "countryCode", "source"]),
      }),
    ]);
  });

  it("rejects a file with missing required headers", () => {
    expect(() =>
      previewLeadCsv("companyName,email\nExample,buyer@example.com"),
    ).toThrowError(/headers/i);
  });
});

describe("lead CSV export", () => {
  it("escapes values and emits only the records supplied by the scoped query", () => {
    const csv = exportLeadCsv([
      {
        companyName: "Northstar, Inc.",
        contactName: 'Maya "MJ" Chen',
        email: "maya@northstar.example",
        phone: "+12065550180",
        countryCode: "US",
        source: "Referral",
        status: "QUALIFIED",
        ownerName: "Lina Wu",
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
      },
    ]);

    expect(csv).toContain('"Northstar, Inc."');
    expect(csv).toContain('"Maya ""MJ"" Chen"');
    expect(csv).toContain("2026-07-01T00:00:00.000Z");
    expect(csv.split("\n")).toHaveLength(2);
  });
});
