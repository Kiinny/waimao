import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
import { ManagementService } from "@/modules/management/management-service";

export const dynamic = "force-dynamic";
const service = new ManagementService();

export default async function ActivityLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "audit.read");
  const query = await searchParams;
  const logs = await service.listActivityLogs({
    actorId: query.actorId,
    action: query.action,
    entityType: query.entityType,
    entityId: query.entityId,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
  });

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{locale === "zh" ? "活动日志" : "Activity logs"}</h1>
          <p>{locale === "zh" ? "只读审计记录；敏感字段已脱敏。" : "Read-only audit history with sensitive fields redacted."}</p>
        </div>
      </header>
      <form className="filter-bar">
        <input defaultValue={query.action} name="action" placeholder="Action" />
        <input defaultValue={query.entityType} name="entityType" placeholder="Entity type" />
        <input defaultValue={query.entityId} name="entityId" placeholder="Entity ID" />
        <input defaultValue={query.actorId} name="actorId" placeholder="Actor ID" />
        <input defaultValue={query.from} name="from" type="date" />
        <input defaultValue={query.to} name="to" type="date" />
        <button className="button" type="submit">{locale === "zh" ? "筛选" : "Filter"}</button>
      </form>
      {logs.length ? (
        <section className="activity-list">
          {logs.map((log) => (
            <details className="card section-card" key={log.id}>
              <summary>{log.createdAt.toLocaleString(locale)} · {log.action} · {log.entityType} {log.entityId ?? ""}</summary>
              <p>{log.actor?.name ?? "System"} · {log.actor?.email ?? ""}</p>
              <div className="two-column">
                <pre>{JSON.stringify(log.before, null, 2)}</pre>
                <pre>{JSON.stringify(log.after, null, 2)}</pre>
              </div>
              {log.metadata ? <pre>{JSON.stringify(log.metadata, null, 2)}</pre> : null}
            </details>
          ))}
        </section>
      ) : <section className="card empty-state">{locale === "zh" ? "没有匹配的日志。" : "No matching activity logs."}</section>}
    </>
  );
}
