import type { Prisma } from "@/generated/prisma/client";

export interface AuditInput {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}

export interface AuditWriter {
  auditLog: {
    create(args: { data: AuditInput }): Promise<unknown>;
  };
}

export function writeAudit(writer: AuditWriter, input: AuditInput) {
  return writer.auditLog.create({ data: input });
}
