import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiMutationForm } from "@/components/crm/api-mutation-form";
import { LeadCsvImport } from "@/components/crm/lead-csv-import";
import { LeadTable } from "@/components/crm/lead-table";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
import { PrismaCrmRepository } from "@/modules/crm/prisma-crm-repository";

export const dynamic = "force-dynamic";
const repository = new PrismaCrmRepository();

function value(input: string | string[] | undefined) {
  return typeof input === "string" ? input : undefined;
}

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const context = await currentAuthorizationContext();
  requirePermission(context, "lead.read");
  const query = await searchParams;
  const filters = {
    page: Number(value(query.page) ?? 1),
    pageSize: 20,
    query: value(query.query),
    countryCode: value(query.countryCode),
    source: value(query.source),
    status: value(query.status),
    createdFrom: value(query.createdFrom)
      ? new Date(`${value(query.createdFrom)}T00:00:00.000Z`)
      : undefined,
    createdTo: value(query.createdTo)
      ? new Date(`${value(query.createdTo)}T23:59:59.999Z`)
      : undefined,
  };
  const result = await repository.listLeads(context, filters);
  const exportQuery = new URLSearchParams();
  for (const [key, raw] of Object.entries(query)) {
    if (typeof raw === "string" && key !== "page") exportQuery.set(key, raw);
  }

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{dictionary.crm.leads.title}</h1>
          <p>{dictionary.crm.leads.subtitle}</p>
        </div>
        <Link className="button button-secondary" href={`/api/leads/export?${exportQuery}`}>
          {dictionary.crm.leads.export}
        </Link>
      </header>

      <form className="card filter-bar" method="get">
        <input defaultValue={filters.query} name="query" placeholder="Company, contact, email, phone" />
        <input defaultValue={filters.countryCode} maxLength={2} name="countryCode" placeholder="Country" />
        <input defaultValue={filters.source} name="source" placeholder="Source" />
        <select defaultValue={filters.status ?? ""} name="status">
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="CONVERTED">Converted</option>
          <option value="LOST">Lost</option>
        </select>
        <input defaultValue={value(query.createdFrom)} name="createdFrom" type="date" />
        <input defaultValue={value(query.createdTo)} name="createdTo" type="date" />
        <button className="button" type="submit">{dictionary.crm.search}</button>
      </form>

      <section className="card section-card">
        <div className="section-heading">
          <h2 className="section-title">{result.total} leads</h2>
          <span>Page {result.page} / {Math.max(1, result.pageCount)}</span>
        </div>
        <LeadTable
          emptyText={dictionary.crm.empty}
          leads={result.items.map((lead) => ({
            id: lead.id,
            companyName: lead.companyName,
            contactName: lead.contactName,
            countryCode: lead.countryCode,
            source: lead.source,
            status: lead.status,
            ownerName: lead.owner.name,
            createdAt: lead.createdAt.toISOString(),
          }))}
          locale={locale}
        />
        <div className="pagination">
          {result.page > 1 ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(result.page - 1) })}`}>Previous</Link> : <span />}
          {result.page < result.pageCount ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(result.page + 1) })}`}>Next</Link> : null}
        </div>
      </section>

      <div className="two-column">
        <details className="card section-card">
          <summary>{dictionary.crm.leads.new}</summary>
          <ApiMutationForm
            endpoint="/api/leads"
            failureMessage={dictionary.crm.failed}
            loadingLabel={dictionary.crm.loading}
            submitLabel={dictionary.crm.create}
            successMessage={dictionary.crm.success}
          >
            <label>Company<input name="companyName" required /></label>
            <label>Contact<input name="contactName" required /></label>
            <label>Email<input name="email" type="email" /></label>
            <label>Phone<input name="phone" /></label>
            <label>Country<input maxLength={2} name="countryCode" required /></label>
            <label>Source<input name="source" required /></label>
            <label>Notes<textarea name="notes" rows={3} /></label>
          </ApiMutationForm>
        </details>
        <details className="card section-card">
          <summary>{dictionary.crm.leads.import}</summary>
          <LeadCsvImport />
        </details>
      </div>
    </>
  );
}
