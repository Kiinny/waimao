import { describe, expect, it, vi } from "vitest";

import {
  processReminderCandidates,
  type ReminderRepository,
} from "@/modules/management/reminders";
import { PrismaReminderRepository } from "@/modules/management/prisma-reminder-repository";

const mocks = vi.hoisted(() => ({ database: null as unknown }));
vi.mock("@/lib/prisma", () => ({ getPrisma: () => mocks.database }));

describe("worker reminders", () => {
  it("uses a deterministic dedupe key so repeated runs create one notification", async () => {
    const created = new Set<string>();
    const repository: ReminderRepository = {
      listCandidates: async () => [{
        kind: "FOLLOW_UP_DUE",
        entityId: "follow-up-1",
        userId: "sales-1",
        title: "Follow-up due",
        message: "Call Northstar",
        link: "/en/customers/customer-1#follow-ups",
      }],
      createNotification: async (candidate) => {
        const key = `${candidate.kind}:${candidate.entityId}:${candidate.userId}`;
        if (created.has(key)) return false;
        created.add(key);
        return true;
      },
    };

    await expect(processReminderCandidates(repository)).resolves.toEqual({ scanned: 1, created: 1 });
    await expect(processReminderCandidates(repository)).resolves.toEqual({ scanned: 1, created: 0 });
    expect(created.size).toBe(1);
  });

  it("generates task reminders for due active tasks", async () => {
    const taskFindMany = vi.fn().mockResolvedValue([
      { id: "task-1", title: "Call customer", assigneeId: "sales-1" },
    ]);
    const empty = vi.fn().mockResolvedValue([]);
    mocks.database = {
      task: { findMany: taskFindMany },
      followUp: { findMany: empty },
      salesOrder: { findMany: empty },
      quote: { findMany: empty },
      purchaseOrder: { findMany: empty },
      shipment: { findMany: empty },
      inventoryItem: { findMany: empty },
      user: { findMany: empty },
    };
    const now = new Date("2026-07-20T12:00:00Z");

    const candidates = await new PrismaReminderRepository().listCandidates(now);

    expect(taskFindMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        reminderAt: { lte: now },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      select: { id: true, title: true, assigneeId: true },
    });
    expect(candidates).toContainEqual({
      kind: "TASK_REMINDER",
      entityId: "task-1",
      userId: "sales-1",
      title: "Task reminder",
      message: "Call customer",
      link: "/en/tasks",
    });
  });

  it("uses the repository unique dedupe key for notification creation", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 0 });
    mocks.database = { notification: { createMany } };
    const candidate = {
      kind: "TASK_REMINDER" as const,
      entityId: "task-1",
      userId: "sales-1",
      title: "Task reminder",
      message: "Call customer",
      link: "/en/tasks",
    };

    await expect(
      new PrismaReminderRepository().createNotification(candidate),
    ).resolves.toBe(false);
    expect(createMany).toHaveBeenCalledWith({
      data: [{
        userId: "sales-1",
        type: "TASK_REMINDER",
        title: "Task reminder",
        message: "Call customer",
        link: "/en/tasks",
        entityType: "TASK_REMINDER",
        entityId: "task-1",
        dedupeKey: "TASK_REMINDER:task-1:sales-1",
      }],
      skipDuplicates: true,
    });
  });
});
