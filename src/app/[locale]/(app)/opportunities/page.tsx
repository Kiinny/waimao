import { notFound } from "next/navigation";

import { ApiMutationForm } from "@/components/crm/api-mutation-form";
import { OpportunityBoard } from "@/components/crm/opportunity-board";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
import { weightedForecast } from "@/modules/crm/crm-domain";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

export const dynamic = "force-dynamic";
const repository = new PrismaCrmRepository();

export default async function OpportunitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const context = await currentAuthorizationContext();
  requirePermission(context, "opportunity.read");
  const [result, customers] = await Promise.all([
    repository.listOpportunities(context, { pageSize: 100 }),
    repository.listCustomers(context, { pageSize: 100 }),
  ]);
  const forecast = weightedForecast(
    result.items.map((item) => ({
      valueUsd: item.valueUsd.toString(),
      probability: item.probability,
      stage: item.stage,
    })),
  );

  return (
    <>
      <header className="page-heading">
        <div><h1>{dictionary.crm.opportunities.title}</h1><p>{dictionary.crm.opportunities.subtitle}</p></div>
        <article className="card forecast-card"><span>{dictionary.crm.opportunities.forecast}</span><strong>${Number(forecast).toLocaleString(locale)}</strong></article>
      </header>
      <OpportunityBoard opportunities={result.items.map((item) => ({
        id: item.id,
        name: item.name,
        stage: item.stage,
        valueUsd: item.valueUsd.toString(),
        probability: item.probability,
        customerName: item.customer.companyName,
        ownerName: item.owner.name,
      }))} />
      <details className="card section-card">
        <summary>{dictionary.crm.opportunities.new}</summary>
        <ApiMutationForm dateFields={["expectedCloseAt"]} endpoint="/api/opportunities" failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} numericFields={["probability"]} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
          <label>Customer<select name="customerId" required><option value="">Select customer</option>{customers.items.map((customer) => <option key={customer.id} value={customer.id}>{customer.companyName}</option>)}</select></label>
          <label>Name<input name="name" required /></label><label>Value<input min="0" name="value" required step="0.01" type="number" /></label>
          <label>Currency<input defaultValue="USD" maxLength={3} name="currencyCode" /></label><label>USD exchange rate<input defaultValue="1" min="0" name="exchangeRateToUsd" required step="0.000001" type="number" /></label>
          <label>Probability<input defaultValue="10" max="100" min="0" name="probability" type="number" /></label><label>Expected close<input name="expectedCloseAt" type="datetime-local" /></label>
        </ApiMutationForm>
      </details>
    </>
  );
}
