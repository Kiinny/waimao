import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCreateForm } from "@/components/transactions/transaction-actions";
import { isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { PrismaTransactionsRepository } from "@/modules/transactions/prisma-transactions-repository";

export const dynamic = "force-dynamic";
const repository = new PrismaTransactionsRepository();

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const context = await currentAuthorizationContext();
  requirePermission(context, "product.read");
  const [products, categories] = await Promise.all([
    repository.listProducts(context),
    getPrisma().productCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);
  const zh = locale === "zh";
  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{zh ? "产品与配置" : "Products & Configurations"}</h1>
          <p>{zh ? "产品条件、版本、价格及出口资料" : "Conditions, versions, pricing and export metadata"}</p>
        </div>
      </header>
      <section className="record-grid">
        {products.map((product) => (
          <Link className="record-card" href={`/${locale}/products/${product.id}`} key={product.id}>
            <strong>{product.sku} · {product.name}</strong>
            <span>{product.category.name} · {product.condition}</span>
            <span>{product.availability} · {product.variants.length} configuration(s)</span>
            <span>HS {product.hsCode ?? "—"} · Export {product.exportControlRisk}</span>
          </Link>
        ))}
      </section>
      <details className="card section-card">
        <summary>{zh ? "新建产品" : "Create product"}</summary>
        <ProductCreateForm categories={categories.map(({ id, name }) => ({ id, name }))} />
      </details>
    </>
  );
}
