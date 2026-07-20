import { notFound } from "next/navigation";

import {
  MutationButton,
  TicketCreateForm,
  TicketResolutionForm,
} from "@/components/management/management-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ManagementService } from "@/modules/management/management-service";

export const dynamic = "force-dynamic";
const service = new ManagementService();

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "after_sales.read");
  const [tickets, options] = await Promise.all([
    service.listTickets(),
    service.ticketOptions(),
  ]);

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{locale === "zh" ? "售后工单" : "After-sales tickets"}</h1>
          <p>{locale === "zh" ? "跟踪问题、责任人、解决方案和成本。" : "Track issues, ownership, solutions, and costs."}</p>
        </div>
      </header>
      {tickets.length ? (
        <section className="record-grid">
          {tickets.map((ticket) => (
            <article className="record-card" key={ticket.id}>
              <strong>{ticket.ticketNumber} · {ticket.subject}</strong>
              <span>{ticket.issueType} · {ticket.priority} · <b>{ticket.status}</b></span>
              <span>{ticket.customer.companyName}</span>
              <span>
                {[ticket.salesOrder?.orderNumber, ticket.product?.sku, ticket.inventorySerial?.serialNumber]
                  .filter(Boolean)
                  .join(" · ") || (locale === "zh" ? "无关联记录" : "No linked record")}
              </span>
              <span>{locale === "zh" ? "负责人" : "Assignee"}: {ticket.assignedTo?.name ?? "—"}</span>
              <span>{locale === "zh" ? "成本" : "Cost"}: {ticket.costAmount?.toString() ?? "0"} {ticket.costCurrencyCode ?? ""}</span>
              {ticket.solution ? <p>{ticket.solution}</p> : null}
              {can(context, "after_sales.update") && ticket.status !== "CLOSED" ? (
                <div className="status-actions">
                  {ticket.status === "OPEN" ? (
                    <MutationButton
                      body={{ expectedVersion: ticket.version, status: "IN_PROGRESS" }}
                      endpoint={`/api/tickets/${ticket.id}`}
                      label={locale === "zh" ? "开始处理" : "Start"}
                      locale={locale}
                    />
                  ) : null}
                  {!["RESOLVED", "CLOSED"].includes(ticket.status) ? (
                    <TicketResolutionForm
                      endpoint={`/api/tickets/${ticket.id}`}
                      expectedVersion={ticket.version}
                      locale={locale}
                      status="RESOLVED"
                    />
                  ) : null}
                  {ticket.status === "RESOLVED" ? (
                    <TicketResolutionForm
                      endpoint={`/api/tickets/${ticket.id}`}
                      existingSolution={ticket.solution}
                      expectedVersion={ticket.version}
                      locale={locale}
                      status="CLOSED"
                    />
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <section className="card empty-state">
          {locale === "zh" ? "暂无售后工单。" : "No after-sales tickets yet."}
        </section>
      )}
      {can(context, "after_sales.create") ? (
        <details className="card section-card">
          <summary>{locale === "zh" ? "新建工单" : "Create ticket"}</summary>
          <TicketCreateForm
            locale={locale}
            options={{
              customers: options.customers.map((row) => ({ id: row.id, label: row.companyName })),
              orders: options.orders.map((row) => ({ id: row.id, label: row.orderNumber })),
              products: options.products.map((row) => ({ id: row.id, label: `${row.sku} · ${row.name}` })),
              serials: options.serials.map((row) => ({ id: row.id, label: row.serialNumber })),
              users: options.users.map((row) => ({ id: row.id, label: row.name })),
            }}
          />
        </details>
      ) : null}
    </>
  );
}
