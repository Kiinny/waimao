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

function value(input: string | string[] | undefined) {
  return typeof input === "string" ? input : undefined;
}

export default async function CustomersPage({
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
  requirePermission(context, "customer.read");
  const query = await searchParams;
  const result = await repository.listCustomers(context, {
    page: Number(value(query.page) ?? 1),
    query: value(query.query),
    countryCode: value(query.countryCode),
    status: value(query.status),
    level: value(query.level),
    riskRating: value(query.riskRating),
  });

  return (
    <>
      <header className="page-heading"><div><h1>{dictionary.crm.customers.title}</h1><p>{dictionary.crm.customers.subtitle}</p></div></header>
      <form className="card filter-bar" method="get">
        <input defaultValue={value(query.query)} name="query" placeholder="Company, legal name, email" />
        <input defaultValue={value(query.countryCode)} maxLength={2} name="countryCode" placeholder="Country" />
        <select defaultValue={value(query.status) ?? ""} name="status"><option value="">All statuses</option><option>ACTIVE</option><option>INACTIVE</option><option>ARCHIVED</option></select>
        <select defaultValue={value(query.level) ?? ""} name="level"><option value="">All levels</option><option>STANDARD</option><option>KEY</option><option>STRATEGIC</option></select>
        <select defaultValue={value(query.riskRating) ?? ""} name="riskRating"><option value="">All risk</option><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select>
        <button className="button" type="submit">{dictionary.crm.search}</button>
      </form>
      <section className="card section-card">
        <h2 className="section-title">{result.total} customers</h2>
        {result.items.length ? <div className="table-wrap"><table><thead><tr><th>Company</th><th>Country</th><th>Status</th><th>Level</th><th>Risk</th><th>Owner</th><th>Contacts</th><th>Opportunities</th></tr></thead><tbody>
          {result.items.map((customer) => <tr key={customer.id}>
            <td><Link className="table-link" href={`/${locale}/customers/${customer.id}`}>{customer.companyName}</Link></td>
            <td>{customer.countryCode}</td><td><span className="badge">{customer.status}</span></td><td>{customer.level}</td>
            <td><span className={`risk risk-${customer.riskRating.toLowerCase()}`}>{customer.riskRating}</span></td>
            <td>{customer.owner.name}</td><td>{customer._count.contacts}</td><td>{customer._count.opportunities}</td>
          </tr>)}
        </tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
      </section>
      <details className="card section-card">
        <summary>{dictionary.crm.customers.new}</summary>
        <ApiMutationForm endpoint="/api/customers" failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
          <label>Company<input name="companyName" required /></label>
          <label>Legal name<input name="legalName" /></label>
          <label>Country<input maxLength={2} name="countryCode" required /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Phone<input name="phone" /></label>
          <label>Level<select name="level"><option>STANDARD</option><option>KEY</option><option>STRATEGIC</option></select></label>
          <label>Risk<select name="riskRating"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>
        </ApiMutationForm>
      </details>
    </>
  );
}
