import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("uses Argon2id and verifies the original password", async () => {
    const hash = await hashPassword("ChangeMe123!");
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword(hash, "ChangeMe123!")).resolves.toBe(true);
    await expect(verifyPassword(hash, "wrong-password")).resolves.toBe(false);
  });
});
