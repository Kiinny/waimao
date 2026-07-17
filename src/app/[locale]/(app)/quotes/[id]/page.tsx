import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiMutationForm } from "@/components/crm/api-mutation-form";
import { TransactionAction } from "@/components/transactions/transaction-actions";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
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
  const quote = await repository.getQuote(context, id);
  if (!quote) notFound();
  const current = quote.versions[0];
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
          {quote.status === "DRAFT" ? <TransactionAction body={{ status: "PENDING_APPROVAL" }} confirmMessage="Submit this version for approval?" endpoint={`/api/quotes/${id}/transition`} label="Submit approval" /> : null}
          {quote.status === "PENDING_APPROVAL" ? <TransactionAction body={{ status: "APPROVED", note: "Commercial terms and margin reviewed" }} confirmMessage="Approve this quotation version?" endpoint={`/api/quotes/${id}/transition`} label="Approve" /> : null}
          {quote.status === "PENDING_APPROVAL" ? <TransactionAction body={{ status: "REJECTED", note: "Commercial review rejected" }} confirmMessage="Reject this quotation version?" endpoint={`/api/quotes/${id}/transition`} label="Reject" /> : null}
          {quote.status === "APPROVED" ? <TransactionAction body={{ status: "SENT" }} confirmMessage="Send and permanently lock this version?" endpoint={`/api/quotes/${id}/transition`} label="Mark sent" /> : null}
          {quote.status === "SENT" ? <TransactionAction body={{ status: "VIEWED" }} confirmMessage="Record customer view?" endpoint={`/api/quotes/${id}/transition`} label="Mark viewed" /> : null}
          {["SENT", "VIEWED"].includes(quote.status) ? <TransactionAction body={{ status: "ACCEPTED" }} confirmMessage="Record customer acceptance?" endpoint={`/api/quotes/${id}/transition`} label="Accept" /> : null}
          {["SENT", "VIEWED"].includes(quote.status) ? <TransactionAction body={{ status: "REJECTED", note: "Customer rejected quotation" }} confirmMessage="Record customer rejection?" endpoint={`/api/quotes/${id}/transition`} label="Reject" /> : null}
          {quote.status === "ACCEPTED" ? <TransactionAction confirmMessage="Convert this accepted version to one sales order?" endpoint={`/api/quotes/${id}/convert`} label="Convert to order" /> : null}
          {current.immutableAt ? <TransactionAction confirmMessage="Create a new editable version from this immutable version?" endpoint={`/api/quotes/${id}/revise`} label="Revise / Copy" /> : null}
        </div>
      </section>
      {!current.immutableAt ? (
        <details className="card section-card">
          <summary>Edit current draft terms</summary>
          <ApiMutationForm endpoint={`/api/quotes/versions/${current.id}`} failureMessage="Update failed" loadingLabel="Saving..." method="PATCH" submitLabel="Save" successMessage="Draft updated">
            <label>Payment terms<input defaultValue={current.paymentTerms ?? ""} name="paymentTerms" /></label>
            <label>Delivery terms<input defaultValue={current.deliveryTerms ?? ""} name="deliveryTerms" /></label>
            <label>Warranty<input defaultValue={current.warrantyTerms ?? ""} name="warrantyTerms" /></label>
            <label>Remarks<textarea defaultValue={current.remarks ?? ""} name="remarks" /></label>
          </ApiMutationForm>
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
