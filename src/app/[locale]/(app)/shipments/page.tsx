import Link from "next/link";
import { notFound } from "next/navigation";

import { ShipmentForm, WorkflowAction } from "@/components/procurement/procurement-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";

export const dynamic = "force-dynamic";
const service = new ProcurementService();

export default async function ShipmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "shipment.read");
  const [rows, orders, inventory] = await Promise.all([service.listShipments(), service.eligibleShipmentOrders(), service.listInventory()]);
  const canUpdate = can(context, "shipment.update");
  return (
    <>
      <header className="page-heading"><div><h1>{locale === "zh" ? "物流发货" : "Shipments"}</h1><p>{locale === "zh" ? "库存预留、出库、运输与订单状态同步" : "Stock reservation, outbound issue, tracking and order sync"}</p></div></header>
      <section className="record-grid">
        {rows.map((row) => {
          const next = row.status === "DRAFT" ? "BOOKED" : row.status === "BOOKED" ? "IN_TRANSIT" : row.status === "IN_TRANSIT" ? "DELIVERED" : null;
          return <article className="record-card" key={row.id}><strong>{row.shipmentNumber} · {row.status}</strong><span>{row.salesOrder.orderNumber} · {row.method}</span><span>{row.carrier ?? (locale === "zh" ? "待定承运商" : "Carrier pending")} · {row.trackingNumber ?? (locale === "zh" ? "待录入运单" : "Tracking pending")}</span><span>{row.originPort ?? row.origin ?? "—"} → {row.destinationPort ?? row.destination ?? "—"}</span><span>{row.items.flatMap((item) => item.serials.map((serial) => serial.inventorySerial.serialNumber)).join(", ")}</span><Link href={`/${locale}/shipments/${row.id}`}>{locale === "zh" ? "查看发货详情" : "View shipment details"}</Link>{canUpdate && next ? <WorkflowAction body={{ status: next, expectedVersion: row.version }} endpoint={`/api/shipments/${row.id}/transition`} label={locale === "zh" ? `转为 ${next}` : `Move to ${next}`} locale={locale} /> : null}{canUpdate && ["DRAFT", "BOOKED"].includes(row.status) ? <WorkflowAction body={{ status: "CANCELLED", expectedVersion: row.version }} confirmMessage={locale === "zh" ? "确认取消并释放库存？" : "Cancel and release reserved stock?"} endpoint={`/api/shipments/${row.id}/transition`} label={locale === "zh" ? "取消发货" : "Cancel shipment"} locale={locale} /> : null}</article>;
        })}
      </section>
      {canUpdate ? <details className="card section-card"><summary>{locale === "zh" ? "新建发货单" : "Create shipment"}</summary><ShipmentForm inventory={inventory.map((item) => ({ id: item.id, label: `${item.product.sku} · ${item.location.warehouse.code}/${item.location.code} · ${item.quantityOnHand - item.quantityReserved} ${locale === "zh" ? "可用" : "available"}`, version: item.version, serialized: item.product.serialized, serials: item.serials.map((serial) => ({ id: serial.id, serialNumber: serial.serialNumber, status: serial.status })) }))} locale={locale} orders={orders.map((order) => ({ id: order.id, label: order.orderNumber, items: order.items.map((item) => ({ id: item.id, label: item.description, quantity: item.quantity })) }))} /></details> : null}
    </>
  );
}
