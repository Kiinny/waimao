import { DomainError } from "@/lib/errors";

export const TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

const ticketTransitions: Record<TicketStatus, readonly TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["WAITING_CUSTOMER", "RESOLVED", "CLOSED"],
  WAITING_CUSTOMER: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: [],
};

export function assertTicketTransition(from: TicketStatus, to: TicketStatus) {
  if (!ticketTransitions[from].includes(to)) {
    throw new DomainError(
      "INVALID_TICKET_TRANSITION",
      `Ticket cannot move from ${from} to ${to}`,
      409,
    );
  }
}

export function isTaskOverdue(
  task: { status: string; dueAt: Date | null },
  now = new Date(),
) {
  return (
    task.dueAt !== null &&
    task.dueAt < now &&
    !["COMPLETED", "CANCELLED"].includes(task.status)
  );
}

export type TaskWorkflowStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

const taskTransitions: Record<
  TaskWorkflowStatus,
  readonly TaskWorkflowStatus[]
> = {
  OPEN: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["OPEN", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertTaskTransition(
  from: TaskWorkflowStatus,
  to: TaskWorkflowStatus,
) {
  if (!taskTransitions[from].includes(to)) {
    throw new DomainError(
      "INVALID_TASK_TRANSITION",
      `Task cannot move from ${from} to ${to}`,
      409,
    );
  }
}

const sensitiveKey = /(password|secret|token|api.?key|private.?key)/i;
const bankKey = /(bank.?account|account.?number)/i;

function maskAccount(value: unknown) {
  const text = String(value);
  return `${"*".repeat(Math.max(4, text.length - 4))}${text.slice(-4)}`;
}

export function redactSensitiveValues(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitiveValues);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => {
      if (sensitiveKey.test(key)) return [key, "[REDACTED]"];
      if (bankKey.test(key) && nested !== null) return [key, maskAccount(nested)];
      return [key, redactSensitiveValues(nested)];
    }),
  );
}

function redactEveryLeaf(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactEveryLeaf);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, redactEveryLeaf(nested)]),
    );
  }
  return value === null ? null : "[REDACTED]";
}

export function redactSettingValue(value: unknown, isSecret: boolean) {
  return isSecret ? redactEveryLeaf(value) : redactSensitiveValues(value);
}

export function preserveMaskedValues(
  next: Record<string, unknown>,
  current: Record<string, unknown>,
  isSecret = false,
): Record<string, unknown> {
  function preserveValue(key: string, value: unknown, previous: unknown): unknown {
    const isMaskedSecret =
      value === "[REDACTED]" && (isSecret || sensitiveKey.test(key));
    const isMaskedAccount =
      bankKey.test(key) &&
      typeof value === "string" &&
      /^\*+\S{4}$/.test(value);
    if ((isMaskedSecret || isMaskedAccount) && previous !== undefined) {
      return previous;
    }
    if (Array.isArray(value) && Array.isArray(previous)) {
      return value.map((item, index) =>
        preserveValue(key, item, previous[index]),
      );
    }
    if (
      value &&
      previous &&
      typeof value === "object" &&
      typeof previous === "object" &&
      !Array.isArray(value) &&
      !Array.isArray(previous)
    ) {
      return preserveMaskedValues(
        value as Record<string, unknown>,
        previous as Record<string, unknown>,
        isSecret,
      );
    }
    return value;
  }

  return Object.fromEntries(
    Object.entries(next).map(([key, value]) => [
      key,
      preserveValue(key, value, current[key]),
    ]),
  );
}
