import { verifyPassword } from "@/lib/password";

export interface LoginIdentity {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: "ACTIVE" | "INACTIVE" | "LOCKED";
  roles: string[];
  permissions: string[];
}

export interface AuthRepository {
  findByEmail(email: string): Promise<LoginIdentity | null>;
  recordAttempt(input: {
    userId?: string;
    email: string;
    success: boolean;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;
  writeAudit(
    action: string,
    input: { actorId?: string; email: string; ipAddress?: string },
  ): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
}

export interface CredentialInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function authenticateCredentials(
  repository: AuthRepository,
  input: CredentialInput,
) {
  const email = input.email.trim().toLowerCase();
  const user = await repository.findByEmail(email);
  const validPassword =
    user !== null && (await verifyPassword(user.passwordHash, input.password));

  if (!user || !validPassword || user.status !== "ACTIVE") {
    const reason =
      user && validPassword ? "USER_INACTIVE" : "INVALID_CREDENTIALS";
    await repository.recordAttempt({
      userId: user?.id,
      email,
      success: false,
      reason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    await repository.writeAudit("auth.login.failure", {
      actorId: user?.id,
      email,
      ipAddress: input.ipAddress,
    });
    return null;
  }

  await repository.recordAttempt({
    userId: user.id,
    email,
    success: true,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });
  await repository.updateLastLogin(user.id);
  await repository.writeAudit("auth.login.success", {
    actorId: user.id,
    email,
    ipAddress: input.ipAddress,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    permissions: user.permissions,
  };
}
