import { describe, expect, it } from "vitest";

import {
  loadAuthorizationContext,
  type AuthorizationRepository,
  type AuthorizationUserRecord,
} from "@/modules/auth/authorization-context";

function repositoryFor(
  loadUser: () => AuthorizationUserRecord | null,
): AuthorizationRepository {
  return {
    findAuthorizationUser: async () => loadUser(),
  };
}

describe("server authorization context", () => {
  it("loads only current permissions from non-deleted roles", async () => {
    const repository = repositoryFor(() => ({
      id: "user-1",
      status: "ACTIVE",
      deletedAt: null,
      roles: [
        {
          deletedAt: null,
          permissions: ["user.read", "role.read", "user.read"],
        },
        {
          deletedAt: new Date("2026-01-01"),
          permissions: ["*", "finance.profit.read"],
        },
      ],
    }));

    await expect(loadAuthorizationContext(repository, "user-1")).resolves.toEqual(
      {
        userId: "user-1",
        permissions: ["user.read", "role.read"],
      },
    );
  });

  it.each(["INACTIVE", "LOCKED"] as const)(
    "rejects a %s user even when the session token still exists",
    async (status) => {
      const repository = repositoryFor(() => ({
        id: "user-1",
        status,
        deletedAt: null,
        roles: [{ deletedAt: null, permissions: ["*"] }],
      }));

      await expect(
        loadAuthorizationContext(repository, "user-1"),
      ).rejects.toMatchObject({
        code: "UNAUTHENTICATED",
        status: 401,
      });
    },
  );

  it("rejects a soft-deleted user", async () => {
    const repository = repositoryFor(() => ({
      id: "user-1",
      status: "ACTIVE",
      deletedAt: new Date("2026-01-01"),
      roles: [{ deletedAt: null, permissions: ["*"] }],
    }));

    await expect(
      loadAuthorizationContext(repository, "user-1"),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("does not retain permissions removed after the session was issued", async () => {
    let roleDeleted = false;
    const repository = repositoryFor(() => ({
      id: "user-1",
      status: "ACTIVE",
      deletedAt: null,
      roles: [
        {
          deletedAt: roleDeleted ? new Date("2026-01-01") : null,
          permissions: ["role.update"],
        },
      ],
    }));

    await expect(loadAuthorizationContext(repository, "user-1")).resolves
      .toMatchObject({ permissions: ["role.update"] });
    roleDeleted = true;
    await expect(loadAuthorizationContext(repository, "user-1")).resolves
      .toMatchObject({ permissions: [] });
  });
});
