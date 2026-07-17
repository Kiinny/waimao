import Link from "next/link";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";

export const dynamic = "force-dynamic";
const repository = new PrismaTransactionsRepository();

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "order.read");
  const orders = await repository.listOrders(context);
  return (
    <>
      <header className="page-heading"><div><h1>{locale === "zh" ? "销售订单与收款" : "Sales Orders & Payments"}</h1><p>Payment, purchase, inspection, packing and shipment readiness</p></div></header>
      <section className="record-grid">
        {orders.map((order) => (
          <Link className="record-card" href={`/${locale}/orders/${order.id}`} key={order.id}>
            <strong>{order.orderNumber} · {order.status}</strong>
            <span>{order.customer.companyName}</span>
            <span>{order.currencyCode} {order.total.toString()}</span>
            <span>Payment {order.paymentStatus} · Purchase {order.purchaseStatus}</span>
            <span>Inspection {order.inspectionStatus} · Packing {order.packingStatus} · Shipment {order.shipmentStatus}</span>
          </Link>
        ))}
      </section>
    </>
  );
}
