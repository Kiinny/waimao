import { notFound } from "next/navigation";

import {
  ShipmentUpdateForm,
  WorkflowAction,
} from "@/components/procurement/procurement-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";

export const dynamic = "force-dynamic";
const service = new ProcurementService();

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "shipment.read");
  const shipment = (await service.listShipments()).find((row) => row.id === id);
  if (!shipment) notFound();

  const canUpdate = can(context, "shipment.update");
  const nextStatus =
    shipment.status === "DRAFT"
      ? "BOOKED"
      : shipment.status === "BOOKED"
        ? "IN_TRANSIT"
        : shipment.status === "IN_TRANSIT"
          ? "DELIVERED"
          : null;
  const cancellable = ["DRAFT", "BOOKED"].includes(shipment.status);
  const formatDate = (date: Date | null) =>
    date
      ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date)
      : "—";

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{shipment.shipmentNumber}</h1>
          <p>{shipment.salesOrder.orderNumber} · {shipment.status}</p>
        </div>
      </header>
      <section className="card section-card">
        <h2>{locale === "zh" ? "物流与跟踪" : "Logistics and tracking"}</h2>
        <dl className="detail-grid">
          <div><dt>{locale === "zh" ? "运输方式" : "Method"}</dt><dd>{shipment.method}</dd></div>
          <div><dt>{locale === "zh" ? "承运商" : "Carrier"}</dt><dd>{shipment.carrier ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "运单号" : "Tracking number"}</dt><dd>{shipment.trackingNumber ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "协调员" : "Coordinator"}</dt><dd>{shipment.coordinator.name}</dd></div>
          <div><dt>{locale === "zh" ? "路线" : "Route"}</dt><dd>{shipment.originPort ?? shipment.origin ?? "—"} → {shipment.destinationPort ?? shipment.destination ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "贸易术语" : "Incoterm"}</dt><dd>{shipment.incoterm ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "预计发运" : "Estimated departure"}</dt><dd>{formatDate(shipment.estimatedDepartureAt)}</dd></div>
          <div><dt>{locale === "zh" ? "预计到达" : "Estimated arrival"}</dt><dd>{formatDate(shipment.estimatedArrivalAt)}</dd></div>
          <div><dt>{locale === "zh" ? "实际发运" : "Shipped at"}</dt><dd>{formatDate(shipment.shippedAt)}</dd></div>
          <div><dt>{locale === "zh" ? "实际送达" : "Delivered at"}</dt><dd>{formatDate(shipment.deliveredAt)}</dd></div>
          <div><dt>{locale === "zh" ? "毛重" : "Gross weight"}</dt><dd>{shipment.grossWeightKg?.toString() ?? "—"} kg</dd></div>
          <div><dt>{locale === "zh" ? "体积" : "Volume"}</dt><dd>{shipment.volumeCbm?.toString() ?? "—"} m³</dd></div>
        </dl>
      </section>
      <section className="card section-card">
        <h2>{locale === "zh" ? "发货明细与序列号" : "Items and serials"}</h2>
        <div className="record-grid">
          {shipment.items.map((item) => (
            <article className="record-card" key={item.id}>
              <strong>{item.inventoryItem?.product.sku ?? item.salesOrderItemId}</strong>
              <span>{item.inventoryItem?.product.name ?? (locale === "zh" ? "未关联库存产品" : "No linked inventory product")}</span>
              <span>{locale === "zh" ? "数量" : "Quantity"}: {item.quantity}</span>
              <span>
                {locale === "zh" ? "序列号" : "Serials"}:{" "}
                {item.serials
                  .map((serial) => `${serial.inventorySerial.serialNumber} (${serial.status})`)
                  .join(", ") || "—"}
              </span>
            </article>
          ))}
        </div>
      </section>
      <section className="card section-card">
        <h2>{locale === "zh" ? "运输单证" : "Shipment documents"}</h2>
        <div className="record-grid">
          {shipment.documents.map((document) => (
            <article className="record-card" key={document.id}>
              <strong>{document.documentType} · {document.fileAsset.fileName}</strong>
              <span>{document.fileAsset.contentType}</span>
              <span>{document.fileAsset.sizeBytes.toString()} bytes</span>
              <span>{locale === "zh" ? "资产 ID" : "Asset ID"}: {document.fileAssetId}</span>
            </article>
          ))}
          {shipment.documents.length === 0 ? (
            <p>{locale === "zh" ? "暂无运输单证。" : "No shipment documents."}</p>
          ) : null}
        </div>
      </section>
      {canUpdate ? (
        <section className="card section-card" data-endpoint={`/api/shipments/${shipment.id}`}>
          <h2>{locale === "zh" ? "跟踪、单证与状态操作" : "Tracking, documents and status actions"}</h2>
          {nextStatus ? (
            <WorkflowAction
              body={{ status: nextStatus, expectedVersion: shipment.version }}
              endpoint={`/api/shipments/${shipment.id}/transition`}
              label={locale === "zh" ? `转为 ${nextStatus}` : `Move to ${nextStatus}`}
              locale={locale}
            />
          ) : null}
          {cancellable ? (
            <WorkflowAction
              body={{ status: "CANCELLED", expectedVersion: shipment.version }}
              confirmMessage={
                locale === "zh"
                  ? "确认取消并释放预留库存？"
                  : "Cancel and release reserved stock?"
              }
              endpoint={`/api/shipments/${shipment.id}/transition`}
              label={locale === "zh" ? "取消发货" : "Cancel shipment"}
              locale={locale}
            />
          ) : null}
          <details>
            <summary>{locale === "zh" ? "更新跟踪与单证" : "Update tracking and documents"}</summary>
            <ShipmentUpdateForm locale={locale} shipment={shipment} />
          </details>
        </section>
      ) : null}
    </>
  );
}
