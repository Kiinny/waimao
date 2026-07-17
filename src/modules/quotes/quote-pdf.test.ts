import { describe, expect, it } from "vitest";

import { renderQuotePdf } from "@/modules/quotes/quote-pdf";

describe("quotation PDF", () => {
  it("renders a PDF with commercial parties, items, terms, bank and signature sections", () => {
    const pdf = renderQuotePdf({
      locale: "en",
      company: { name: "Atlas Global Systems", address: "Shenzhen, China" },
      customer: { name: "Northstar Systems", address: "Austin, USA" },
      quoteNumber: "QUOTE-000001",
      version: 2,
      currencyCode: "USD",
      items: [
        {
          description: "GPU Server",
          configuration: "4 x NVIDIA L40S / 512GB RAM",
          quantity: 2,
          unitPrice: "25000.00",
          lineTotal: "50000.00",
          imageLabel: "Front view",
        },
      ],
      total: "50150.00",
      incoterm: "CIF",
      paymentTerms: "100% T/T Before Purchase",
      deliveryTerms: "30 days",
      warrantyTerms: "12 months",
      remarks: "Export subject to final compliance review.",
      bank: { beneficiary: "Atlas Global Systems", account: "00112233" },
    });

    const text = new TextDecoder().decode(pdf);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("Atlas Global Systems");
    expect(text).toContain("Northstar Systems");
    expect(text).toContain("GPU Server");
    expect(text).toContain("Bank Information");
    expect(text).toContain("Authorized Signature");
  });
});
