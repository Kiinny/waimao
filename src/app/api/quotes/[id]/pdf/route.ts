import { currentAuthorizationContext } from "@/lib/current-user";
import { DomainError } from "@/lib/errors";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { renderQuotePdf } from "@/modules/quotes/quote-pdf";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";

const repository = new PrismaTransactionsRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await currentAuthorizationContext();
  requirePermission(context, "quote.read");
  const quote = await repository.getQuote(context, (await params).id);
  if (!quote) {
    throw new DomainError("QUOTE_NOT_FOUND", "Quotation not found", 404);
  }
  const version = quote.versions[0];
  const profile = await getPrisma().setting.findUnique({
    where: { namespace_key: { namespace: "company", key: "profile" } },
  });
  const company = (profile?.value ?? {}) as Record<string, unknown>;
  const locale = new URL(request.url).searchParams.get("locale") === "zh" ? "zh" : "en";
  const pdf = renderQuotePdf({
    locale,
    company: {
      name: String(company.name ?? "Atlas Global Systems"),
      address: String(company.address ?? ""),
    },
    customer: {
      name: quote.customer.companyName,
      address: JSON.stringify(quote.customer.billingAddress ?? ""),
    },
    quoteNumber: quote.quoteNumber,
    version: version.number,
    currencyCode: version.currencyCode,
    items: version.items.map((item) => ({
      description: item.description,
      configuration: JSON.stringify(item.configuration ?? {}),
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
      imageLabel: "Product configuration image",
    })),
    total: version.total.toString(),
    incoterm: version.incoterm,
    paymentTerms: version.paymentTerms,
    deliveryTerms: version.deliveryTerms,
    warrantyTerms: version.warrantyTerms,
    remarks: version.remarks,
    bank: {
      beneficiary: String(company.bankBeneficiary ?? company.name ?? ""),
      account: String(company.bankAccount ?? ""),
    },
  });
  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.quoteNumber}-v${version.number}.pdf"`,
    },
  });
}
