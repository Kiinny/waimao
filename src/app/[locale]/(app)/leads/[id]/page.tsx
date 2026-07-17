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

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const crm = dictionary.crm;
  const context = await currentAuthorizationContext();
  requirePermission(context, "lead.read");
  const lead = await repository.getLeadDetail(context, id);
  if (!lead) notFound();

  return (
    <>
      <header className="page-heading">
        <div>
          <Link className="breadcrumb" href={`/${locale}/leads`}>← {dictionary.crm.leads.title}</Link>
          <h1>{lead.companyName}</h1>
          <p>{lead.contactName} · {lead.countryCode} · {lead.owner.name}</p>
        </div>
        <span className="badge">{crm.statuses[lead.status]}</span>
      </header>
      <div className="two-column">
        {lead.status !== "CONVERTED" ? <section className="card section-card">
          <h2 className="section-title">{dictionary.crm.edit}</h2>
          <ApiMutationForm
            endpoint={`/api/leads/${lead.id}`}
            failureMessage={dictionary.crm.failed}
            loadingLabel={dictionary.crm.loading}
            method="PATCH"
            submitLabel={dictionary.crm.save}
            successMessage={dictionary.crm.success}
          >
            <label>{crm.fields.company}<input defaultValue={lead.companyName} name="companyName" required /></label>
            <label>{crm.fields.contact}<input defaultValue={lead.contactName} name="contactName" required /></label>
            <label>{crm.fields.email}<input defaultValue={lead.email ?? ""} name="email" type="email" /></label>
            <label>{crm.fields.phone}<input defaultValue={lead.phone ?? ""} name="phone" /></label>
            <label>{crm.fields.status}<select defaultValue={lead.status} name="status">
              {["NEW", "CONTACTED", "QUALIFIED", "LOST"].map((status) => <option key={status} value={status}>{crm.statuses[status as keyof typeof crm.statuses]}</option>)}
            </select></label>
            <label>{crm.fields.notes}<textarea defaultValue={lead.notes ?? ""} name="notes" rows={4} /></label>
          </ApiMutationForm>
        </section> : null}
        {lead.status !== "CONVERTED" ? (
          <section className="card section-card">
            <h2 className="section-title">{dictionary.crm.leads.convert}</h2>
            <ApiMutationForm
              endpoint={`/api/leads/${lead.id}/convert`}
              failureMessage={dictionary.crm.failed}
              loadingLabel={dictionary.crm.loading}
              numericFields={["probability"]}
              redirectTo={`/${locale}/customers`}
              submitLabel={dictionary.crm.leads.convert}
              successMessage={dictionary.crm.success}
            >
              <label>{crm.fields.opportunityName}<input name="opportunityName" required /></label>
              <label>{crm.fields.value}<input min="0" name="value" required step="0.01" type="number" /></label>
              <label>{crm.fields.currency}<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
              <label>{crm.fields.exchangeRate}<input defaultValue="1" min="0" name="exchangeRateToUsd" required step="0.000001" type="number" /></label>
              <label>{crm.fields.probability}<input defaultValue="10" max="100" min="0" name="probability" required type="number" /></label>
            </ApiMutationForm>
          </section>
        ) : (
          <section className="card section-card"><h2>{crm.detail.conversion}</h2><p>{crm.feedback.conversionComplete}</p></section>
        )}
      </div>
      <section className="card section-card">
        <h2 className="section-title">{crm.detail.followUpTimeline}</h2>
        <ApiMutationForm
          dateFields={["occurredAt", "nextActionAt"]}
          endpoint="/api/follow-ups"
          failureMessage={dictionary.crm.failed}
          loadingLabel={dictionary.crm.loading}
          submitLabel={crm.actions.addFollowUp}
          successMessage={dictionary.crm.success}
        >
          <input name="leadId" type="hidden" value={lead.id} />
          <label>{crm.fields.type}<select name="type">{["CALL", "EMAIL", "MEETING", "NOTE"].map((type) => <option key={type} value={type}>{crm.followUpTypes[type as keyof typeof crm.followUpTypes]}</option>)}</select></label>
          <label>{crm.fields.channel}<select name="channel">{["PHONE", "EMAIL", "VIDEO", "WHATSAPP", "WECHAT"].map((channel) => <option key={channel} value={channel}>{crm.channels[channel as keyof typeof crm.channels]}</option>)}</select></label>
          <label>{crm.fields.summary}<textarea name="summary" required rows={3} /></label>
          <label>{crm.fields.outcome}<input name="outcome" /></label>
          <label>{crm.fields.occurred}<input defaultValue={new Date().toISOString().slice(0, 16)} name="occurredAt" required type="datetime-local" /></label>
          <label>{crm.fields.nextAction}<input name="nextAction" /></label>
          <label>{crm.fields.nextActionDate}<input name="nextActionAt" type="datetime-local" /></label>
        </ApiMutationForm>
        {lead.followUps.length ? (
          <ol className="timeline">
            {lead.followUps.map((followUp) => (
              <li key={followUp.id}>
                <strong>{crm.followUpTypes[followUp.type as keyof typeof crm.followUpTypes] ?? followUp.type} · {crm.channels[followUp.channel as keyof typeof crm.channels] ?? followUp.channel}</strong>
                <p>{followUp.summary}</p>
                <time>{followUp.occurredAt.toLocaleString(locale)}</time>
                <details>
                  <summary>{crm.edit}</summary>
                  <ApiMutationForm endpoint={`/api/follow-ups/${followUp.id}`} failureMessage={crm.failed} loadingLabel={crm.loading} method="PATCH" submitLabel={crm.save} successMessage={crm.success}>
                    <label>{crm.fields.summary}<textarea defaultValue={followUp.summary} name="summary" required rows={2} /></label>
                    <label>{crm.fields.outcome}<input defaultValue={followUp.outcome ?? ""} name="outcome" /></label>
                    <label>{crm.fields.nextAction}<input defaultValue={followUp.nextAction ?? ""} name="nextAction" /></label>
                  </ApiMutationForm>
                  <ArchiveButton endpoint={`/api/follow-ups/${followUp.id}`} labels={{ archive: crm.actions.archive, archiving: crm.actions.archiving, confirm: crm.feedback.archiveConfirm, success: crm.feedback.archived, failure: crm.feedback.archiveFailed }} />
                </details>
              </li>
            ))}
          </ol>
        ) : <EmptyState title={dictionary.crm.empty} />}
      </section>
    </>
  );
}
