import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { currentAuthorizationContext } from "@/lib/current-user";
import { AuthorizationError, DomainError } from "@/lib/errors";
import { failure, success } from "@/lib/http";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { authorizePurchaseTransition } from "@/modules/orders/purchase-gate";

const requestSchema = z.object({
  overrideReason: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await currentAuthorizationContext();
    requirePermission(context, "purchase.create");
    const { id } = await params;
    const input = requestSchema.parse(await request.json());

    const order = await getPrisma().$transaction(async (transaction) => {
      const current = await transaction.salesOrder.findFirst({
        where: { id, deletedAt: null },
        include: {
          payments: {
            where: { status: "CONFIRMED", deletedAt: null },
            select: { amountUsd: true },
          },
          refunds: {
            where: { refundedAt: { not: null }, deletedAt: null },
            select: { amountUsd: true },
          },
        },
      });
      if (!current) {
        throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
      }
      if (current.status !== "CONFIRMED") {
        throw new DomainError(
          "INVALID_ORDER_TRANSITION",
          "Only confirmed orders can enter purchasing",
          409,
        );
      }

      if (
        input.overrideReason !== undefined &&
        !context.permissions.includes("*")
      ) {
        throw new AuthorizationError("order.purchase.override");
      }

      const gate = authorizePurchaseTransition(
        {
          paymentTerms: current.paymentTerms,
          orderTotalUsd: current.totalUsd.toString(),
          confirmedPaymentsUsd: current.payments.map(({ amountUsd }) =>
            amountUsd.toString(),
          ),
          confirmedRefundsUsd: current.refunds.map(({ amountUsd }) =>
            amountUsd.toString(),
          ),
        },
        input.overrideReason === undefined
          ? undefined
          : { actorId: context.userId, reason: input.overrideReason },
      );

      if (!gate.overridden) {
        return transaction.salesOrder.update({
          where: { id },
          data: {
            status: "PURCHASING",
            purchaseStatus: "PURCHASING",
            purchaseEligibilityFlag: true,
            version: { increment: 1 },
          },
          select: { id: true, orderNumber: true, status: true, version: true },
        });
      }

      const audit = await writeAudit(transaction, {
        actorId: context.userId,
        action: "sales_order.purchase_override",
        entityType: "SalesOrder",
        entityId: id,
        metadata: {
          reason: gate.override.reason,
          requiredUsd: current.totalUsd.toString(),
          netPaidUsd: gate.netPaidUsd,
        },
      });
      return transaction.salesOrder.update({
        where: { id },
        data: {
          status: "PURCHASING",
          purchaseStatus: "PURCHASING_OVERRIDE",
          purchaseEligibilityFlag: true,
          version: { increment: 1 },
          purchaseOverrideActorId: gate.override.actorId,
          purchaseOverrideReason: gate.override.reason,
          purchaseOverrideAuditId: (audit as { id: string }).id,
          purchaseOverriddenAt: new Date(),
        },
        select: { id: true, orderNumber: true, status: true, version: true },
      });
    });

    return success(order);
  } catch (error) {
    return failure(error);
  }
}
