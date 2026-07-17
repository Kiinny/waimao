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

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
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
        <span className="badge">{lead.status}</span>
      </header>
      <div className="two-column">
        <section className="card section-card">
          <h2 className="section-title">{dictionary.crm.edit}</h2>
          <ApiMutationForm
            endpoint={`/api/leads/${lead.id}`}
            failureMessage={dictionary.crm.failed}
            loadingLabel={dictionary.crm.loading}
            method="PATCH"
            submitLabel={dictionary.crm.save}
            successMessage={dictionary.crm.success}
          >
            <label>Company<input defaultValue={lead.companyName} name="companyName" required /></label>
            <label>Contact<input defaultValue={lead.contactName} name="contactName" required /></label>
            <label>Email<input defaultValue={lead.email ?? ""} name="email" type="email" /></label>
            <label>Phone<input defaultValue={lead.phone ?? ""} name="phone" /></label>
            <label>Status<select defaultValue={lead.status} name="status">
              {["NEW", "CONTACTED", "QUALIFIED", "LOST"].map((status) => <option key={status}>{status}</option>)}
            </select></label>
            <label>Notes<textarea defaultValue={lead.notes ?? ""} name="notes" rows={4} /></label>
          </ApiMutationForm>
        </section>
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
              <label>Opportunity name<input name="opportunityName" required /></label>
              <label>Value<input min="0" name="value" required step="0.01" type="number" /></label>
              <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" required /></label>
              <label>USD exchange rate<input defaultValue="1" min="0" name="exchangeRateToUsd" required step="0.000001" type="number" /></label>
              <label>Probability<input defaultValue="10" max="100" min="0" name="probability" required type="number" /></label>
            </ApiMutationForm>
          </section>
        ) : (
          <section className="card section-card"><h2>Conversion</h2><p>Customer and opportunity were created in one transaction.</p></section>
        )}
      </div>
      <section className="card section-card">
        <h2 className="section-title">Follow-up timeline</h2>
        <ApiMutationForm
          dateFields={["occurredAt", "nextActionAt"]}
          endpoint="/api/follow-ups"
          failureMessage={dictionary.crm.failed}
          loadingLabel={dictionary.crm.loading}
          submitLabel="Add follow-up"
          successMessage={dictionary.crm.success}
        >
          <input name="leadId" type="hidden" value={lead.id} />
          <label>Type<select name="type"><option>CALL</option><option>EMAIL</option><option>MEETING</option><option>NOTE</option></select></label>
          <label>Channel<select name="channel"><option>PHONE</option><option>EMAIL</option><option>VIDEO</option><option>WHATSAPP</option><option>WECHAT</option></select></label>
          <label>Summary<textarea name="summary" required rows={3} /></label>
          <label>Outcome<input name="outcome" /></label>
          <label>Occurred<input defaultValue={new Date().toISOString().slice(0, 16)} name="occurredAt" required type="datetime-local" /></label>
          <label>Next action<input name="nextAction" /></label>
          <label>Next action date<input name="nextActionAt" type="datetime-local" /></label>
        </ApiMutationForm>
        {lead.followUps.length ? (
          <ol className="timeline">
            {lead.followUps.map((followUp) => (
              <li key={followUp.id}>
                <strong>{followUp.type} · {followUp.channel}</strong>
                <p>{followUp.summary}</p>
                <time>{followUp.occurredAt.toLocaleString(locale)}</time>
              </li>
            ))}
          </ol>
        ) : <EmptyState title={dictionary.crm.empty} />}
      </section>
    </>
  );
}
