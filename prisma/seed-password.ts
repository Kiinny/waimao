export const DEVELOPMENT_SEED_PASSWORD = "ChangeMe123!";

type SeedEnvironment = {
  NODE_ENV?: string;
  SEED_ADMIN_PASSWORD?: string;
};

export function resolveSeedPassword(environment: SeedEnvironment): string {
  const configuredPassword = environment.SEED_ADMIN_PASSWORD;

  if (configuredPassword?.trim()) {
    if (
      environment.NODE_ENV !== "development" &&
      configuredPassword === DEVELOPMENT_SEED_PASSWORD
    ) {
      throw new Error(
        "SEED_ADMIN_PASSWORD must not use the development default outside development",
      );
    }
    return configuredPassword;
  }

  if (environment.NODE_ENV === "development") {
    return DEVELOPMENT_SEED_PASSWORD;
  }

  throw new Error("SEED_ADMIN_PASSWORD is required outside development");
}
