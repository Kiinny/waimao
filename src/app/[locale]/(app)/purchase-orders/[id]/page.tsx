import { notFound } from "next/navigation";

import {
  PurchaseOrderUpdateForm,
  PurchaseReceiptForm,
  WorkflowAction,
} from "@/components/procurement/procurement-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";

export const dynamic = "force-dynamic";
const service = new ProcurementService();

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "purchase.read");
  const [purchaseOrder, locations] = await Promise.all([
    service.getPurchaseOrder(id, context),
    service.listWarehouseLocations(),
  ]);
  if (!purchaseOrder) notFound();

  const canUpdate = can(context, "purchase.update");
  const nextStatus =
    purchaseOrder.status === "DRAFT"
      ? "APPROVED"
      : purchaseOrder.status === "APPROVED"
        ? "SENT"
        : null;
  const receivable = ["SENT", "PARTIALLY_RECEIVED"].includes(
    purchaseOrder.status,
  );
  const cancellable = ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(
    purchaseOrder.status,
  );
  const attachmentIds = Array.isArray(purchaseOrder.attachments)
    ? purchaseOrder.attachments.filter((value): value is string => typeof value === "string")
    : [];

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{purchaseOrder.purchaseOrderNumber}</h1>
          <p>{purchaseOrder.supplier.name} · {purchaseOrder.status}</p>
        </div>
      </header>
      <section className="card section-card">
        <h2>{locale === "zh" ? "采购概览" : "Purchase overview"}</h2>
        <dl className="detail-grid">
          <div><dt>{locale === "zh" ? "采购员" : "Buyer"}</dt><dd>{purchaseOrder.buyer.name}</dd></div>
          <div><dt>{locale === "zh" ? "销售订单" : "Sales order"}</dt><dd>{purchaseOrder.salesOrder?.orderNumber ?? (locale === "zh" ? "备货采购" : "Stock purchase")}</dd></div>
          <div><dt>{locale === "zh" ? "总额" : "Total"}</dt><dd>{purchaseOrder.currencyCode} {purchaseOrder.total.toString()}</dd></div>
          <div><dt>{locale === "zh" ? "美元总额" : "Total in USD"}</dt><dd>USD {purchaseOrder.totalUsd.toString()}</dd></div>
          <div><dt>{locale === "zh" ? "付款条款" : "Payment terms"}</dt><dd>{purchaseOrder.paymentTerms ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "运输条款" : "Shipping terms"}</dt><dd>{purchaseOrder.shippingTerms ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "贸易术语" : "Incoterm"}</dt><dd>{purchaseOrder.incoterm ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "附件数量" : "Attachments"}</dt><dd>{attachmentIds.length}</dd></div>
        </dl>
        <p>{locale === "zh" ? "附件资产 ID" : "Attachment asset IDs"}: {attachmentIds.join(", ") || "—"}</p>
        <p>{locale === "zh" ? "备注" : "Notes"}: {purchaseOrder.notes ?? "—"}</p>
      </section>
      <section className="card section-card">
        <h2>{locale === "zh" ? "采购明细与快照" : "Lines and snapshots"}</h2>
        <div className="record-grid">
          {purchaseOrder.items.map((item) => (
            <article className="record-card" key={item.id}>
              <strong>{item.description}</strong>
              <span>
                {locale === "zh" ? "数量" : "Quantity"} {item.quantity} ·{" "}
                {locale === "zh" ? "已收" : "Received"} {item.receivedQuantity}
              </span>
              <span>{purchaseOrder.currencyCode} {item.unitCost.toString()} · {purchaseOrder.currencyCode} {item.lineTotal.toString()}</span>
              <span>{locale === "zh" ? "产品快照" : "Product snapshot"}: {JSON.stringify(item.productSnapshot ?? {})}</span>
              <span>{locale === "zh" ? "配置快照" : "Configuration snapshot"}: {JSON.stringify(item.configurationSnapshot ?? {})}</span>
              <span>{locale === "zh" ? "入库记录" : "Inventory records"}: {item.inventoryItems.length}</span>
            </article>
          ))}
        </div>
      </section>
      {canUpdate ? (
        <section className="card section-card" data-endpoint={`/api/purchase-orders/${purchaseOrder.id}`}>
          <h2>{locale === "zh" ? "采购订单操作" : "Purchase order actions"}</h2>
          {nextStatus ? (
            <WorkflowAction
              body={{ status: nextStatus, expectedVersion: purchaseOrder.version }}
              endpoint={`/api/purchase-orders/${purchaseOrder.id}/transition`}
              label={locale === "zh" ? `转为 ${nextStatus}` : `Move to ${nextStatus}`}
              locale={locale}
            />
          ) : null}
          {cancellable ? (
            <WorkflowAction
              body={{ status: "CANCELLED", expectedVersion: purchaseOrder.version }}
              confirmMessage={
                locale === "zh"
                  ? "确认取消此采购订单？"
                  : "Cancel this purchase order?"
              }
              endpoint={`/api/purchase-orders/${purchaseOrder.id}/transition`}
              label={locale === "zh" ? "取消采购订单" : "Cancel purchase order"}
              locale={locale}
            />
          ) : null}
          {receivable ? (
            <details>
              <summary>{locale === "zh" ? "登记收货" : "Record receipt"}</summary>
              <PurchaseReceiptForm
                expectedVersion={purchaseOrder.version}
                lines={purchaseOrder.items
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
                purchaseOrderId={purchaseOrder.id}
              />
            </details>
          ) : null}
          <details>
            <summary>{locale === "zh" ? "更新条款与附件" : "Update terms and attachments"}</summary>
            <PurchaseOrderUpdateForm
              locale={locale}
              purchaseOrder={purchaseOrder}
            />
          </details>
        </section>
      ) : null}
    </>
  );
}
