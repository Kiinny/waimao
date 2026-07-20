import { getPrisma } from "@/lib/prisma";
import type {
  ReminderCandidate,
  ReminderRepository,
} from "@/modules/management/reminders";

function endOfWindow(now: Date, days: number) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export class PrismaReminderRepository implements ReminderRepository {
  async listCandidates(now: Date) {
    const prisma = getPrisma();
    const [
      tasks,
      followUps,
      receivables,
      quotes,
      purchases,
      shipments,
      lowInventory,
      operationsUsers,
    ] = await Promise.all([
      prisma.task.findMany({
        where: {
          deletedAt: null,
          reminderAt: { lte: now },
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
        select: { id: true, title: true, assigneeId: true },
      }),
      prisma.followUp.findMany({
        where: {
          deletedAt: null,
          completedAt: null,
          nextActionAt: { lte: endOfWindow(now, 1) },
        },
        select: {
          id: true,
          createdById: true,
          nextAction: true,
          customerId: true,
          leadId: true,
        },
      }),
      prisma.salesOrder.findMany({
        where: {
          deletedAt: null,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
          paymentStatus: { not: "PAID" },
        },
        select: {
          id: true,
          orderNumber: true,
          ownerId: true,
          customerId: true,
        },
      }),
      prisma.quote.findMany({
        where: {
          deletedAt: null,
          status: { in: ["APPROVED", "SENT", "VIEWED"] },
          validUntil: { gte: now, lte: endOfWindow(now, 3) },
        },
        select: { id: true, quoteNumber: true, ownerId: true },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          deletedAt: null,
          expectedAt: { lt: now },
          status: { notIn: ["RECEIVED", "CANCELLED"] },
        },
        select: {
          id: true,
          purchaseOrderNumber: true,
          buyerId: true,
        },
      }),
      prisma.shipment.findMany({
        where: {
          deletedAt: null,
          estimatedArrivalAt: { lt: now },
          status: { notIn: ["DELIVERED", "CANCELLED"] },
        },
        select: {
          id: true,
          shipmentNumber: true,
          coordinatorId: true,
        },
      }),
      prisma.inventoryItem.findMany({
        where: {
          deletedAt: null,
          quantityOnHand: { lte: 2 },
        },
        select: { id: true, product: { select: { sku: true, name: true } } },
      }),
      prisma.user.findMany({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          roles: { some: { role: { code: { in: ["OPERATIONS", "PROCUREMENT"] } } } },
        },
        select: { id: true },
      }),
    ]);

    const candidates: ReminderCandidate[] = [
      ...tasks.map((row) => ({
        kind: "TASK_REMINDER" as const,
        entityId: row.id,
        userId: row.assigneeId,
        title: "Task reminder",
        message: row.title,
        link: "/en/tasks",
      })),
      ...followUps.map((row) => ({
        kind: "FOLLOW_UP_DUE" as const,
        entityId: row.id,
        userId: row.createdById,
        title: "Follow-up due",
        message: row.nextAction ?? "A planned follow-up needs attention.",
        link: row.customerId
          ? `/en/customers/${row.customerId}#follow-ups`
          : "/en/leads",
      })),
      ...receivables.map((row) => ({
        kind: "RECEIVABLE_DUE" as const,
        entityId: row.id,
        userId: row.ownerId,
        title: "Receivable outstanding",
        message: `${row.orderNumber} has an outstanding balance.`,
        link: `/en/orders/${row.id}`,
      })),
      ...quotes.map((row) => ({
        kind: "QUOTE_EXPIRING" as const,
        entityId: row.id,
        userId: row.ownerId,
        title: "Quote expiring",
        message: `${row.quoteNumber} expires within three days.`,
        link: `/en/quotes/${row.id}`,
      })),
      ...purchases.map((row) => ({
        kind: "PURCHASE_DELAYED" as const,
        entityId: row.id,
        userId: row.buyerId,
        title: "Purchase delayed",
        message: `${row.purchaseOrderNumber} is past its expected date.`,
        link: `/en/purchase-orders/${row.id}`,
      })),
      ...shipments.map((row) => ({
        kind: "SHIPMENT_DELAYED" as const,
        entityId: row.id,
        userId: row.coordinatorId,
        title: "Shipment delayed",
        message: `${row.shipmentNumber} is past its estimated arrival.`,
        link: `/en/shipments/${row.id}`,
      })),
      ...lowInventory.flatMap((row) =>
        operationsUsers.map((user) => ({
          kind: "LOW_INVENTORY" as const,
          entityId: row.id,
          userId: user.id,
          title: "Low inventory",
          message: `${row.product.sku} · ${row.product.name} is at or below the threshold.`,
          link: "/en/inventory",
        })),
      ),
    ];
    return candidates;
  }

  async createNotification(candidate: ReminderCandidate) {
    const dedupeKey = `${candidate.kind}:${candidate.entityId}:${candidate.userId}`;
    const result = await getPrisma().notification.createMany({
      data: [{
        userId: candidate.userId,
        type: candidate.kind,
        title: candidate.title,
        message: candidate.message,
        link: candidate.link,
        entityType: candidate.kind,
        entityId: candidate.entityId,
        dedupeKey,
      }],
      skipDuplicates: true,
    });
    return result.count === 1;
  }
}
