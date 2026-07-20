import Link from "next/link";
import { notFound } from "next/navigation";

import { MutationButton } from "@/components/management/management-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { ManagementService } from "@/modules/management/management-service";

export const dynamic = "force-dynamic";
const service = new ManagementService();

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  const notifications = await service.listNotifications(context);

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{locale === "zh" ? "通知" : "Notifications"}</h1>
          <p>{notifications.unreadCount} {locale === "zh" ? "条未读" : "unread"}</p>
        </div>
        {notifications.unreadCount ? (
          <MutationButton
            body={{}}
            endpoint="/api/notifications/read"
            label={locale === "zh" ? "全部标为已读" : "Mark all read"}
            locale={locale}
            method="POST"
          />
        ) : null}
      </header>
      {notifications.items.length ? (
        <section className="record-grid">
          {notifications.items.map((item) => (
            <article className={`record-card ${item.readAt ? "" : "notification-unread"}`} key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.type}</span>
              <p>{item.message}</p>
              <time>{item.createdAt.toLocaleString(locale)}</time>
              {item.link ? <Link className="table-link" href={item.link.replace(/^\/en/, `/${locale}`)}>{locale === "zh" ? "打开" : "Open"}</Link> : null}
              {!item.readAt ? (
                <MutationButton
                  body={{ ids: [item.id] }}
                  endpoint="/api/notifications/read"
                  label={locale === "zh" ? "标为已读" : "Mark read"}
                  locale={locale}
                  method="POST"
                />
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <section className="card empty-state">{locale === "zh" ? "暂无通知。" : "No notifications."}</section>
      )}
    </>
  );
}
