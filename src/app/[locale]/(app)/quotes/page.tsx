import Link from "next/link";
import { notFound } from "next/navigation";

import { QuoteCreateForm } from "@/components/transactions/transaction-actions";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";

export const dynamic = "force-dynamic";
const repository = new PrismaTransactionsRepository();
const crm = new PrismaCrmRepository();

export default async function QuotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "quote.read");
  const [quotes, products, customers] = await Promise.all([
    repository.listQuotes(context),
    repository.listProducts(context),
    crm.listCustomers(context, { pageSize: 100 }),
  ]);
  const configurations = products.flatMap((product) =>
    product.variants.map((variant) => ({
      id: variant.id,
      productId: product.id,
      label: `${product.sku} / v${variant.configurationVersion} ${variant.name}`,
    })),
  );
  const zh = locale === "zh";
  return (
    <>
      <header className="page-heading"><div><h1>{zh ? "报价单" : "Quotations"}</h1><p>{zh ? "版本、审批与客户接受" : "Versions, approval and customer acceptance"}</p></div></header>
      <section className="record-grid">
        {quotes.map((quote) => (
          <Link className="record-card" href={`/${locale}/quotes/${quote.id}`} key={quote.id}>
            <strong>{quote.quoteNumber} · v{quote.currentVersion}</strong>
            <span>{quote.customer.companyName}</span>
            <span>{quote.status}</span>
            <span>{quote.versions[0]?.currencyCode} {quote.versions[0]?.total.toString()}</span>
          </Link>
        ))}
      </section>
      <details className="card section-card">
        <summary>{zh ? "创建报价" : "Build quotation"}</summary>
        <QuoteCreateForm configurations={configurations} customers={customers.items.map(({ id, companyName }) => ({ id, companyName }))} />
      </details>
    </>
  );
}
