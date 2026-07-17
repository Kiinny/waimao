import { auth } from "@/auth";
import { EmptyState } from "@/components/empty-state";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const session = await auth();
  if (
    !can(
      {
        userId: session!.user.id,
        permissions: session!.user.permissions,
      },
      "role.read",
    )
  ) {
    return <EmptyState title="You do not have access to role management." />;
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
          <h1>Roles</h1>
          <p>System responsibilities and permission coverage.</p>
        </div>
      </header>
      <section className="card section-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Code</th>
                <th>Users</th>
                <th>Permissions</th>
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
