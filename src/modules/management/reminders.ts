export const REMINDER_KINDS = [
  "TASK_REMINDER",
  "FOLLOW_UP_DUE",
  "RECEIVABLE_DUE",
  "QUOTE_EXPIRING",
  "PURCHASE_DELAYED",
  "SHIPMENT_DELAYED",
  "LOW_INVENTORY",
] as const;

export type ReminderKind = (typeof REMINDER_KINDS)[number];

export interface ReminderCandidate {
  kind: ReminderKind;
  entityId: string;
  userId: string;
  title: string;
  message: string;
  link: string;
}

export interface ReminderRepository {
  listCandidates(now: Date): Promise<ReminderCandidate[]>;
  createNotification(candidate: ReminderCandidate): Promise<boolean>;
}

export async function processReminderCandidates(
  repository: ReminderRepository,
  now = new Date(),
) {
  const candidates = await repository.listCandidates(now);
  let created = 0;
  for (const candidate of candidates) {
    if (await repository.createNotification(candidate)) created += 1;
  }
  return { scanned: candidates.length, created };
}
