import Decimal from "decimal.js";

import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import type {
  DashboardRepository,
  DashboardSnapshot,
} from "@/modules/dashboard/dashboard-service";
import {
  dashboardAccessScope,
  dashboardOwnershipFilter,
} from "@/modules/dashboard/dashboard-scope";
import { weightedForecast } from "@/modules/crm/crm-domain";

export class PrismaDashboardRepository implements DashboardRepository {
  async loadSnapshot(context: Parameters<DashboardRepository["loadSnapshot"]>[0]): Promise<DashboardSnapshot> {
    requirePermission(context, "dashboard.read");
    const prisma = getPrisma();
    const access = dashboardAccessScope(context);
    const ownership = dashboardOwnershipFilter(context);
    const ownerId = access.domain === "sales" ? access.ownerId : undefined;
    const noSalesRows = { id: "00000000-0000-0000-0000-000000000000" };
    const salesOwnership =
      access.domain === "sales" ? ownership : noSalesRows;
    const orderOwnership =
      access.domain === "sales" ? ownership : {};
    const followUpScope =
      access.domain === "operations"
        ? noSalesRows
        : ownerId
          ? {
          OR: [
            { customer: { ownerId } },
            { contact: { customer: { ownerId } } },
            { lead: { ownerId } },
            { opportunity: { ownerId } },
          ],
        }
          : {};
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11, 1);
    twelveMonthsAgo.setUTCHours(0, 0, 0, 0);
    const staleBefore = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [
      activeCustomers,
      openLeads,
      openQuotes,
      activeOrders,
      dueTasks,
      recentCustomers,
      funnel,
      activeOpportunityValues,
      leadSources,
      upcomingFollowUps,
      recentLeads,
      recentOrders,
      trendOrders,
      overdueFollowUps,
      highRiskCustomers,
      staleOpportunities,
    ] =
      await prisma.$transaction([
        prisma.customer.count({
          where: { status: "ACTIVE", deletedAt: null, ...salesOwnership },
        }),
        prisma.lead.count({
          where: {
            status: { in: ["NEW", "CONTACTED", "QUALIFIED"] },
            deletedAt: null,
            ...salesOwnership,
          },
        }),
        prisma.quote.count({
          where: {
            status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SENT"] },
            deletedAt: null,
            ...salesOwnership,
          },
        }),
        prisma.salesOrder.count({
          where: {
            status: { in: ["CONFIRMED", "PURCHASING", "FULFILLING", "SHIPPED"] },
            deletedAt: null,
            ...orderOwnership,
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
          where: { deletedAt: null, ...salesOwnership },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            companyName: true,
            countryCode: true,
            createdAt: true,
          },
        }),
        prisma.opportunity.groupBy({
          by: ["stage"],
          where: { deletedAt: null, ...salesOwnership },
          orderBy: { stage: "asc" },
          _count: { id: true },
          _sum: { valueUsd: true },
        }),
        prisma.opportunity.findMany({
          where: {
            deletedAt: null,
            stage: { not: "LOST" },
            ...salesOwnership,
          },
          select: { valueUsd: true, probability: true, stage: true },
        }),
        prisma.lead.groupBy({
          by: ["source"],
          where: { deletedAt: null, ...salesOwnership },
          _count: { id: true },
          orderBy: { _count: { source: "desc" } },
          take: 8,
        }),
        prisma.followUp.findMany({
          where: {
            deletedAt: null,
            completedAt: null,
            nextActionAt: { gte: now },
            ...followUpScope,
          },
          orderBy: { nextActionAt: "asc" },
          take: 6,
          include: {
            customer: { select: { companyName: true } },
            lead: { select: { companyName: true } },
            opportunity: { select: { name: true } },
          },
        }),
        prisma.lead.findMany({
          where: { deletedAt: null, ...salesOwnership },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, companyName: true, status: true, createdAt: true },
        }),
        prisma.salesOrder.findMany({
          where: { deletedAt: null, ...orderOwnership },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalUsd: true,
            createdAt: true,
          },
        }),
        prisma.salesOrder.findMany({
          where: {
            deletedAt: null,
            createdAt: { gte: twelveMonthsAgo },
            ...orderOwnership,
          },
          select: { createdAt: true, totalUsd: true },
        }),
        prisma.followUp.count({
          where: {
            deletedAt: null,
            completedAt: null,
            nextActionAt: { lt: now },
            ...followUpScope,
          },
        }),
        prisma.customer.count({
          where: {
            deletedAt: null,
            riskRating: "HIGH",
            ...salesOwnership,
          },
        }),
        prisma.opportunity.count({
          where: {
            deletedAt: null,
            stage: { notIn: ["WON", "LOST"] },
            updatedAt: { lt: staleBefore },
            ...salesOwnership,
          },
        }),
      ]);

    const monthly = new Map<string, { count: number; valueUsd: Decimal }>();
    for (const order of trendOrders) {
      const month = order.createdAt.toISOString().slice(0, 7);
      const entry = monthly.get(month) ?? { count: 0, valueUsd: new Decimal(0) };
      entry.count += 1;
      entry.valueUsd = entry.valueUsd.plus(order.totalUsd.toString());
      monthly.set(month, entry);
    }

    return {
      activeCustomers,
      openLeads,
      pipelineValueUsd: activeOpportunityValues
        .reduce((total, item) => total.plus(item.valueUsd.toString()), new Decimal(0))
        .toFixed(2),
      weightedForecastUsd: weightedForecast(
        activeOpportunityValues.map((item) => ({
          valueUsd: item.valueUsd.toString(),
          probability: item.probability,
          stage: item.stage,
        })),
      ),
      openQuotes,
      activeOrders,
      dueTasks,
      recentCustomers,
      salesFunnel: funnel.map((item) => ({
        stage: item.stage,
        count: (item._count as { id: number }).id,
        valueUsd:
          (item._sum as { valueUsd: Decimal | null }).valueUsd?.toFixed(2) ??
          "0.00",
      })),
      monthlyOrderTrend: [...monthly.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([month, item]) => ({
          month,
          count: item.count,
          valueUsd: item.valueUsd.toFixed(2),
        })),
      leadSources: leadSources.map((item) => ({
        source: item.source,
        count: (item._count as { id: number }).id,
      })),
      upcomingFollowUps: upcomingFollowUps
        .filter(
          (item): item is typeof item & { nextActionAt: Date } =>
            item.nextActionAt !== null,
        )
        .map((item) => ({
          id: item.id,
          summary: item.summary,
          nextActionAt: item.nextActionAt,
          related:
            item.customer?.companyName ??
            item.lead?.companyName ??
            item.opportunity?.name ??
            "CRM",
        })),
      recentLeads,
      recentOrders: recentOrders.map((order) => ({
        ...order,
        totalUsd: order.totalUsd.toFixed(2),
      })),
      risks: { overdueFollowUps, highRiskCustomers, staleOpportunities },
    };
  }
}
