import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { searchOwnershipFilter } from "@/modules/search/search-scope";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const context = await currentAuthorizationContext();
  const query = ((await searchParams).q ?? "").trim().slice(0, 100);
  const prisma = getPrisma();
  const ownership = searchOwnershipFilter(context);

  const [customers, orders, quotes] = query
    ? await Promise.all([
        can(context, "customer.read")
          ? prisma.customer.findMany({
              where: {
                deletedAt: null,
                ...ownership,
                companyName: { contains: query, mode: "insensitive" },
              },
              select: {
                id: true,
                companyName: true,
                countryCode: true,
              },
              take: 10,
            })
          : [],
        can(context, "order.read")
          ? prisma.salesOrder.findMany({
              where: {
                deletedAt: null,
                ...ownership,
                orderNumber: { contains: query, mode: "insensitive" },
              },
              select: { id: true, orderNumber: true, status: true },
              take: 10,
            })
          : [],
        can(context, "quote.read")
          ? prisma.quote.findMany({
              where: {
                deletedAt: null,
                ...ownership,
                quoteNumber: { contains: query, mode: "insensitive" },
              },
              select: { id: true, quoteNumber: true, status: true },
              take: 10,
            })
          : [],
      ])
    : [[], [], []];
  const resultCount = customers.length + orders.length + quotes.length;

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{dictionary.search.title}</h1>
          <p>
            {dictionary.search.results}: <strong>{query || "-"}</strong>
          </p>
        </div>
      </header>
      <section className="card section-card" aria-live="polite">
        {resultCount ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{dictionary.search.table.type}</th>
                  <th>{dictionary.search.table.reference}</th>
                  <th>{dictionary.search.table.statusCountry}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={`customer-${customer.id}`}>
                    <td>{dictionary.search.entities.customer}</td>
                    <td>{customer.companyName}</td>
                    <td>{customer.countryCode}</td>
                  </tr>
                ))}
                {orders.map((order) => (
                  <tr key={`order-${order.id}`}>
                    <td>{dictionary.search.entities.order}</td>
                    <td>{order.orderNumber}</td>
                    <td>{order.status}</td>
                  </tr>
                ))}
                {quotes.map((quote) => (
                  <tr key={`quote-${quote.id}`}>
                    <td>{dictionary.search.entities.quote}</td>
                    <td>{quote.quoteNumber}</td>
                    <td>{quote.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={dictionary.search.empty} />
        )}
      </section>
    </>
  );
}
