import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiMutationForm } from "@/components/crm/api-mutation-form";
import { ArchiveButton } from "@/components/crm/archive-button";
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
  const crm = dictionary.crm;
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
        <div className="status-group"><span className="badge">{crm.statuses[customer.status]}</span><span className={`risk risk-${customer.riskRating.toLowerCase()}`}>{crm.statuses[customer.riskRating as keyof typeof crm.statuses] ?? customer.riskRating}</span></div>
      </header>
      <nav className="detail-tabs" aria-label={crm.detail.customerDetails}>
        {Object.entries(tabs).map(([key, label]) => <a href={`#${key}`} key={key}>{label}</a>)}
      </nav>
      <section className="card detail-section" id="overview"><h2>{tabs.overview}</h2>
        <dl className="detail-grid"><div><dt>{crm.fields.legalName}</dt><dd>{customer.legalName || crm.options.noValue}</dd></div><div><dt>{crm.fields.email}</dt><dd>{customer.email || crm.options.noValue}</dd></div><div><dt>{crm.fields.phone}</dt><dd>{customer.phone || crm.options.noValue}</dd></div><div><dt>{crm.fields.level}</dt><dd>{crm.statuses[customer.level as keyof typeof crm.statuses] ?? customer.level}</dd></div><div><dt>{crm.fields.riskNotes}</dt><dd>{customer.riskNotes || crm.options.noValue}</dd></div></dl>
        <details><summary>{dictionary.crm.edit}</summary><ApiMutationForm endpoint={`/api/customers/${customer.id}`} failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} method="PATCH" submitLabel={dictionary.crm.save} successMessage={dictionary.crm.success}>
          <label>{crm.fields.company}<input defaultValue={customer.companyName} name="companyName" /></label><label>{crm.fields.email}<input defaultValue={customer.email ?? ""} name="email" type="email" /></label>
          <label>{crm.fields.level}<select defaultValue={customer.level} name="level">{["STANDARD", "KEY", "STRATEGIC"].map((level) => <option key={level} value={level}>{crm.statuses[level as keyof typeof crm.statuses]}</option>)}</select></label>
          <label>{crm.fields.risk}<select defaultValue={customer.riskRating} name="riskRating">{["LOW", "MEDIUM", "HIGH"].map((risk) => <option key={risk} value={risk}>{crm.statuses[risk as keyof typeof crm.statuses]}</option>)}</select></label>
          <label>{crm.fields.riskNotes}<textarea defaultValue={customer.riskNotes ?? ""} name="riskNotes" rows={3} /></label>
        </ApiMutationForm></details>
      </section>
      <section className="card detail-section" id="contacts"><h2>{tabs.contacts}</h2>
        {customer.contacts.length ? <div className="record-grid">{customer.contacts.map((contact) => <article className="record-card" key={contact.id}><strong>{contact.firstName} {contact.lastName}</strong>{contact.isPrimary ? <span className="badge">{crm.fields.primary}</span> : null}<span>{contact.decisionRole ? (crm.decisionRoles[contact.decisionRole as keyof typeof crm.decisionRoles] ?? contact.decisionRole) : (contact.title ?? crm.detail.contactFallback)}</span><span>{contact.email ?? contact.phone ?? crm.options.noChannel}</span><small>{contact.language} · {contact.timezone ?? crm.options.noTimezone}</small>
          <details><summary>{crm.edit}</summary><ApiMutationForm booleanFields={["isPrimary"]} endpoint={`/api/customers/${customer.id}/contacts/${contact.id}`} failureMessage={crm.failed} loadingLabel={crm.loading} method="PATCH" submitLabel={crm.save} successMessage={crm.success}>
            <label>{crm.fields.firstName}<input defaultValue={contact.firstName} name="firstName" required /></label><label>{crm.fields.lastName}<input defaultValue={contact.lastName} name="lastName" /></label><label>{crm.fields.email}<input defaultValue={contact.email ?? ""} name="email" type="email" /></label><label>{crm.fields.phone}<input defaultValue={contact.phone ?? ""} name="phone" /></label>
            <label>{crm.fields.decisionRole}<select defaultValue={contact.decisionRole ?? ""} name="decisionRole"><option value="">{crm.options.none}</option>{Object.entries(crm.decisionRoles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>{crm.fields.language}<input defaultValue={contact.language} name="language" /></label><label>{crm.fields.timezone}<input defaultValue={contact.timezone ?? ""} name="timezone" /></label><label><input defaultChecked={contact.isPrimary} name="isPrimary" type="checkbox" /> {crm.fields.primary}</label>
          </ApiMutationForm><ArchiveButton endpoint={`/api/customers/${customer.id}/contacts/${contact.id}`} labels={{ archive: crm.actions.archive, archiving: crm.actions.archiving, confirm: crm.feedback.archiveConfirm, success: crm.feedback.archived, failure: crm.feedback.archiveFailed }} /></details>
        </article>)}</div> : <Empty text={dictionary.crm.empty} />}
        <details><summary>{crm.actions.addContact}</summary><ApiMutationForm booleanFields={["isPrimary"]} endpoint={`/api/customers/${customer.id}/contacts`} failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
          <label>{crm.fields.firstName}<input name="firstName" required /></label><label>{crm.fields.lastName}<input name="lastName" /></label><label>{crm.fields.email}<input name="email" type="email" /></label><label>{crm.fields.phone}<input name="phone" /></label>
          <label>{crm.fields.decisionRole}<select name="decisionRole"><option value="">{crm.options.none}</option>{Object.entries(crm.decisionRoles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>{crm.fields.language}<input defaultValue="en" name="language" /></label><label>{crm.fields.timezone}<input name="timezone" placeholder="Asia/Shanghai" /></label><label><input name="isPrimary" type="checkbox" /> {crm.fields.primary}</label>
        </ApiMutationForm></details>
      </section>
      <section className="card detail-section" id="followUps"><h2>{tabs.followUps}</h2>{customer.followUps.length ? <ol className="timeline">{customer.followUps.map((item) => <li key={item.id}><strong>{crm.followUpTypes[item.type as keyof typeof crm.followUpTypes] ?? item.type} · {crm.channels[item.channel as keyof typeof crm.channels] ?? item.channel}</strong><p>{item.summary}</p><time>{item.occurredAt.toLocaleString(locale)}</time><details><summary>{crm.edit}</summary><ApiMutationForm endpoint={`/api/follow-ups/${item.id}`} failureMessage={crm.failed} loadingLabel={crm.loading} method="PATCH" submitLabel={crm.save} successMessage={crm.success}><label>{crm.fields.summary}<textarea defaultValue={item.summary} name="summary" rows={2} /></label><label>{crm.fields.outcome}<input defaultValue={item.outcome ?? ""} name="outcome" /></label><label>{crm.fields.nextAction}<input defaultValue={item.nextAction ?? ""} name="nextAction" /></label></ApiMutationForm><ArchiveButton endpoint={`/api/follow-ups/${item.id}`} labels={{ archive: crm.actions.archive, archiving: crm.actions.archiving, confirm: crm.feedback.archiveConfirm, success: crm.feedback.archived, failure: crm.feedback.archiveFailed }} /></details></li>)}</ol> : <Empty text={dictionary.crm.empty} />}
        <details><summary>{crm.actions.addFollowUp}</summary><ApiMutationForm dateFields={["occurredAt", "nextActionAt"]} endpoint="/api/follow-ups" failureMessage={crm.failed} loadingLabel={crm.loading} submitLabel={crm.create} successMessage={crm.success}>
          <input name="customerId" type="hidden" value={customer.id} />
          <label>{crm.fields.relatedContact}<select defaultValue="" name="contactId"><option value="">{crm.options.none}</option>{customer.contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName}</option>)}</select></label>
          <label>{crm.fields.relatedOpportunity}<select defaultValue="" name="opportunityId"><option value="">{crm.options.none}</option>{customer.opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.name}</option>)}</select></label>
          <label>{crm.fields.type}<select name="type" required>{Object.entries(crm.followUpTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>{crm.fields.channel}<select name="channel" required>{Object.entries(crm.channels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>{crm.fields.summary}<textarea minLength={2} name="summary" required rows={3} /></label>
          <label>{crm.fields.occurred}<input defaultValue={new Date().toISOString().slice(0, 16)} name="occurredAt" required type="datetime-local" /></label>
          <label>{crm.fields.outcome}<input name="outcome" /></label>
          <label>{crm.fields.nextAction}<input name="nextAction" /></label>
          <label>{crm.fields.nextActionDate}<input name="nextActionAt" type="datetime-local" /></label>
        </ApiMutationForm></details>
      </section>
      <section className="card detail-section" id="opportunities"><h2>{tabs.opportunities}</h2>{customer.opportunities.length ? <div className="record-grid">{customer.opportunities.map((item) => <article className="record-card" key={item.id}><strong>{item.name}</strong><span className="badge">{crm.statuses[item.stage]}</span><span>${item.valueUsd.toFixed(2)} · {item.probability}%</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="quotations"><h2>{tabs.quotations}</h2>{customer.quotes.length ? <div className="record-grid">{customer.quotes.map((item) => <article className="record-card" key={item.id}><strong>{item.quoteNumber}</strong><span>{item.status}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="orders"><h2>{tabs.orders}</h2>{customer.orders.length ? <div className="record-grid">{customer.orders.map((item) => <article className="record-card" key={item.id}><strong>{item.orderNumber}</strong><span>{item.status}</span><span>${item.totalUsd.toFixed(2)}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="payments"><h2>{tabs.payments}</h2>{payments.length ? <div className="record-grid">{payments.map((item) => <article className="record-card" key={item.id}><strong>{item.reference ?? item.id}</strong><span>{item.status}</span><span>{item.currencyCode} {item.amount.toFixed(2)}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="shipments"><h2>{tabs.shipments}</h2>{shipments.length ? <div className="record-grid">{shipments.map((item) => <article className="record-card" key={item.id}><strong>{item.shipmentNumber}</strong><span>{item.status}</span><span>{item.trackingNumber ?? crm.options.noTracking}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="afterSales"><h2>{tabs.afterSales}</h2>{customer.tickets.length ? <div className="record-grid">{customer.tickets.map((item) => <article className="record-card" key={item.id}><strong>{item.ticketNumber}</strong><span>{item.status}</span><span>{item.subject}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="files"><h2>{tabs.files}</h2>{customer.files.length ? <div className="record-grid">{customer.files.map((item) => <article className="record-card" key={item.id}><strong>{item.fileName}</strong><span>{item.contentType}</span></article>)}</div> : <Empty text={dictionary.crm.empty} />}</section>
      <section className="card detail-section" id="activity"><h2>{tabs.activity}</h2>{customer.activity.length ? <ol className="timeline">{customer.activity.map((item) => <li key={item.id}><strong>{item.action}</strong><time>{item.createdAt.toLocaleString(locale)}</time></li>)}</ol> : <Empty text={dictionary.crm.empty} />}</section>
    </>
  );
}
