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
  const crm = dictionary.crm;
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
        <input defaultValue={value(query.query)} name="query" placeholder={crm.fields.customerSearch} />
        <input defaultValue={value(query.countryCode)} maxLength={2} name="countryCode" placeholder={crm.fields.country} />
        <select defaultValue={value(query.status) ?? ""} name="status"><option value="">{crm.options.allStatuses}</option>{["ACTIVE", "INACTIVE", "ARCHIVED"].map((status) => <option key={status} value={status}>{crm.statuses[status as keyof typeof crm.statuses]}</option>)}</select>
        <select defaultValue={value(query.level) ?? ""} name="level"><option value="">{crm.options.allLevels}</option>{["STANDARD", "KEY", "STRATEGIC"].map((level) => <option key={level} value={level}>{crm.statuses[level as keyof typeof crm.statuses]}</option>)}</select>
        <select defaultValue={value(query.riskRating) ?? ""} name="riskRating"><option value="">{crm.options.allRisk}</option>{["LOW", "MEDIUM", "HIGH"].map((risk) => <option key={risk} value={risk}>{crm.statuses[risk as keyof typeof crm.statuses]}</option>)}</select>
        <button className="button" type="submit">{dictionary.crm.search}</button>
      </form>
      <section className="card section-card">
        <h2 className="section-title">{crm.pagination.customerCount.replace("{count}", String(result.total))}</h2>
        {result.items.length ? <div className="table-wrap"><table><thead><tr><th>{crm.fields.company}</th><th>{crm.fields.country}</th><th>{crm.fields.status}</th><th>{crm.fields.level}</th><th>{crm.fields.risk}</th><th>{crm.fields.owner}</th><th>{crm.fields.contacts}</th><th>{crm.fields.opportunities}</th></tr></thead><tbody>
          {result.items.map((customer) => <tr key={customer.id}>
            <td><Link className="table-link" href={`/${locale}/customers/${customer.id}`}>{customer.companyName}</Link></td>
            <td>{customer.countryCode}</td><td><span className="badge">{crm.statuses[customer.status]}</span></td><td>{crm.statuses[customer.level as keyof typeof crm.statuses] ?? customer.level}</td>
            <td><span className={`risk risk-${customer.riskRating.toLowerCase()}`}>{crm.statuses[customer.riskRating as keyof typeof crm.statuses] ?? customer.riskRating}</span></td>
            <td>{customer.owner.name}</td><td>{customer._count.contacts}</td><td>{customer._count.opportunities}</td>
          </tr>)}
        </tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
      </section>
      <details className="card section-card">
        <summary>{dictionary.crm.customers.new}</summary>
        <ApiMutationForm endpoint="/api/customers" failureMessage={dictionary.crm.failed} loadingLabel={dictionary.crm.loading} submitLabel={dictionary.crm.create} successMessage={dictionary.crm.success}>
          <label>{crm.fields.company}<input name="companyName" required /></label>
          <label>{crm.fields.legalName}<input name="legalName" /></label>
          <label>{crm.fields.country}<input maxLength={2} name="countryCode" required /></label>
          <label>{crm.fields.email}<input name="email" type="email" /></label>
          <label>{crm.fields.phone}<input name="phone" /></label>
          <label>{crm.fields.level}<select name="level">{["STANDARD", "KEY", "STRATEGIC"].map((level) => <option key={level} value={level}>{crm.statuses[level as keyof typeof crm.statuses]}</option>)}</select></label>
          <label>{crm.fields.risk}<select name="riskRating">{["LOW", "MEDIUM", "HIGH"].map((risk) => <option key={risk} value={risk}>{crm.statuses[risk as keyof typeof crm.statuses]}</option>)}</select></label>
        </ApiMutationForm>
      </details>
    </>
  );
}
