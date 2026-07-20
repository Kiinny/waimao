import { notFound } from "next/navigation";

import { PaymentCreateForm, RefundForm, TransactionAction } from "@/components/transactions/transaction-actions";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
import { orderDetailCapabilities } from "@/modules/transactions/detail-capabilities";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";

export const dynamic = "force-dynamic";
const repository = new PrismaTransactionsRepository();

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "order.read");
  const order = await repository.getOrder(context, id);
  if (!order) notFound();
  const capabilities = orderDetailCapabilities(context, {
    ownerId: order.ownerId,
  });
  return (
    <>
      <header className="page-heading"><div><h1>{order.orderNumber}</h1><p>{order.customer.companyName} · {order.status}</p></div></header>
      <section className="card section-card">
        <h2>Operational statuses</h2>
        <p>Payment {order.paymentStatus} · Purchase {order.purchaseStatus} · Inspection {order.inspectionStatus} · Packing {order.packingStatus} · Shipment {order.shipmentStatus}</p>
        <p>Purchase eligible: {order.purchaseEligibilityFlag ? "Yes" : "No"}</p>
        {capabilities.purchase && order.status === "CONFIRMED" ? <TransactionAction confirmMessage="Enter purchasing? The server will enforce confirmed net payment coverage." endpoint={`/api/orders/${id}/purchase`} label="Start purchasing" /> : null}
        {capabilities.transition && order.status === "PURCHASING" ? <TransactionAction body={{ status: "FULFILLING" }} confirmMessage="Move this order into fulfillment?" endpoint={`/api/orders/${id}/transition`} label="Start fulfillment" /> : null}
        {capabilities.transition && order.status === "FULFILLING" ? <TransactionAction body={{ status: "SHIPPED" }} confirmMessage="Confirm inspection, packing and shipment?" endpoint={`/api/orders/${id}/transition`} label="Mark shipped" /> : null}
        {capabilities.transition && order.status === "SHIPPED" ? <TransactionAction body={{ status: "COMPLETED" }} confirmMessage="Mark this order completed?" endpoint={`/api/orders/${id}/transition`} label="Complete order" /> : null}
      </section>
      {order.grossProfitUsd !== undefined ? (
        <section className="card section-card">
          <h2>Authorized finance summary</h2>
          <p>Revenue ${order.revenueUsd.toString()} · Estimated cost ${order.estimatedCostUsd.toString()} · Actual cost ${order.actualCostUsd.toString()}</p>
          <p>Gross profit ${order.grossProfitUsd.toString()} · Margin {order.grossMarginPercent.toString()}% · Net estimate ${order.netProfitEstimateUsd.toString()}</p>
        </section>
      ) : null}
      <section className="card section-card">
        <h2>Payments & refunds</h2>
        {order.payments.map((payment) => (
          <article className="record-card" key={payment.id}>
            <strong>{payment.reference ?? payment.id} · {payment.status}</strong>
            <span>{payment.currencyCode} {payment.amount.toString()} · USD {payment.amountUsd.toString()}</span>
            <span>Proof: {JSON.stringify(payment.proofMetadata ?? {})}</span>
            {capabilities.verifyPayment && payment.status === "PENDING" ? (
              <TransactionAction body={{ approved: true }} confirmMessage="Verify this proof and confirm the payment?" endpoint={`/api/payments/${payment.id}/verify`} label="Verify payment" />
            ) : null}
            {capabilities.verifyPayment && payment.status === "PENDING" ? (
              <TransactionAction body={{ approved: false, rejectionReason: "Payment proof could not be verified" }} confirmMessage="Reject this payment proof?" endpoint={`/api/payments/${payment.id}/verify`} label="Reject payment" />
            ) : null}
            {capabilities.refund && payment.status === "CONFIRMED" ? <RefundForm paymentId={payment.id} /> : null}
          </article>
        ))}
      </section>
      {capabilities.createPayment ? (
        <details className="card section-card">
          <summary>Record installment payment</summary>
          <PaymentCreateForm orderId={id} />
        </details>
      ) : null}
    </>
  );
}
