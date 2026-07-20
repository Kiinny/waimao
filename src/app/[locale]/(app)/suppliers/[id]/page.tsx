import { notFound } from "next/navigation";

import {
  SupplierArchiveAction,
  SupplierEditForm,
} from "@/components/procurement/procurement-forms";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { can, requirePermission } from "@/lib/rbac";
import { ProcurementService } from "@/modules/procurement/procurement-service";

export const dynamic = "force-dynamic";
const service = new ProcurementService();

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "supplier.read");
  const [supplier, products] = await Promise.all([
    service.getSupplier(id, context),
    service.listSupplierProductOptions(),
  ]);
  if (!supplier) notFound();
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

  const activeOrders = supplier.purchaseOrders.filter(
    (order) => order.status !== "CANCELLED",
  );
  const purchasingTotal = activeOrders.reduce(
    (total, order) => total + Number(order.totalUsd),
    0,
  );
  const receivedOrders = activeOrders.filter(
    (order) => order.status === "RECEIVED",
  ).length;
  const receiptRate = activeOrders.length
    ? Math.round((receivedOrders / activeOrders.length) * 100)
    : 0;
  const categories = supplier.categories.map((category) => category.name);
  const brands = [
    ...new Set(
      supplier.products
        .map(({ product }) => product.brand)
        .filter((brand): brand is string => Boolean(brand)),
    ),
  ];
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US").format(date);

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{supplier.name}</h1>
          <p>{supplier.code} · {supplier.supplierType} · {supplier.status}</p>
        </div>
      </header>
      <section className="card section-card">
        <h2>{locale === "zh" ? "运营指标" : "Operational metrics"}</h2>
        <dl className="detail-grid">
          <div><dt>{locale === "zh" ? "累计采购额" : "Purchasing total"}</dt><dd>USD {purchasingTotal.toFixed(2)}</dd></div>
          <div><dt>{locale === "zh" ? "活跃采购订单" : "Active purchase orders"}</dt><dd>{activeOrders.length}</dd></div>
          <div><dt>{locale === "zh" ? "收货完成率" : "Receipt completion rate"}</dt><dd>{receiptRate}%</dd></div>
          <div><dt>{locale === "zh" ? "产品数量" : "Products supplied"}</dt><dd>{supplier.products.length}</dd></div>
          <div><dt>{locale === "zh" ? "评级" : "Rating"}</dt><dd>{supplier.rating ? `${supplier.rating}/5` : "—"}</dd></div>
          <div><dt>{locale === "zh" ? "交货周期" : "Lead time"}</dt><dd>{supplier.leadTimeDays !== null ? `${supplier.leadTimeDays} ${locale === "zh" ? "天" : "days"}` : "—"}</dd></div>
        </dl>
      </section>
      <section className="card section-card">
        <h2>{locale === "zh" ? "联系方式与条款" : "Contact and terms"}</h2>
        <dl className="detail-grid">
          <div><dt>{locale === "zh" ? "联系人" : "Contact"}</dt><dd>{supplier.contactName ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "电子邮箱" : "Email"}</dt><dd>{supplier.email ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "电话" : "Phone"}</dt><dd>{supplier.phone ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "付款条款" : "Payment terms"}</dt><dd>{supplier.paymentTerms ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "开户行" : "Bank"}</dt><dd>{supplier.bankName ?? "—"}</dd></div>
          <div><dt>{locale === "zh" ? "已掩码账号" : "Masked account"}</dt><dd>{supplier.bankAccountNumber ?? "—"}</dd></div>
        </dl>
      </section>
      <section className="card section-card">
        <h2>{locale === "zh" ? "品类与品牌" : "Categories and brands"}</h2>
        <p>
          {locale === "zh" ? "品类" : "Categories"}:{" "}
          {categories.join(", ") || (locale === "zh" ? "暂无" : "None")}
        </p>
        <p>
          {locale === "zh" ? "品牌" : "Brands"}:{" "}
          {brands.join(", ") || (locale === "zh" ? "暂无" : "None")}
        </p>
        <div className="record-grid">
          {supplier.products.map(({ product, supplierSku, lastCost, currencyCode }) => (
            <article className="record-card" key={product.id}>
              <strong>{product.sku} · {product.name}</strong>
              <span>{product.category.name} · {product.brand ?? (locale === "zh" ? "无品牌" : "Unbranded")}</span>
              <span>{locale === "zh" ? "供应商 SKU" : "Supplier SKU"}: {supplierSku ?? "—"}</span>
              <span>{locale === "zh" ? "最近成本" : "Last cost"}: {currencyCode ?? ""} {lastCost?.toString() ?? "—"}</span>
            </article>
          ))}
        </div>
      </section>
      <section className="card section-card">
        <h2>{locale === "zh" ? "采购历史" : "Purchase history"}</h2>
        <div className="record-grid">
          {supplier.purchaseOrders.map((order) => (
            <article className="record-card" key={order.id}>
              <strong>{order.purchaseOrderNumber} · {order.status}</strong>
              <span>{order.currencyCode} {order.total.toString()}</span>
              <span>{locale === "zh" ? "创建日期" : "Created"}: {formatDate(order.createdAt)}</span>
              <span>{locale === "zh" ? "预计到货" : "Expected"}: {order.expectedAt ? formatDate(order.expectedAt) : "—"}</span>
            </article>
          ))}
          {supplier.purchaseOrders.length === 0 ? (
            <p>{locale === "zh" ? "暂无采购记录。" : "No purchasing history yet."}</p>
          ) : null}
        </div>
      </section>
      {can(context, "supplier.update") ? (
        <section className="card section-card" data-endpoint={`/api/suppliers/${supplier.id}`}>
          <details>
            <summary>{locale === "zh" ? "编辑供应商" : "Edit supplier"}</summary>
            <SupplierEditForm
              locale={locale}
              productOptions={productOptions}
              supplier={supplier}
            />
          </details>
          <SupplierArchiveAction
            expectedVersion={supplier.version}
            locale={locale}
            supplierId={supplier.id}
          />
        </section>
      ) : null}
    </>
  );
}
