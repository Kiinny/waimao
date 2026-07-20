import Link from "next/link";
import { notFound } from "next/navigation";

import {
  QuoteVersionEditForm,
  TransactionAction,
} from "@/components/transactions/transaction-actions";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
import { quoteDetailCapabilities } from "@/modules/transactions/detail-capabilities";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";

export const dynamic = "force-dynamic";
const repository = new PrismaTransactionsRepository();

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "quote.read");
  const [quote, products] = await Promise.all([
    repository.getQuote(context, id),
    repository.listProducts(context),
  ]);
  if (!quote) notFound();
  const current = quote.versions[0];
  const capabilities = quoteDetailCapabilities(context, {
    ownerId: quote.ownerId,
    immutable: Boolean(current.immutableAt),
  });
  const configurations = products.flatMap((product) =>
    product.variants.map((variant) => ({
      id: variant.id,
      productId: product.id,
      label: `${product.sku} / v${variant.configurationVersion} ${variant.name}`,
    })),
  );
  const editableItems = current.items.flatMap((item) => {
    const configuration =
      item.configuration &&
      typeof item.configuration === "object" &&
      !Array.isArray(item.configuration)
        ? item.configuration
        : null;
    const variantId =
      configuration &&
      "variantId" in configuration &&
      typeof configuration.variantId === "string"
        ? configuration.variantId
        : null;
    return item.productId && variantId
      ? [
          {
            productId: item.productId,
            variantId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            discount: item.discount.toString(),
          },
        ]
      : [];
  });
  return (
    <>
      <header className="page-heading">
        <div><h1>{quote.quoteNumber}</h1><p>{quote.customer.companyName} · {quote.status} · v{quote.currentVersion}</p></div>
        <Link className="button button-secondary" href={`/api/quotes/${id}/pdf?locale=${locale}`} target="_blank">PDF</Link>
      </header>
      <section className="card section-card">
        <h2>Commercial summary</h2>
        <p>{current.currencyCode} {current.total.toString()} · {current.incoterm ?? "—"}</p>
        <p>{current.paymentTerms ?? "—"}</p>
        <div className="button-row">
          {capabilities.transition && quote.status === "DRAFT" ? <TransactionAction body={{ status: "PENDING_APPROVAL" }} confirmMessage="Submit this version for approval?" endpoint={`/api/quotes/${id}/transition`} label="Submit approval" /> : null}
          {capabilities.approve && quote.status === "PENDING_APPROVAL" ? <TransactionAction body={{ status: "APPROVED", note: "Commercial terms and margin reviewed" }} confirmMessage="Approve this quotation version?" endpoint={`/api/quotes/${id}/transition`} label="Approve" /> : null}
          {capabilities.approve && quote.status === "PENDING_APPROVAL" ? <TransactionAction body={{ status: "REJECTED", note: "Commercial review rejected" }} confirmMessage="Reject this quotation version?" endpoint={`/api/quotes/${id}/transition`} label="Reject" /> : null}
          {capabilities.transition && quote.status === "APPROVED" ? <TransactionAction body={{ status: "SENT" }} confirmMessage="Send and permanently lock this version?" endpoint={`/api/quotes/${id}/transition`} label="Mark sent" /> : null}
          {capabilities.transition && quote.status === "SENT" ? <TransactionAction body={{ status: "VIEWED" }} confirmMessage="Record customer view?" endpoint={`/api/quotes/${id}/transition`} label="Mark viewed" /> : null}
          {capabilities.transition && ["SENT", "VIEWED"].includes(quote.status) ? <TransactionAction body={{ status: "ACCEPTED" }} confirmMessage="Record customer acceptance?" endpoint={`/api/quotes/${id}/transition`} label="Accept" /> : null}
          {capabilities.transition && ["SENT", "VIEWED"].includes(quote.status) ? <TransactionAction body={{ status: "REJECTED", note: "Customer rejected quotation" }} confirmMessage="Record customer rejection?" endpoint={`/api/quotes/${id}/transition`} label="Reject" /> : null}
          {capabilities.convert && quote.status === "ACCEPTED" ? <TransactionAction confirmMessage="Convert this accepted version to one sales order?" endpoint={`/api/quotes/${id}/convert`} label="Convert to order" /> : null}
          {capabilities.revise ? <TransactionAction confirmMessage="Create a new editable version from this immutable version?" endpoint={`/api/quotes/${id}/revise`} label="Revise / Copy" /> : null}
        </div>
      </section>
      {capabilities.edit && editableItems.length ? (
        <details className="card section-card">
          <summary>Edit items, charges and terms</summary>
          <QuoteVersionEditForm
            configurations={configurations}
            initial={{
              currencyCode: current.currencyCode,
              exchangeRateToUsd: current.exchangeRateToUsd.toString(),
              shipping: current.shipping.toString(),
              insurance: current.insurance.toString(),
              tax: current.tax.toString(),
              bankFees: current.bankFees.toString(),
              incoterm: current.incoterm ?? "",
              paymentTerms: current.paymentTerms ?? "",
              deliveryTerms: current.deliveryTerms ?? "",
              warrantyTerms: current.warrantyTerms ?? "",
              remarks: current.remarks ?? "",
              items: editableItems,
            }}
            versionId={current.id}
          />
        </details>
      ) : null}
      <section className="card section-card">
        <h2>Version history</h2>
        {quote.versions.map((version) => (
          <article className="record-card" key={version.id}>
            <strong>Version {version.number} · {version.immutableAt ? "Immutable" : "Editable"}</strong>
            <span>{version.currencyCode} {version.total.toString()}</span>
            {version.items.map((item) => <span key={item.id}>{item.quantity} × {item.description} · {item.lineTotal.toString()}</span>)}
          </article>
        ))}
      </section>
    </>
  );
}
