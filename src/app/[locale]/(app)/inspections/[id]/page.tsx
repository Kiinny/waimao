import { notFound } from "next/navigation";

import { InspectionForm } from "@/components/procurement/procurement-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";

export const dynamic = "force-dynamic";
const service = new ProcurementService();

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "quality.read");
  const [inspections, inventory] = await Promise.all([
    service.listInspections(),
    service.listInventory(),
  ]);
  const inspection = inspections.find((row) => row.id === id);
  if (!inspection) notFound();

  const checklist = objectValue(inspection.checklist);
  const evidence = Array.isArray(checklist.evidence) ? checklist.evidence : [];
  const checks = Object.entries(checklist).filter(([key]) => key !== "evidence");
  const history = inspections.filter(
    (row) =>
      row.inventoryItemId === inspection.inventoryItemId &&
      (inspection.inventorySerialId
        ? row.inventorySerialId === inspection.inventorySerialId
        : row.inventorySerialId === null),
  );
  const inventoryOptions = inventory
    .filter((item) => item.id === inspection.inventoryItemId)
    .map((item) => ({
      id: item.id,
      label: `${item.product.sku} · ${item.location.warehouse.code}/${item.location.code}`,
      version: item.version,
      serialized: item.product.serialized,
      serials: item.serials.map((serial) => ({
        id: serial.id,
        serialNumber: serial.serialNumber,
        status: serial.status,
      })),
    }));
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{locale === "zh" ? "质检详情" : "Inspection details"}</h1>
          <p>{inspection.inventoryItem.product.sku} · {inspection.status}</p>
        </div>
      </header>
      <section className="card section-card">
        <h2>{locale === "zh" ? "检验概览" : "Inspection overview"}</h2>
        <dl className="detail-grid">
          <div><dt>{locale === "zh" ? "序列号" : "Serial number"}</dt><dd>{inspection.inventorySerial?.serialNumber ?? (locale === "zh" ? "批次质检" : "Batch inspection")}</dd></div>
          <div><dt>{locale === "zh" ? "检验员" : "Inspector"}</dt><dd>{inspection.inspector.name}</dd></div>
          <div><dt>{locale === "zh" ? "检验时间" : "Inspected at"}</dt><dd>{inspection.inspectedAt ? formatDate(inspection.inspectedAt) : (locale === "zh" ? "待检" : "Pending")}</dd></div>
          <div><dt>{locale === "zh" ? "版本" : "Version"}</dt><dd>{inspection.version}</dd></div>
        </dl>
        <p>{locale === "zh" ? "备注" : "Notes"}: {inspection.notes ?? "—"}</p>
      </section>
      <section className="card section-card">
        <h2>{locale === "zh" ? "检查清单" : "Checklist"}</h2>
        <div className="record-grid">
          {checks.map(([name, complete]) => (
            <article className="record-card" key={name}>
              <strong>{name}</strong>
              <span>
                {complete
                  ? locale === "zh" ? "已完成" : "Complete"
                  : locale === "zh" ? "未完成" : "Incomplete"}
              </span>
            </article>
          ))}
        </div>
      </section>
      <section className="card section-card">
        <h2>{locale === "zh" ? "检验证据" : "Evidence"}</h2>
        {evidence.length ? (
          <pre>{JSON.stringify(evidence, null, 2)}</pre>
        ) : (
          <p>{locale === "zh" ? "暂无证据元数据。" : "No evidence metadata."}</p>
        )}
      </section>
      <section className="card section-card">
        <h2>{locale === "zh" ? "复检历史" : "Inspection history"}</h2>
        <div className="record-grid">
          {history.map((row) => (
            <article className="record-card" key={row.id}>
              <strong>{row.status} · {row.inspector.name}</strong>
              <span>{row.inspectedAt ? formatDate(row.inspectedAt) : (locale === "zh" ? "待检" : "Pending")}</span>
              <span>{row.notes ?? (locale === "zh" ? "无备注" : "No notes")}</span>
            </article>
          ))}
        </div>
      </section>
      {can(context, "quality.update") && inventoryOptions.length ? (
        <details className="card section-card" data-endpoint="/api/inspections">
          <summary>
            {locale === "zh"
              ? "创建更新记录 / 发起复检"
              : "Create update / start reinspection"}
          </summary>
          <p>
            {locale === "zh"
              ? "质检记录为不可变历史；提交后将新增一条更新或复检记录。"
              : "Inspection records are immutable; submitting creates a new update or reinspection record."}
          </p>
          <InspectionForm
            initialInventoryId={inspection.inventoryItemId}
            initialSerialId={inspection.inventorySerialId ?? undefined}
            items={inventoryOptions}
            locale={locale}
          />
        </details>
      ) : null}
    </>
  );
}
