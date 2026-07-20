import Link from "next/link";
import { notFound } from "next/navigation";

import { InspectionForm } from "@/components/procurement/procurement-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";

export const dynamic = "force-dynamic";
const service = new ProcurementService();

export default async function InspectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "quality.read");
  const [rows, inventory] = await Promise.all([service.listInspections(), service.listInventory()]);
  return (
    <>
      <header className="page-heading"><div><h1>{locale === "zh" ? "质量检验" : "Quality inspections"}</h1><p>{locale === "zh" ? "逐台设备检查、结果与证据追踪" : "Per-device checklists, results and evidence"}</p></div></header>
      <section className="record-grid">
        {rows.map((row) => <article className="record-card" key={row.id}><strong>{row.inventoryItem.product.sku} · {row.status}</strong><span>{row.inventorySerial?.serialNumber ?? (locale === "zh" ? "批次质检" : "Batch inspection")}</span><span>{locale === "zh" ? "检验员" : "Inspector"}: {row.inspector.name}</span><span>{row.notes ?? (locale === "zh" ? "无备注" : "No notes")}</span><Link href={`/${locale}/inspections/${row.id}`}>{locale === "zh" ? "查看质检详情" : "View inspection details"}</Link></article>)}
      </section>
      {can(context, "quality.update") ? <details className="card section-card"><summary>{locale === "zh" ? "登记质检" : "Record inspection"}</summary><InspectionForm locale={locale} items={inventory.map((item) => ({ id: item.id, label: `${item.product.sku} · ${item.location.warehouse.code}/${item.location.code}`, version: item.version, serialized: item.product.serialized, serials: item.serials.map((serial) => ({ id: serial.id, serialNumber: serial.serialNumber, status: serial.status })) }))} /></details> : null}
    </>
  );
}
