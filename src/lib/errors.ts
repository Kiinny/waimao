export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class AuthorizationError extends DomainError {
  constructor(permission: string) {
    super(
      "PERMISSION_DENIED",
      `Permission denied: ${permission}`,
      403,
    );
  }
}
