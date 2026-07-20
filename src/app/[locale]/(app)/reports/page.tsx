import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
import { reportQuerySchema } from "@/modules/management/management-schemas";
import { ManagementService } from "@/modules/management/management-service";
import {
  allowedReportTypes,
  reportExportQuery,
} from "@/modules/management/reporting";

export const dynamic = "force-dynamic";
const service = new ManagementService();
export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; from?: string; to?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "report.read");
  const query = await searchParams;
  const availableTypes = allowedReportTypes(context);
  const type = availableTypes.includes(query.type as never)
    ? query.type!
    : availableTypes[0];
  if (!type) notFound();
  const { from, to } = reportQuerySchema.parse({
    type,
    from: query.from,
    to: query.to,
  });
  const report = await service.report(context, {
    type,
    from,
    to,
  });
  const exportQuery = reportExportQuery({
    type,
    format: "csv",
    from: query.from,
    to: query.to,
  });

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{locale === "zh" ? "报表" : "Reports"}</h1>
          <p>{locale === "zh" ? "权限范围内的业务和财务视图。" : "Permission-aware operating and financial views."}</p>
        </div>
      </header>
      <form className="filter-bar">
        <select defaultValue={type} name="type">
          {availableTypes.map((value) => <option key={value}>{value}</option>)}
        </select>
        <input defaultValue={query.from} name="from" type="date" />
        <input defaultValue={query.to} name="to" type="date" />
        <button className="button" type="submit">{locale === "zh" ? "应用" : "Apply"}</button>
      </form>
      <div className="export-actions">
        <Link className="button button-secondary" href={`/api/reports?${exportQuery}`}>
          CSV
        </Link>
      </div>
      {report.totals ? (
        <section className="metrics">
          <article className="card metric"><span className="metric-label">Sales USD</span><strong className="metric-value">${report.totals.salesUsd.toFixed(2)}</strong></article>
          <article className="card metric"><span className="metric-label">Collected USD</span><strong className="metric-value">${report.totals.collectionUsd.toFixed(2)}</strong></article>
          <article className="card metric"><span className="metric-label">Receivable USD</span><strong className="metric-value">${report.totals.receivableUsd.toFixed(2)}</strong></article>
          <article className="card metric"><span className="metric-label">Rows</span><strong className="metric-value">{report.rows.length}</strong></article>
        </section>
      ) : null}
      <section className="card section-card table-wrap">
        {report.rows.length ? (
          <table>
            <thead><tr>{Object.keys(report.rows[0]).map((key) => <th key={key}>{key}</th>)}</tr></thead>
            <tbody>{report.rows.map((row, rowIndex) => <tr key={rowIndex}>{Object.values(row).map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody>
          </table>
        ) : <div className="empty-state">{locale === "zh" ? "当前筛选没有数据。" : "No data for the current filters."}</div>}
      </section>
    </>
  );
}
