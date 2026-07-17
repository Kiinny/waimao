import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { EmptyState } from "@/components/empty-state";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { loadDashboard } from "@/modules/dashboard/dashboard-service";
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
  const metrics = [
    [dictionary.dashboard.customers, snapshot.activeCustomers],
    [dictionary.dashboard.quotes, snapshot.openQuotes],
    [dictionary.dashboard.orders, snapshot.activeOrders],
    [dictionary.dashboard.tasks, snapshot.dueTasks],
  ] as const;

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
        {metrics.map(([label, value]) => (
          <article className="card metric" key={label}>
            <div className="metric-label">{label}</div>
            <div className="metric-value">{value.toLocaleString(locale)}</div>
          </article>
        ))}
      </section>
      <section className="card section-card">
        <h2 className="section-title">{dictionary.dashboard.recent}</h2>
        {snapshot.recentCustomers.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{dictionary.dashboard.table.company}</th>
                  <th>{dictionary.dashboard.table.country}</th>
                  <th>{dictionary.dashboard.table.added}</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.recentCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.companyName}</td>
                    <td>{customer.countryCode}</td>
                    <td>{customer.createdAt.toLocaleDateString(locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={dictionary.dashboard.empty} />
        )}
      </section>
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
          {snapshot.dueTasks
            ? `${snapshot.dueTasks} ${dictionary.dashboard.risks.overdueTasks}`
            : dictionary.dashboard.risks.clear}
        </p>
      </section>
    </>
  );
}
