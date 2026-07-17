export interface QuotePdfInput {
  locale: "en" | "zh";
  company: { name: string; address: string };
  customer: { name: string; address: string };
  quoteNumber: string;
  version: number;
  currencyCode: string;
  items: Array<{
    description: string;
    configuration: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    imageLabel?: string;
  }>;
  total: string;
  incoterm?: string | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  warrantyTerms?: string | null;
  remarks?: string | null;
  bank: { beneficiary: string; account: string };
}

function pdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "?")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function streamFor(input: QuotePdfInput) {
  const heading =
    input.locale === "zh" ? "QUOTATION / BAOJIA DAN" : "QUOTATION";
  const lines = [
    heading,
    `${input.company.name} | ${input.company.address}`,
    `Quote: ${input.quoteNumber} | Version: ${input.version}`,
    `Customer: ${input.customer.name} | ${input.customer.address}`,
    "Items / Configuration",
    ...input.items.flatMap((item, index) => [
      `${index + 1}. ${item.description} | ${item.configuration}`,
      `Qty ${item.quantity} x ${input.currencyCode} ${item.unitPrice} = ${item.lineTotal}`,
      ...(item.imageLabel ? [`Image: ${item.imageLabel}`] : []),
    ]),
    `TOTAL ${input.currencyCode} ${input.total}`,
    `Incoterm: ${input.incoterm ?? "-"}`,
    `Payment Terms: ${input.paymentTerms ?? "-"}`,
    `Delivery: ${input.deliveryTerms ?? "-"}`,
    `Warranty: ${input.warrantyTerms ?? "-"}`,
    `Remarks: ${input.remarks ?? "-"}`,
    "Bank Information",
    `Beneficiary: ${input.bank.beneficiary}`,
    `Account: ${input.bank.account}`,
    "Authorized Signature: ____________________",
    "Customer Signature: ______________________",
  ];
  return [
    "BT",
    "/F1 16 Tf",
    "48 790 Td",
    ...lines.flatMap((line, index) => [
      ...(index === 1 ? ["/F1 10 Tf"] : []),
      `(${pdfText(line)}) Tj`,
      "0 -22 Td",
    ]),
    "ET",
  ].join("\n");
}

export function renderQuotePdf(input: QuotePdfInput) {
  const content = streamFor(input);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  pdf += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
