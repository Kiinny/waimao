import Link from "next/link";
import { notFound } from "next/navigation";

import {
  PurchaseOrderForm,
  PurchaseReceiptForm,
  WorkflowAction,
} from "@/components/procurement/procurement-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";

export const dynamic = "force-dynamic";
const service = new ProcurementService();

export default async function PurchaseOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "purchase.read");
  const [orders, eligible, suppliers, locations] = await Promise.all([
    service.listPurchaseOrders(context),
    service.eligibleOrders(),
    service.listSuppliers(context),
    service.listWarehouseLocations(),
  ]);
  const canUpdate = can(context, "purchase.update");

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{locale === "zh" ? "采购订单" : "Purchase orders"}</h1>
          <p>
            {locale === "zh"
              ? "付款门禁、采购承诺、收货与入库"
              : "Payment-gated purchasing, receiving and stock posting"}
          </p>
        </div>
      </header>
      <section className="record-grid">
        {orders.map((order) => {
          const next =
            order.status === "DRAFT"
              ? "APPROVED"
              : order.status === "APPROVED"
                ? "SENT"
                : null;
          const receivable = ["SENT", "PARTIALLY_RECEIVED"].includes(order.status);
          return (
            <article className="record-card" key={order.id}>
              <strong>
                {order.purchaseOrderNumber} · {order.status}
              </strong>
              <span>
                {order.supplier.name} · {order.buyer.name}
              </span>
              <span>
                {order.currencyCode} {order.total.toString()} · {order.items.length}{" "}
                {locale === "zh" ? "项" : "line(s)"}
              </span>
              <span>{order.salesOrder?.orderNumber ?? (locale === "zh" ? "备货采购" : "Stock purchase")}</span>
              <Link href={`/${locale}/purchase-orders/${order.id}`}>
                {locale === "zh" ? "查看采购订单详情" : "View purchase order details"}
              </Link>
              {canUpdate && next ? (
                <WorkflowAction
                  body={{ status: next, expectedVersion: order.version }}
                  endpoint={`/api/purchase-orders/${order.id}/transition`}
                  label={locale === "zh" ? `转为 ${next}` : `Move to ${next}`}
                  locale={locale}
                />
              ) : null}
              {canUpdate && receivable ? (
                <details>
                  <summary>{locale === "zh" ? "登记收货" : "Record receipt"}</summary>
                  <PurchaseReceiptForm
                    expectedVersion={order.version}
                    lines={order.items
                      .filter((item) => item.receivedQuantity < item.quantity)
                      .map((item) => ({
                        id: item.id,
                        label: item.description,
                        remaining: item.quantity - item.receivedQuantity,
                        serialized: item.product?.serialized ?? false,
                      }))}
                    locale={locale}
                    locations={locations.map((location) => ({
                      id: location.id,
                      label: `${location.warehouse.code} / ${location.code}`,
                    }))}
                    purchaseOrderId={order.id}
                  />
                </details>
              ) : null}
            </article>
          );
        })}
      </section>
      {can(context, "purchase.create") ? (
        <details className="card section-card">
          <summary>{locale === "zh" ? "新建采购订单" : "Create purchase order"}</summary>
          <PurchaseOrderForm
            locale={locale}
            orders={eligible.map((order) => ({
              id: order.id,
              label: order.orderNumber,
              items: order.items.map((item) => ({
                id: item.id,
                label: item.description,
                quantity: item.quantity,
              })),
            }))}
            suppliers={suppliers.map((supplier) => ({
              id: supplier.id,
              label: `${supplier.code} · ${supplier.name}`,
            }))}
          />
        </details>
      ) : null}
    </>
  );
}
