import Link from "next/link";
import { notFound } from "next/navigation";

import { SupplierCreateForm } from "@/components/procurement/procurement-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";

export const dynamic = "force-dynamic";
const service = new ProcurementService();

export default async function SuppliersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "supplier.read");
  const [suppliers, products] = await Promise.all([
    service.listSuppliers(context),
    service.listSupplierProductOptions(),
  ]);
  const productOptions = products.map((product) => ({
    id: product.id,
    label: [
      `${product.sku} · ${product.name}`,
      product.category.name,
      product.brand,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{locale === "zh" ? "供应商" : "Suppliers"}</h1>
          <p>
            {locale === "zh"
              ? "合格供货来源、联系人与采购活动"
              : "Approved sources, contacts and purchasing activity"}
          </p>
        </div>
      </header>
      <section className="record-grid">
        {suppliers.map((supplier) => (
          <article className="record-card" key={supplier.id}>
            <strong>{supplier.code} · {supplier.name}</strong>
            <span>{supplier.countryCode} · {supplier.status}</span>
            <span>
              {supplier.contactName ?? (locale === "zh" ? "无联系人" : "No contact")} ·{" "}
              {supplier.email ?? (locale === "zh" ? "无邮箱" : "No email")}
            </span>
            <span>
              {supplier._count.purchaseOrders}{" "}
              {locale === "zh" ? "张采购订单" : "purchase orders"} ·{" "}
              {supplier._count.products} {locale === "zh" ? "种产品" : "products"}
            </span>
            <Link href={`/${locale}/suppliers/${supplier.id}`}>
              {locale === "zh" ? "查看供应商详情" : "View supplier details"}
            </Link>
          </article>
        ))}
      </section>
      {can(context, "supplier.create") ? (
        <details className="card section-card">
          <summary>{locale === "zh" ? "新建供应商" : "Create supplier"}</summary>
          <SupplierCreateForm locale={locale} productOptions={productOptions} />
        </details>
      ) : null}
    </>
  );
}
