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
  const crm = dictionary.crm;
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
        <input defaultValue={filters.query} name="query" placeholder={crm.fields.companySearch} />
        <input defaultValue={filters.countryCode} maxLength={2} name="countryCode" placeholder={crm.fields.country} />
        <input defaultValue={filters.source} name="source" placeholder={crm.fields.source} />
        <select defaultValue={filters.status ?? ""} name="status">
          <option value="">{crm.options.allStatuses}</option>
          {["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"].map((status) => (
            <option key={status} value={status}>{crm.statuses[status as keyof typeof crm.statuses]}</option>
          ))}
        </select>
        <input aria-label={crm.fields.createdFrom} defaultValue={value(query.createdFrom)} name="createdFrom" type="date" />
        <input aria-label={crm.fields.createdTo} defaultValue={value(query.createdTo)} name="createdTo" type="date" />
        <button className="button" type="submit">{dictionary.crm.search}</button>
      </form>

      <section className="card section-card">
        <div className="section-heading">
          <h2 className="section-title">{crm.pagination.leadCount.replace("{count}", String(result.total))}</h2>
          <span>{crm.pagination.page.replace("{page}", String(result.page)).replace("{total}", String(Math.max(1, result.pageCount)))}</span>
        </div>
        <LeadTable
          emptyText={dictionary.crm.empty}
          canAssign={context.roles?.some((role) => ["SALES_MANAGER", "SUPER_ADMIN"].includes(role)) === true}
          labels={{
            selected: crm.feedback.selected,
            confirmBatch: crm.feedback.confirmBatch,
            updating: crm.feedback.updating,
            applyStatus: crm.actions.applyStatus,
            assignOwner: crm.actions.assignOwner,
            selectOwner: crm.options.selectOwner,
            batchUpdated: crm.feedback.batchUpdated,
            batchFailed: crm.feedback.batchFailed,
            select: crm.options.none,
            company: crm.fields.company,
            contact: crm.fields.contact,
            country: crm.fields.country,
            source: crm.fields.source,
            status: crm.fields.status,
            owner: crm.fields.owner,
            added: crm.fields.added,
            statuses: crm.statuses,
          }}
          leads={result.items.map((lead) => ({
            id: lead.id,
            companyName: lead.companyName,
            contactName: lead.contactName,
            countryCode: lead.countryCode,
            source: lead.source,
            status: lead.status,
            ownerId: lead.owner.id,
            ownerName: lead.owner.name,
            createdAt: lead.createdAt.toISOString(),
          }))}
          locale={locale}
        />
        <div className="pagination">
          {result.page > 1 ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(result.page - 1) })}`}>{crm.pagination.previous}</Link> : <span />}
          {result.page < result.pageCount ? <Link href={`?${new URLSearchParams({ ...Object.fromEntries(exportQuery), page: String(result.page + 1) })}`}>{crm.pagination.next}</Link> : null}
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
            <label>{crm.fields.company}<input name="companyName" required /></label>
            <label>{crm.fields.contact}<input name="contactName" required /></label>
            <label>{crm.fields.email}<input name="email" type="email" /></label>
            <label>{crm.fields.phone}<input name="phone" /></label>
            <label>{crm.fields.country}<input maxLength={2} name="countryCode" required /></label>
            <label>{crm.fields.source}<input name="source" required /></label>
            <label>{crm.fields.notes}<textarea name="notes" rows={3} /></label>
          </ApiMutationForm>
        </details>
        <details className="card section-card">
          <summary>{dictionary.crm.leads.import}</summary>
          <LeadCsvImport labels={{
            label: crm.csv.label,
            placeholder: crm.csv.placeholder,
            checking: crm.actions.checking,
            preview: crm.actions.preview,
            commit: crm.actions.commit,
            imported: crm.feedback.imported,
            importFailed: crm.feedback.importFailed,
            validRows: crm.feedback.validRows,
            rowError: crm.feedback.rowError,
          }} />
        </details>
      </div>
    </>
  );
}
