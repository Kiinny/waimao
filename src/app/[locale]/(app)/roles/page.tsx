import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function RolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const context = await currentAuthorizationContext();
  if (!can(context, "role.read")) {
    return <EmptyState title={dictionary.roles.denied} />;
  }
  const roles = await getPrisma().role.findMany({
    where: { deletedAt: null },
    include: { _count: { select: { users: true, permissions: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{dictionary.roles.title}</h1>
          <p>{dictionary.roles.subtitle}</p>
        </div>
      </header>
      <section className="card section-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{dictionary.roles.table.role}</th>
                <th>{dictionary.roles.table.code}</th>
                <th>{dictionary.roles.table.users}</th>
                <th>{dictionary.roles.table.permissions}</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <strong>{role.name}</strong>
                    <div className="muted">{role.description}</div>
                  </td>
                  <td>{role.code}</td>
                  <td>{role._count.users}</td>
                  <td>{role._count.permissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
