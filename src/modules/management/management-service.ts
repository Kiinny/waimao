import Decimal from "decimal.js";

import type { Prisma } from "@/generated/prisma/client";
import { writeAudit } from "@/lib/audit";
import { DomainError } from "@/lib/errors";
import { getPrisma } from "@/lib/prisma";
import {
  hasGlobalOwnershipScope,
  type AuthorizationContext,
} from "@/lib/rbac";
import {
  assertTaskTransition,
  assertTicketTransition,
  isTaskOverdue,
  preserveMaskedValues,
  redactSettingValue,
  redactSensitiveValues,
  type TicketStatus,
  type TaskWorkflowStatus,
} from "@/modules/management/management-domain";
import type {
  settingsUpdateSchema,
  taskSchema,
  taskUpdateSchema,
  ticketSchema,
  ticketUpdateSchema,
} from "@/modules/management/management-schemas";
import {
  buildReportRows,
  assertReportAccess,
  groupReportRows,
  reportScope,
} from "@/modules/management/reporting";
import type { z } from "zod";

type Transaction = Prisma.TransactionClient;
type TicketInput = z.infer<typeof ticketSchema>;
type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
type TaskInput = z.infer<typeof taskSchema>;
type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
type SettingInput = z.infer<typeof settingsUpdateSchema>;

async function nextNumber(transaction: Transaction, key: string) {
  const sequence = await transaction.sequence.update({
    where: { key },
    data: { nextValue: { increment: 1 }, version: { increment: 1 } },
  });
  return `${sequence.prefix}-${(sequence.nextValue - BigInt(1))
    .toString()
    .padStart(sequence.padding, "0")}`;
}

async function assertAttachments(
  transaction: Transaction,
  attachmentIds: readonly string[] | undefined,
) {
  if (!attachmentIds?.length) return;
  const ids = [...new Set(attachmentIds)];
  const count = await transaction.fileAsset.count({
    where: { id: { in: ids }, deletedAt: null },
  });
  if (count !== ids.length) {
    throw new DomainError(
      "ATTACHMENT_NOT_FOUND",
      "One or more attachments are unavailable",
      409,
    );
  }
}

function taskScope(context: AuthorizationContext) {
  return hasGlobalOwnershipScope(context, "task.read")
    ? {}
    : {
        OR: [
          { assigneeId: context.userId },
          { creatorId: context.userId },
          ...((context.roles ?? []).length
            ? [{ teamCode: { in: [...(context.roles ?? [])] } }]
            : []),
        ],
      };
}

async function assertTaskAssignee(
  transaction: Transaction,
  assigneeId: string,
  teamCode?: string | null,
) {
  const assignee = await transaction.user.findFirst({
    where: {
      id: assigneeId,
      status: "ACTIVE",
      deletedAt: null,
      ...(teamCode
        ? { roles: { some: { role: { code: teamCode, deletedAt: null } } } }
        : {}),
    },
    select: { id: true },
  });
  if (!assignee) {
    throw new DomainError(
      "INVALID_TASK_ASSIGNEE",
      teamCode
        ? "Task assignee must be an active member of the selected team"
        : "Task assignee must be active",
      409,
    );
  }
}

