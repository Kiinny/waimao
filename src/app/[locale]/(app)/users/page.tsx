import { auth } from "@/auth";
import { EmptyState } from "@/components/empty-state";
import { getPrisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();
  if (
    !can(
      {
        userId: session!.user.id,
        permissions: session!.user.permissions,
      },
      "user.read",
    )
  ) {
    return <EmptyState title="You do not have access to user management." />;
  }

  const users = await getPrisma().user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      roles: { select: { role: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Users</h1>
          <p>Accounts, access status and assigned roles.</p>
        </div>
      </header>
      <section className="card section-card">
        {users.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
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
          <EmptyState title="No users found." />
        )}
      </section>
    </>
  );
}
