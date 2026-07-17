import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiMutationForm } from "@/components/crm/api-mutation-form";
import { EmptyState } from "@/components/empty-state";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

export const dynamic = "force-dynamic";
const repository = new PrismaCrmRepository();

function Empty({ text }: { text: string }) {
  return <EmptyState title={text} />;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const context = await currentAuthorizationContext();
  requirePermission(context, "customer.read");
  const customer = await repository.getCustomerDetail(context, id);
  if (!customer) notFound();
  const tabs = dictionary.crm.tabs;
  const payments = customer.orders.flatMap((order) => order.payments);
  const shipments = customer.orders.flatMap((order) => order.shipments);

  return (
    <>
      <header className="page-heading">
        <div><Link className="breadcrumb" href={`/${locale}/customers`}>← {dictionary.crm.customers.title}</Link><h1>{customer.companyName}</h1><p>{customer.countryCode} · {customer.owner.name}</p></div>
        <div className="status-group"><span className="badge">{customer.status}</span><span className={`risk risk-${customer.riskRating.toLowerCase()}`}>{customer.riskRating}</span></div>
      </header>
      <nav className="detail-tabs" aria-label="Customer details">
        {Object.entries(tabs).map(([key, label]) => <a href={`#${key}`} key={key}>{label}</a>)}
      </nav>
      <section className="card detail-section" id="overview"><h2>{tabs.overview}</h2>
        <dl className="detail-grid"><div><dt>Legal name</dt><dd>{customer.legalName || "—"}</dd></div><div><dt>Email</dt><dd>{customer.email || "—"}</dd></div><div><dt>Phone</dt><dd>{customer.phone || "—"}</dd></div><div><dt>Level</dt><dd>{customer.level}</dd></div><div><dt>Risk notes</dt><dd>{customer.riskNotes || "—"}</dd></div></dl>
        <details><summary>{dictionary.crm.edit}</summary><ApiMutationForm endpoint={`/api/customers/${customer.id}`} failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} method="PATCH" submitLabel={dictionary.crm.save} successMessage={dictionary.crm.success}>
          <label>Company<input defaultValue={customer.companyName} name="companyName" /></label><label>Email<input defaultValue={customer.email ?? ""} name="email" type="email" /></label>
          <label>Level<select defaultValue={customer.level} name="level"><option>STANDARD</option><option>KEY</option><option>STRATEGIC</option></select></label>
          <label>Risk<select defaultValue={customer.riskRating} name="riskRating"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
          <label>Risk notes<textarea defaultValue={customer.riskNotes ?? ""} name="riskNotes" rows={3} /></label>
        </ApiMutationForm></details>
      </section>
      <section className="card detail-section" id="contacts"><h2>{tabs.contacts}</h2>
        {customer.contacts.length ? <div className="record-grid">{customer.contacts.map((contact) => <article className="record-card" key={contact.id}><strong>{contact.firstName} {contact.lastName}</strong>{contact.isPrimary ? <span className="badge">Primary</span> : null}<span>{contact.decisionRole ?? contact.title ?? "Contact"}</span><span>{contact.email ?? contact.phone ?? "No channel"}</span><small>{contact.language} · {contact.timezone ?? "No timezone"}</small></article>)}</div> : <Empty text={dictionary.crm.empty} />}
        <details><summary>Add contact</summary><ApiMutationForm booleanFields={["isPrimary"]} endpoint={`/api/customers/${customer.id}/contacts`} failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
          <label>First name<input name="firstName" required /></label><label>Last name<input name="lastName" /></label><label>Email<input name="email" type="email" /></label><label>Phone<input name="phone" /></label>
          <label>Decision role<select name="decisionRole"><option value="">None</option><option>DECISION_MAKER</option><option>INFLUENCER</option><option>TECHNICAL</option><option>FINANCE</option><option>USER</option></select></label>
          <label>Language<input defaultValue="en" name="language" /></label><label>Timezone<input name="timezone" placeholder="Asia/Shanghai" /></label><label><input name="isPrimary" type="checkbox" /> Primary contact</label>
        </ApiMutationForm></details>
      </section>
      <section className="card detail-section" id="followUps"><h2>{tabs.followUps}</h2>{customer.followUps.length ? <ol className="timeline">{customer.followUps.map((item) => <li key={item.id}><strong>{item.type} · {item.channel}</strong><p>{item.summary}</p><time>{item.occurredAt.toLocaleString(locale)}</time></li>)}</ol> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="opportunities"><h2>{tabs.opportunities}</h2>{customer.opportunities.length ? <div className="record-grid">{customer.opportunities.map((item) => <article className="record-card" key={item.id}><strong>{item.name}</strong><span className="badge">{item.stage}</span><span>${item.valueUsd.toFixed(2)} · {item.probability}%</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="quotations"><h2>{tabs.quotations}</h2>{customer.quotes.length ? <div className="record-grid">{customer.quotes.map((item) => <article className="record-card" key={item.id}><strong>{item.quoteNumber}</strong><span>{item.status}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="orders"><h2>{tabs.orders}</h2>{customer.orders.length ? <div className="record-grid">{customer.orders.map((item) => <article className="record-card" key={item.id}><strong>{item.orderNumber}</strong><span>{item.status}</span><span>${item.totalUsd.toFixed(2)}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="payments"><h2>{tabs.payments}</h2>{payments.length ? <div className="record-grid">{payments.map((item) => <article className="record-card" key={item.id}><strong>{item.reference ?? item.id}</strong><span>{item.status}</span><span>{item.currencyCode} {item.amount.toFixed(2)}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="shipments"><h2>{tabs.shipments}</h2>{shipments.length ? <div className="record-grid">{shipments.map((item) => <article className="record-card" key={item.id}><strong>{item.shipmentNumber}</strong><span>{item.status}</span><span>{item.trackingNumber ?? "No tracking"}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="afterSales"><h2>{tabs.afterSales}</h2>{customer.tickets.length ? <div className="record-grid">{customer.tickets.map((item) => <article className="record-card" key={item.id}><strong>{item.ticketNumber}</strong><span>{item.status}</span><span>{item.subject}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="files"><h2>{tabs.files}</h2>{customer.files.length ? <div className="record-grid">{customer.files.map((item) => <article className="record-card" key={item.id}><strong>{item.fileName}</strong><span>{item.contentType}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="activity"><h2>{tabs.activity}</h2>{customer.activity.length ? <ol className="timeline">{customer.activity.map((item) => <li key={item.id}><strong>{item.action}</strong><time>{item.createdAt.toLocaleString(locale)}</time></li>)}</ol> : <Empty text={dictionary.crm.empty} />}</section>
    </>
  );
}