export class ManagementService {
  listTickets() {
    return getPrisma().afterSalesTicket.findMany({
      where: { deletedAt: null },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      include: {
        customer: { select: { id: true, companyName: true } },
        salesOrder: { select: { id: true, orderNumber: true } },
        product: { select: { id: true, sku: true, name: true } },
        inventorySerial: { select: { id: true, serialNumber: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  createTicket(context: AuthorizationContext, input: TicketInput) {
    return getPrisma().$transaction(async (transaction) => {
      await assertAttachments(transaction, input.attachmentIds);
      const row = await transaction.afterSalesTicket.create({
        data: {
          ticketNumber: await nextNumber(transaction, "ticket"),
          customerId: input.customerId,
          salesOrderId: input.salesOrderId,
          productId: input.productId,
          inventorySerialId: input.inventorySerialId,
          assignedToId: input.assignedToId,
          subject: input.subject,
          description: input.description,
          issueType: input.issueType,
          priority: input.priority,
          solution: input.solution,
          costAmount: input.costAmount,
          costCurrencyCode: input.costCurrencyCode,
          attachments: input.attachmentIds ?? [],
        },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "after_sales.create",
        entityType: "AfterSalesTicket",
        entityId: row.id,
        after: {
          ticketNumber: row.ticketNumber,
          issueType: row.issueType,
          priority: row.priority,
          assignedToId: row.assignedToId,
        },
      });
      return row;
    });
  }

  updateTicket(
    context: AuthorizationContext,
    id: string,
    input: TicketUpdateInput,
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const current = await transaction.afterSalesTicket.findFirst({
        where: { id, deletedAt: null },
      });
      if (!current) {
        throw new DomainError("TICKET_NOT_FOUND", "Ticket not found", 404);
      }
      if (current.version !== input.expectedVersion) {
        throw new DomainError(
          "TICKET_CONFLICT",
          "Ticket changed; refresh and retry",
          409,
        );
      }
      if (current.status === "CLOSED") {
        throw new DomainError(
          "TICKET_CLOSED",
          "Closed tickets cannot be changed",
          409,
        );
      }
      if (
        current.status === "RESOLVED" &&
        input.solution !== undefined &&
        !input.solution?.trim()
      ) {
        throw new DomainError(
          "TICKET_SOLUTION_REQUIRED",
          "Resolved tickets must retain their solution",
          409,
        );
      }
      if (input.status && input.status !== current.status) {
        assertTicketTransition(current.status as TicketStatus, input.status);
      }
      await assertAttachments(transaction, input.attachmentIds);
      const { expectedVersion: _, attachmentIds, ...changes } = input;
      void _;
      const status = input.status ?? current.status;
      const solution =
        input.solution === undefined ? current.solution : input.solution;
      if (
        ["RESOLVED", "CLOSED"].includes(status) &&
        !solution?.trim()
      ) {
        throw new DomainError(
          "TICKET_SOLUTION_REQUIRED",
          "Resolved and closed tickets require a solution",
          409,
        );
      }
      const changed = await transaction.afterSalesTicket.updateMany({
        where: { id, version: current.version, deletedAt: null },
        data: {
          ...changes,
          attachments: attachmentIds ?? undefined,
          resolvedAt:
            status === "RESOLVED" && current.status !== "RESOLVED"
              ? new Date()
              : undefined,
          closedAt:
            status === "CLOSED" && current.status !== "CLOSED"
              ? new Date()
              : undefined,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1) {
        throw new DomainError(
          "TICKET_CONFLICT",
          "Ticket changed; refresh and retry",
          409,
        );
      }
      const updated = await transaction.afterSalesTicket.findUniqueOrThrow({
        where: { id },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "after_sales.update",
        entityType: "AfterSalesTicket",
        entityId: id,
        before: { status: current.status, version: current.version },
        after: {
          status: updated.status,
          version: updated.version,
          assignedToId: updated.assignedToId,
          costAmount: updated.costAmount?.toString() ?? null,
        },
      });
      return updated;
    });
  }

  async ticketOptions() {
    const prisma = getPrisma();
    const [customers, orders, products, serials, users] = await Promise.all([
      prisma.customer.findMany({
        where: { deletedAt: null },
        orderBy: { companyName: "asc" },
        select: { id: true, companyName: true },
      }),
      prisma.salesOrder.findMany({
        where: { deletedAt: null },
        orderBy: { orderNumber: "desc" },
        select: { id: true, orderNumber: true },
      }),
      prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { sku: "asc" },
        select: { id: true, sku: true, name: true },
      }),
      prisma.inventorySerial.findMany({
        orderBy: { serialNumber: "asc" },
        select: { id: true, serialNumber: true },
      }),
      prisma.user.findMany({
        where: { status: "ACTIVE", deletedAt: null },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    return { customers, orders, products, serials, users };
  }

  async listTasks(context: AuthorizationContext) {
    const rows = await getPrisma().task.findMany({
      where: { deletedAt: null, ...taskScope(context) },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });
    const now = new Date();
    return rows.map((row) => ({ ...row, overdue: isTaskOverdue(row, now) }));
  }

  createTask(context: AuthorizationContext, input: TaskInput) {
    return getPrisma().$transaction(async (transaction) => {
      await assertTaskAssignee(transaction, input.assigneeId, input.teamCode);
      const row = await transaction.task.create({
        data: { ...input, creatorId: context.userId },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "task.create",
        entityType: "Task",
        entityId: row.id,
        after: {
          title: row.title,
          assigneeId: row.assigneeId,
          dueAt: row.dueAt?.toISOString() ?? null,
        },
      });
      if (row.assigneeId !== context.userId) {
        await transaction.notification.create({
          data: {
            userId: row.assigneeId,
            type: "TASK_ASSIGNED",
            title: "Task assigned",
            message: row.title,
            link: "/en/tasks",
            entityType: "Task",
            entityId: row.id,
            dedupeKey: `TASK_ASSIGNED:${row.id}:${row.assigneeId}`,
          },
        });
      }
      return row;
    });
  }

  updateTask(
    context: AuthorizationContext,
    id: string,
    input: TaskUpdateInput,
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const current = await transaction.task.findFirst({
        where: { id, deletedAt: null, ...taskScope(context) },
      });
      if (!current) {
        throw new DomainError("TASK_NOT_FOUND", "Task not found", 404);
      }
      if (current.version !== input.expectedVersion) {
        throw new DomainError(
          "TASK_CONFLICT",
          "Task changed; refresh and retry",
          409,
        );
      }
      if (input.status && input.status !== current.status) {
        assertTaskTransition(
          current.status as TaskWorkflowStatus,
          input.status,
        );
      }
      await assertTaskAssignee(
        transaction,
        input.assigneeId ?? current.assigneeId,
        input.teamCode === undefined ? current.teamCode : input.teamCode,
      );
      const { expectedVersion: _, ...changes } = input;
      void _;
      const changed = await transaction.task.updateMany({
        where: { id, version: current.version, deletedAt: null },
        data: {
          ...changes,
          completedAt:
            changes.status === "COMPLETED" ? new Date() : undefined,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1) {
        throw new DomainError(
          "TASK_CONFLICT",
          "Task changed; refresh and retry",
          409,
        );
      }
      const updated = await transaction.task.findUniqueOrThrow({ where: { id } });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "task.update",
        entityType: "Task",
        entityId: id,
        before: { status: current.status, version: current.version },
        after: { status: updated.status, version: updated.version },
      });
      return { ...updated, overdue: isTaskOverdue(updated) };
    });
  }

  listTaskAssignees() {
    return getPrisma().user.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        roles: {
          where: { role: { deletedAt: null } },
          select: { role: { select: { code: true } } },
        },
      },
    });
  }

  async listNotifications(context: AuthorizationContext) {
    const prisma = getPrisma();
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: context.userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.notification.count({
        where: { userId: context.userId, readAt: null },
      }),
    ]);
    return { items, unreadCount };
  }

  markNotificationsRead(context: AuthorizationContext, ids?: string[]) {
    return getPrisma().notification.updateMany({
      where: {
        userId: context.userId,
        readAt: null,
        ...(ids?.length ? { id: { in: ids } } : {}),
      },
      data: { readAt: new Date() },
    });
  }

  async report(
    context: AuthorizationContext,
    input: {
      type: string;
      from?: Date;
      to?: Date;
      ownerId?: string;
    },
  ) {
    assertReportAccess(context, input.type);
    const scope = reportScope(context);
    const prisma = getPrisma();
    const createdAt = input.from || input.to
      ? {
          ...(input.from ? { gte: input.from } : {}),
          ...(input.to ? { lt: input.to } : {}),
        }
      : undefined;

    if (["suppliers", "purchasing"].includes(input.type)) {
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: { deletedAt: null, ...(createdAt ? { createdAt } : {}) },
        include: {
          supplier: { select: { name: true, countryCode: true } },
          buyer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      let rows: Array<Record<string, string | number>>;
      if (input.type === "purchasing") {
        rows = purchaseOrders.map((row) => ({
          purchaseOrder: row.purchaseOrderNumber,
          supplier: row.supplier.name,
          market: row.supplier.countryCode,
          buyer: row.buyer.name,
          status: row.status,
          totalUsd: row.totalUsd.toFixed(4),
          expectedAt: row.expectedAt?.toISOString() ?? "",
          receivedAt: row.receivedAt?.toISOString() ?? "",
        }));
      } else {
        const suppliers = new Map<string, { supplier: string; purchaseOrders: number; purchasedUsd: Decimal }>();
        for (const order of purchaseOrders) {
          const current = suppliers.get(order.supplier.name) ?? {
            supplier: order.supplier.name,
            purchaseOrders: 0,
            purchasedUsd: new Decimal(0),
          };
          current.purchaseOrders += 1;
          current.purchasedUsd = current.purchasedUsd.plus(order.totalUsd.toString());
          suppliers.set(order.supplier.name, current);
        }
        rows = [...suppliers.values()].map((row) => ({
          supplier: row.supplier,
          purchaseOrders: row.purchaseOrders,
          purchasedUsd: row.purchasedUsd.toFixed(4),
        }));
      }
      return { type: input.type, generatedAt: new Date(), totals: null, rows };
    }
    if (input.type === "logistics") {
      const shipments = await prisma.shipment.findMany({
        where: { deletedAt: null, ...(createdAt ? { createdAt } : {}) },
        include: {
          salesOrder: { select: { orderNumber: true } },
          coordinator: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return {
        type: input.type,
        generatedAt: new Date(),
        totals: null,
        rows: shipments.map((row) => ({
          shipment: row.shipmentNumber,
          order: row.salesOrder.orderNumber,
          coordinator: row.coordinator.name,
          method: row.method,
          carrier: row.carrier ?? "",
          status: row.status,
          trackingNumber: row.trackingNumber ?? "",
          estimatedArrivalAt: row.estimatedArrivalAt?.toISOString() ?? "",
          deliveredAt: row.deliveredAt?.toISOString() ?? "",
        })),
      };
    }
    if (input.type === "after-sales") {
      const tickets = await prisma.afterSalesTicket.findMany({
        where: { deletedAt: null, ...(createdAt ? { createdAt } : {}) },
        include: {
          customer: { select: { companyName: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return {
        type: input.type,
        generatedAt: new Date(),
        totals: null,
        rows: tickets.map((row) => ({
          ticket: row.ticketNumber,
          customer: row.customer.companyName,
          issueType: row.issueType,
          priority: row.priority,
          status: row.status,
          assignee: row.assignedTo?.name ?? "",
          cost: row.costAmount?.toFixed(4) ?? "0.0000",
          currency: row.costCurrencyCode ?? "",
          closedAt: row.closedAt?.toISOString() ?? "",
        })),
      };
    }
    if (input.type === "conversion") {
      const where = { deletedAt: null, ...(createdAt ? { createdAt } : {}) };
      const [
        leads,
        convertedLeads,
        opportunities,
        wonOpportunities,
        quotes,
        acceptedQuotes,
        orders,
      ] = await Promise.all([
        prisma.lead.count({ where }),
        prisma.lead.count({ where: { ...where, status: "CONVERTED" } }),
        prisma.opportunity.count({ where }),
        prisma.opportunity.count({ where: { ...where, stage: "WON" } }),
        prisma.quote.count({ where }),
        prisma.quote.count({ where: { ...where, status: { in: ["ACCEPTED", "CONVERTED"] } } }),
        prisma.salesOrder.count({ where }),
      ]);
      const percent = (part: number, total: number) =>
        total ? new Decimal(part).div(total).times(100).toFixed(2) : "0.00";
      return {
        type: input.type,
        generatedAt: new Date(),
        totals: null,
        rows: [{
          leads,
          convertedLeads,
          leadConversionPercent: percent(convertedLeads, leads),
          opportunities,
          wonOpportunities,
          opportunityWinPercent: percent(wonOpportunities, opportunities),
          quotes,
          acceptedQuotes,
          quoteAcceptancePercent: percent(acceptedQuotes, quotes),
          orders,
        }],
      };
    }
    const rows = await prisma.salesOrder.findMany({
      where: {
        deletedAt: null,
        ...scope,
        ...(input.ownerId && !("ownerId" in scope)
          ? { ownerId: input.ownerId }
          : {}),
        ...(input.from || input.to
          ? {
              createdAt: {
                ...(input.from ? { gte: input.from } : {}),
                ...(input.to ? { lt: input.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { companyName: true, countryCode: true } },
        owner: { select: { name: true } },
        payments: {
          where: { status: "CONFIRMED", deletedAt: null },
          select: { amountUsd: true },
        },
        refunds: {
          where: { refundedAt: { not: null }, deletedAt: null },
          select: { amountUsd: true },
        },
        costs: {
          where: { deletedAt: null },
          select: { amountUsd: true },
        },
        items: {
          select: {
            quantity: true,
            lineTotal: true,
            description: true,
            product: { select: { sku: true, name: true } },
          },
        },
      },
    });
    const reportRows = buildReportRows(
      rows.map((row) => ({
        orderNumber: row.orderNumber,
        customer: row.customer.companyName,
        owner: row.owner.name,
        market: row.customer.countryCode,
        totalUsd: row.totalUsd.toString(),
        collectedUsd: row.payments
          .reduce(
            (sum, payment) => sum.plus(payment.amountUsd.toString()),
            new Decimal(0),
          )
          .minus(
            row.refunds.reduce(
              (sum, refund) => sum.plus(refund.amountUsd.toString()),
              new Decimal(0),
            ),
          )
          .toString(),
        costUsd: new Decimal(row.actualCostUsd.toString())
          .plus(
            row.costs.reduce(
              (sum, cost) => sum.plus(cost.amountUsd.toString()),
              new Decimal(0),
            ),
          )
          .toString(),
      })),
      context,
    );
    let rowsForExport: Array<Record<string, string | number>> = reportRows.map(
      (row) => ({ ...row }),
    );
    if (input.type === "customers") {
      rowsForExport = groupReportRows(reportRows, "customer");
    } else if (input.type === "markets") {
      rowsForExport = groupReportRows(reportRows, "market");
    } else if (input.type === "representatives") {
      rowsForExport = groupReportRows(reportRows, "owner");
    } else if (input.type === "products") {
      const products = new Map<
        string,
        { product: string; units: number; salesUsd: Decimal }
      >();
      for (const order of rows) {
        for (const item of order.items) {
          const product =
            item.product
              ? `${item.product.sku} · ${item.product.name}`
              : item.description;
          const current = products.get(product) ?? {
            product,
            units: 0,
            salesUsd: new Decimal(0),
          };
          current.units += item.quantity;
          current.salesUsd = current.salesUsd.plus(
            new Decimal(item.lineTotal.toString()).times(
              order.exchangeRateToUsd.toString(),
            ),
          );
          products.set(product, current);
        }
      }
      rowsForExport = [...products.values()].map((row) => ({
        product: row.product,
        units: row.units,
        salesUsd: row.salesUsd.toFixed(4),
      }));
    }
    return {
      type: input.type,
      generatedAt: new Date(),
      totals: reportRows.reduce(
        (totals, row) => ({
          salesUsd: totals.salesUsd.plus(row.salesUsd),
          collectionUsd: totals.collectionUsd.plus(row.collectionUsd),
          receivableUsd: totals.receivableUsd.plus(row.receivableUsd),
        }),
        {
          salesUsd: new Decimal(0),
          collectionUsd: new Decimal(0),
          receivableUsd: new Decimal(0),
        },
      ),
      rows: rowsForExport,
    };
  }

  async listSettings(_context: AuthorizationContext) {
    void _context;
    const rows = await getPrisma().setting.findMany({
      orderBy: [{ namespace: "asc" }, { key: "asc" }],
    });
    return rows.map((row) => ({
      ...row,
      value: redactSettingValue(row.value, row.isSecret),
    }));
  }

  updateSetting(context: AuthorizationContext, input: SettingInput) {
    return getPrisma().$transaction(async (transaction) => {
      const current = await transaction.setting.findUnique({
        where: {
          namespace_key: { namespace: input.namespace, key: input.key },
        },
      });
      if (
        current &&
        input.expectedVersion &&
        current.version !== input.expectedVersion
      ) {
        throw new DomainError(
          "SETTING_CONFLICT",
          "Setting changed; refresh and retry",
          409,
        );
      }
      const value =
        current &&
        current.value !== null &&
        typeof current.value === "object" &&
        !Array.isArray(current.value)
          ? preserveMaskedValues(
              input.value,
              current.value as Record<string, unknown>,
              input.isSecret ?? current.isSecret,
            )
          : input.value;
      const row = await transaction.setting.upsert({
        where: {
          namespace_key: { namespace: input.namespace, key: input.key },
        },
        update: {
          value: value as Prisma.InputJsonValue,
          isSecret: input.isSecret,
          version: { increment: 1 },
        },
        create: {
          namespace: input.namespace,
          key: input.key,
          value: value as Prisma.InputJsonValue,
          isSecret: input.isSecret ?? false,
        },
      });
      if (input.namespace === "currency") {
        const value = input.value as {
          rateToUsd: number;
          effectiveAt?: string;
        };
        const currency = await transaction.currency.findUnique({
          where: { code: input.key.toUpperCase() },
        });
        if (!currency) {
          throw new DomainError(
            "CURRENCY_NOT_FOUND",
            "Currency must be created before adding a manual rate",
            409,
          );
        }
        await transaction.exchangeRate.upsert({
          where: {
            currencyCode_effectiveAt: {
              currencyCode: currency.code,
              effectiveAt: value.effectiveAt
                ? new Date(value.effectiveAt)
                : new Date(),
            },
          },
          update: {
            rateToUsd: value.rateToUsd,
            source: "MANUAL",
            createdById: context.userId,
          },
          create: {
            currencyCode: currency.code,
            rateToUsd: value.rateToUsd,
            effectiveAt: value.effectiveAt
              ? new Date(value.effectiveAt)
              : new Date(),
            source: "MANUAL",
            createdById: context.userId,
          },
        });
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "settings.update",
        entityType: "Setting",
        entityId: row.id,
        before: current
          ? (redactSettingValue(current.value, current.isSecret) as Prisma.InputJsonValue)
          : undefined,
        after: redactSettingValue(row.value, row.isSecret) as Prisma.InputJsonValue,
        metadata: { namespace: row.namespace, key: row.key, isSecret: row.isSecret },
      });
      return { ...row, value: redactSettingValue(row.value, row.isSecret) };
    });
  }

  async listActivityLogs(filters: {
    actorId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    from?: Date;
    to?: Date;
  }) {
    const rows = await getPrisma().auditLog.findMany({
      where: {
        ...(filters.actorId ? { actorId: filters.actorId } : {}),
        ...(filters.action
          ? { action: { contains: filters.action, mode: "insensitive" } }
          : {}),
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
        ...(filters.entityId ? { entityId: filters.entityId } : {}),
        ...(filters.from || filters.to
          ? {
              createdAt: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 250,
      include: { actor: { select: { id: true, name: true, email: true } } },
    });
    return rows.map((row) => {
      const metadata = redactSensitiveValues(row.metadata);
      const isSecretSetting = Boolean(
        row.entityType === "Setting" &&
        row.metadata &&
        typeof row.metadata === "object" &&
        !Array.isArray(row.metadata) &&
        (row.metadata as Record<string, unknown>).isSecret === true,
      );
      return {
        ...row,
        before: redactSettingValue(row.before, isSecretSetting),
        after: redactSettingValue(row.after, isSecretSetting),
        metadata,
      };
    });
  }
}
