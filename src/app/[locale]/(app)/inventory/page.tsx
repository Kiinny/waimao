import { notFound } from "next/navigation";

import {
  InventoryMutationForm,
  InventoryTransferForm,
} from "@/components/procurement/procurement-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";

export const dynamic = "force-dynamic";
const service = new ProcurementService();

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "inventory.read");
  const [items, locations] = await Promise.all([
    service.listInventory(),
    service.listWarehouseLocations(),
  ]);
  const options = items.map((item) => ({
    id: item.id,
    label: `${item.product.sku} · ${item.location.warehouse.code}/${item.location.code} · ${item.quantityOnHand - item.quantityReserved} ${locale === "zh" ? "可用" : "available"}`,
    version: item.version,
    serialized: item.product.serialized,
    serials: item.serials.map((serial) => ({
      id: serial.id,
      serialNumber: serial.serialNumber,
      status: serial.status,
    })),
  }));
  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{locale === "zh" ? "库存" : "Inventory"}</h1>
          <p>{locale === "zh" ? "按仓库、库位和序列号管理实物库存" : "Physical stock by warehouse, location and serial"}</p>
        </div>
      </header>
      <section className="record-grid">
        {items.map((item) => (
          <article className="record-card" key={item.id}>
            <strong>{item.product.sku} · {item.product.name}</strong>
            <span>{item.location.warehouse.name} / {item.location.code}</span>
            <span>{locale === "zh" ? "在库" : "On hand"} {item.quantityOnHand} · {locale === "zh" ? "预留" : "Reserved"} {item.quantityReserved}</span>
            <span>{item.serials.map((serial) => `${serial.serialNumber} (${serial.status})`).join(", ") || (locale === "zh" ? "非序列化库存" : "Non-serialized stock")}</span>
          </article>
        ))}
      </section>
      {can(context, "inventory.update") ? (
        <div className="two-column">
          <details className="card section-card">
            <summary>{locale === "zh" ? "库存操作" : "Post inventory transaction"}</summary>
            <InventoryMutationForm items={options} locale={locale} />
          </details>
          <details className="card section-card">
            <summary>{locale === "zh" ? "库存调拨" : "Transfer inventory"}</summary>
            <InventoryTransferForm
              items={options}
              locale={locale}
              locations={locations.map((location) => ({
                id: location.id,
                label: `${location.warehouse.code} / ${location.code}`,
              }))}
            />
          </details>
        </div>
      ) : null}
    </>
  );
}
