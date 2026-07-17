import { getPrisma } from "@/lib/prisma";
import type {
  DashboardRepository,
  DashboardSnapshot,
} from "@/modules/dashboard/dashboard-service";

export class PrismaDashboardRepository implements DashboardRepository {
  async loadSnapshot(userId: string): Promise<DashboardSnapshot> {
    const prisma = getPrisma();
    const [activeCustomers, openQuotes, activeOrders, dueTasks, recentCustomers] =
      await prisma.$transaction([
        prisma.customer.count({
          where: { status: "ACTIVE", deletedAt: null },
        }),
        prisma.quote.count({
          where: {
            status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT"] },
            deletedAt: null,
          },
        }),
        prisma.salesOrder.count({
          where: {
            status: { in: ["CONFIRMED", "PURCHASING", "FULFILLING", "SHIPPED"] },
            deletedAt: null,
          },
        }),
        prisma.task.count({
          where: {
            assigneeId: userId,
            status: { in: ["OPEN", "IN_PROGRESS"] },
            dueAt: { lte: new Date() },
            deletedAt: null,
          },
        }),
        prisma.customer.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            companyName: true,
            countryCode: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      activeCustomers,
      openQuotes,
      activeOrders,
      dueTasks,
      recentCustomers,
    };
  }
}
