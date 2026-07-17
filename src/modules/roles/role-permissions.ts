import { DomainError } from "@/lib/errors";

export interface AvailablePermission {
  id: string;
  code: string;
}

export function resolvePermissionIds(
  requestedCodes: string[],
  availablePermissions: AvailablePermission[],
) {
  const duplicatePermissions = [
    ...new Set(
      requestedCodes.filter(
        (code, index) => requestedCodes.indexOf(code) !== index,
      ),
    ),
  ];
  if (duplicatePermissions.length) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Duplicate permission codes are not allowed",
      400,
      { duplicatePermissions },
    );
  }

  const permissionByCode = new Map(
    availablePermissions.map((permission) => [
      permission.code,
      permission.id,
    ]),
  );
  const unknownPermissions = requestedCodes.filter(
    (code) => !permissionByCode.has(code),
  );
  if (unknownPermissions.length) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Unknown permission codes are not allowed",
      400,
      { unknownPermissions },
    );
  }

  return requestedCodes.map((code) => permissionByCode.get(code)!);
}
