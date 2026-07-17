import { notFound } from "next/navigation";

import { ApiMutationForm } from "@/components/crm/api-mutation-form";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";

export const dynamic = "force-dynamic";
const repository = new PrismaTransactionsRepository();

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "product.read");
  const product = await repository.getProduct(context, id);
  if (!product) notFound();
  return (
    <>
      <header className="page-heading">
        <div><h1>{product.name}</h1><p>{product.sku} · {product.category.name} · {product.condition}</p></div>
      </header>
      <section className="card section-card">
        <h2>Commercial & export data</h2>
        <dl className="detail-grid">
          <div><dt>Base model</dt><dd>{product.baseModel ?? "—"}</dd></div>
          <div><dt>Reference price</dt><dd>{product.referenceCurrencyCode ?? ""} {product.referencePrice?.toString() ?? "—"}</dd></div>
          <div><dt>HS code</dt><dd>{product.hsCode ?? "—"}</dd></div>
          <div><dt>Export risk</dt><dd>{product.exportControlRisk}</dd></div>
          <div><dt>Availability</dt><dd>{product.availability}</dd></div>
          <div><dt>Dimensions</dt><dd>{JSON.stringify(product.dimensions ?? {})}</dd></div>
        </dl>
      </section>
      <section className="record-grid">
        {product.variants.map((variant) => (
          <article className="record-card" key={variant.id}>
            <strong>v{variant.configurationVersion} · {variant.name}</strong>
            <span>{variant.sku}</span>
            <span>{JSON.stringify(variant.configuration)}</span>
          </article>
        ))}
      </section>
      <details className="card section-card">
        <summary>Edit product</summary>
        <ApiMutationForm endpoint={`/api/products/${id}`} failureMessage="Update failed" loadingLabel="Saving..." method="PATCH" submitLabel="Save" successMessage="Product updated">
          <label>Name<input defaultValue={product.name} name="name" required /></label>
          <label>Availability<select defaultValue={product.availability} name="availability"><option>AVAILABLE</option><option>IN_STOCK</option><option>LIMITED</option><option>ON_REQUEST</option><option>UNAVAILABLE</option></select></label>
          <label>Export risk<select defaultValue={product.exportControlRisk} name="exportControlRisk"><option>LOW</option><option>REVIEW_REQUIRED</option><option>RESTRICTED</option></select></label>
        </ApiMutationForm>
      </details>
    </>
  );
}
