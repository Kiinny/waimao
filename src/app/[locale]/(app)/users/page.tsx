import { notFound } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { getDictionary, isLocale } from "@/i18n/dictionaries";
import { currentAuthorizationContext } from "@/lib/current-user";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const context = await currentAuthorizationContext();
  if (!can(context, "user.read")) {
    return <EmptyState title={dictionary.users.denied} />;
  }

  const users = await getPrisma().user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      roles: {
        where: { role: { deletedAt: null } },
        select: { role: { select: { name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>{dictionary.users.title}</h1>
          <p>{dictionary.users.subtitle}</p>
        </div>
      </header>
      <section className="card section-card">
        {users.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{dictionary.users.table.name}</th>
                  <th>{dictionary.users.table.email}</th>
                  <th>{dictionary.users.table.role}</th>
                  <th>{dictionary.users.table.status}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.roles.map(({ role }) => role.name).join(", ")}</td>
                    <td>
                      <span className="badge">{user.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={dictionary.users.empty} />
        )}
      </section>
    </>
  );
}
