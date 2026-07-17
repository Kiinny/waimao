import { getPrisma } from "@/lib/prisma";
import type {
  DashboardRepository,
  DashboardSnapshot,
} from "@/modules/dashboard/dashboard-service";
import { dashboardOwnershipFilter } from "@/modules/dashboard/dashboard-scope";

export class PrismaDashboardRepository implements DashboardRepository {
  async loadSnapshot(context: Parameters<DashboardRepository["loadSnapshot"]>[0]): Promise<DashboardSnapshot> {
    const prisma = getPrisma();
    const ownership = dashboardOwnershipFilter(context);
    const [activeCustomers, openQuotes, activeOrders, dueTasks, recentCustomers] =
      await prisma.$transaction([
        prisma.customer.count({
          where: { status: "ACTIVE", deletedAt: null, ...ownership },
        }),
        prisma.quote.count({
          where: {
            status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT"] },
            deletedAt: null,
            ...ownership,
          },
        }),
        prisma.salesOrder.count({
          where: {
            status: { in: ["CONFIRMED", "PURCHASING", "FULFILLING", "SHIPPED"] },
            deletedAt: null,
            ...ownership,
          },
        }),
        prisma.task.count({
          where: {
            assigneeId: context.userId,
            status: { in: ["OPEN", "IN_PROGRESS"] },
            dueAt: { lte: new Date() },
            deletedAt: null,
          },
        }),
        prisma.customer.findMany({
          where: { deletedAt: null, ...ownership },
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
