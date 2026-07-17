import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { EmptyState } from "@/components/empty-state";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { dashboardKpis, loadDashboard } from "@/modules/dashboard/dashboard-service";
import { PrismaDashboardRepository } from "@/modules/dashboard/prisma-dashboard-repository";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const session = await auth();
  const context = await currentAuthorizationContext();
  const dictionary = getDictionary(locale);
  const snapshot = await loadDashboard(
    new PrismaDashboardRepository(),
    context,
  );
  const metricLabels = {
    activeCustomers: dictionary.dashboard.customers,
    openLeads: dictionary.dashboard.openLeads,
    pipelineValueUsd: dictionary.dashboard.pipelineValueUsd,
    weightedForecastUsd: dictionary.dashboard.weightedForecastUsd,
    openQuotes: dictionary.dashboard.quotes,
    activeOrders: dictionary.dashboard.orders,
    dueTasks: dictionary.dashboard.tasks,
  };
  const metrics = dashboardKpis(context, snapshot);
  const maxFunnel = Math.max(1, ...snapshot.salesFunnel.map((item) => item.count));
  const maxTrend = Math.max(
    1,
    ...snapshot.monthlyOrderTrend.map((item) => Number(item.valueUsd)),
  );

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>
            {dictionary.dashboard.title}
            {session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p>{dictionary.dashboard.subtitle}</p>
        </div>
      </header>
      <section
        className="metrics"
        aria-label={dictionary.dashboard.metricsLabel}
      >
        {metrics.map(([key, value]) => (
          <article className="card metric" key={key}>
            <div className="metric-label">{metricLabels[key]}</div>
            <div className="metric-value">
              {typeof value === "string"
                ? `$${Number(value).toLocaleString(locale)}`
                : value.toLocaleString(locale)}
            </div>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="card section-card">
          <h2 className="section-title">{dictionary.dashboard.funnel}</h2>
          {snapshot.salesFunnel.length ? <div className="bar-chart">{snapshot.salesFunnel.map((item) => <div className="bar-row" key={item.stage}><span>{item.stage}</span><div><i style={{ width: `${Math.max(5, item.count / maxFunnel * 100)}%` }} /></div><strong>{item.count}</strong></div>)}</div> : <EmptyState title={dictionary.crm.empty} />}
        </section>
        <section className="card section-card">
          <h2 className="section-title">{dictionary.dashboard.orderTrend}</h2>
          {snapshot.monthlyOrderTrend.length ? <div className="trend-chart">{snapshot.monthlyOrderTrend.map((item) => <div className="trend-column" key={item.month}><div style={{ height: `${Math.max(4, Number(item.valueUsd) / maxTrend * 120)}px` }} /><span>{item.month.slice(5)}</span><small>{item.count}</small></div>)}</div> : <EmptyState title={dictionary.crm.empty} />}
        </section>
        <section className="card section-card">
          <h2 className="section-title">{dictionary.dashboard.leadSources}</h2>
          {snapshot.leadSources.length ? <ul className="distribution-list">{snapshot.leadSources.map((item) => <li key={item.source}><span>{item.source}</span><strong>{item.count}</strong></li>)}</ul> : <EmptyState title={dictionary.crm.empty} />}
        </section>
        <section className="card section-card">
          <h2 className="section-title">{dictionary.dashboard.upcomingFollowUps}</h2>
          {snapshot.upcomingFollowUps.length ? <ol className="timeline compact">{snapshot.upcomingFollowUps.map((item) => <li key={item.id}><strong>{item.related}</strong><p>{item.summary}</p><time>{item.nextActionAt.toLocaleString(locale)}</time></li>)}</ol> : <EmptyState title={dictionary.crm.empty} />}
        </section>
      </div>
      <div className="dashboard-grid">
        <section className="card section-card">
          <h2 className="section-title">{dictionary.dashboard.recentLeads}</h2>
          {snapshot.recentLeads.length ? <div className="table-wrap"><table><thead><tr><th>Company</th><th>Status</th><th>Added</th></tr></thead><tbody>{snapshot.recentLeads.map((lead) => <tr key={lead.id}><td>{lead.companyName}</td><td>{lead.status}</td><td>{lead.createdAt.toLocaleDateString(locale)}</td></tr>)}</tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
        </section>
        <section className="card section-card">
          <h2 className="section-title">{dictionary.dashboard.recentOrders}</h2>
          {snapshot.recentOrders.length ? <div className="table-wrap"><table><thead><tr><th>Order</th><th>Status</th><th>USD</th></tr></thead><tbody>{snapshot.recentOrders.map((order) => <tr key={order.id}><td>{order.orderNumber}</td><td>{order.status}</td><td>${Number(order.totalUsd).toLocaleString(locale)}</td></tr>)}</tbody></table></div> : <EmptyState title={dictionary.crm.empty} />}
        </section>
      </div>
      <section
        className="card section-card"
        id="notifications"
        aria-labelledby="notifications-title"
        tabIndex={-1}
      >
        <h2 className="section-title" id="notifications-title">
          {dictionary.dashboard.risks.title}
        </h2>
        <p className="muted">
          {snapshot.dueTasks || snapshot.risks.overdueFollowUps || snapshot.risks.highRiskCustomers || snapshot.risks.staleOpportunities
            ? `${snapshot.dueTasks} ${dictionary.dashboard.risks.overdueTasks} ${snapshot.risks.overdueFollowUps} overdue follow-ups, ${snapshot.risks.highRiskCustomers} high-risk customers, and ${snapshot.risks.staleOpportunities} stale opportunities.`
            : dictionary.dashboard.risks.clear}
        </p>
      </section>
    </>
  );
}
