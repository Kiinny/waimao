import Decimal from "decimal.js";

import type { Prisma } from "@/generated/prisma/client";
import { writeAudit } from "@/lib/audit";
import { DomainError } from "@/lib/errors";
import { getPrisma } from "@/lib/prisma";
import type { AuthorizationContext } from "@/lib/rbac";
import { hasGlobalOwnershipScope } from "@/lib/rbac";
import { redactFinancialFields } from "@/modules/finance/field-redaction";
import { calculateOrderFinancials } from "@/modules/finance/order-financials";
import { presentOrderDetail } from "@/modules/finance/order-presentation";
import { assertOrderTransition } from "@/modules/orders/order-domain";
import {
  calculatePaymentCoverage,
  isFullPaymentCovered,
  validateRefund,
} from "@/modules/payments/payment-domain";
import {
  assertQuoteTransition,
  calculateQuoteVersion,
  nextQuoteRevision,
} from "@/modules/quotes/quote-domain";
import type {
  TransactionQuote,
  TransactionRepository,
} from "@/modules/transactions/transaction-service";
import { transactionOrderWhere } from "@/modules/transactions/transaction-scope";

export interface ProductWriteInput {
  sku: string;
  name: string;
  description?: string | null;
  categoryId: string;
  brand?: string | null;
  model?: string | null;
  condition: string;
  baseModel?: string | null;
  specifications?: Prisma.InputJsonValue;
  referencePrice?: string | null;
  referenceCurrencyCode?: string | null;
  dimensions?: Prisma.InputJsonValue;
  hsCode?: string | null;
  exportControlRisk: string;
  media?: Prisma.InputJsonValue;
  availability: string;
  serialized?: boolean;
  variants: Array<{
    sku: string;
    name: string;
    configurationVersion: number;
    configuration: Prisma.InputJsonValue;
    specifications?: Prisma.InputJsonValue;
    cost?: string | null;
    currencyCode?: string | null;
  }>;
}

export interface QuoteWriteInput {
  customerId: string;
  opportunityId?: string | null;
  validUntil?: Date | null;
  currencyCode: string;
  exchangeRateToUsd: string;
  shipping?: string;
  insurance?: string;
  tax?: string;
  bankFees?: string;
  incoterm?: string | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  warrantyTerms?: string | null;
  remarks?: string | null;
  items: Array<{
    productId: string;
    variantId: string;
    description?: string;
    quantity: number;
    unitPrice: string;
    discount?: string;
  }>;
}

function ownerWhere(context: AuthorizationContext) {
  return hasGlobalOwnershipScope(context) ? {} : { ownerId: context.userId };
}

async function nextNumber(
  transaction: Prisma.TransactionClient,
  key: string,
) {
  const sequence = await transaction.sequence.update({
    where: { key },
    data: { nextValue: { increment: 1 }, version: { increment: 1 } },
  });
  return `${sequence.prefix}-${(sequence.nextValue - BigInt(1))
    .toString()
    .padStart(sequence.padding, "0")}`;
}

export class PrismaTransactionsRepository implements TransactionRepository {
  listProducts(context: AuthorizationContext) {
    return getPrisma().product.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        variants: {
          where: { deletedAt: null },
          orderBy: { configurationVersion: "asc" },
        },
      },
    }).then((rows) => redactFinancialFields(rows, context));
  }

  getProduct(context: AuthorizationContext, id: string) {
    return getPrisma().product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        variants: {
          where: { deletedAt: null },
          orderBy: { configurationVersion: "asc" },
        },
      },
    }).then((row) => (row ? redactFinancialFields(row, context) : null));
  }

  createProduct(context: AuthorizationContext, input: ProductWriteInput) {
    return getPrisma().$transaction(async (transaction) => {
      const product = await transaction.product.create({
        data: {
          ...input,
          variants: { create: input.variants },
        },
        include: { category: true, variants: true },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "product.create",
        entityType: "Product",
        entityId: product.id,
        after: { id: product.id, sku: product.sku },
      });
      return redactFinancialFields(product, context);
    });
  }

  async updateProduct(
    context: AuthorizationContext,
    id: string,
    input: Partial<Omit<ProductWriteInput, "variants">>,
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const current = await transaction.product.findFirst({
        where: { id, deletedAt: null },
      });
      if (!current) {
        throw new DomainError("PRODUCT_NOT_FOUND", "Product not found", 404);
      }
      const product = await transaction.product.update({
        where: { id },
        data: { ...input, version: { increment: 1 } },
        include: { category: true, variants: { where: { deletedAt: null } } },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "product.update",
        entityType: "Product",
        entityId: id,
        before: { version: current.version },
        after: { version: product.version },
      });
      return redactFinancialFields(product, context);
    });
  }

  async createQuote(context: AuthorizationContext, input: QuoteWriteInput) {
    return getPrisma().$transaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        where: {
          id: input.customerId,
          deletedAt: null,
          ...ownerWhere(context),
        },
        select: { id: true },
      });
      if (!customer) {
        throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
      }
      if (input.opportunityId) {
        const opportunity = await transaction.opportunity.findFirst({
          where: {
            id: input.opportunityId,
            customerId: input.customerId,
            deletedAt: null,
            ...ownerWhere(context),
          },
          select: { id: true },
        });
        if (!opportunity) {
          throw new DomainError(
            "OPPORTUNITY_NOT_FOUND",
            "Opportunity was not found for this customer",
            404,
          );
        }
      }
      const variants = await transaction.productVariant.findMany({
        where: {
          id: { in: input.items.map(({ variantId }) => variantId) },
          deletedAt: null,
          product: { deletedAt: null },
        },
        include: {
          product: { include: { category: { select: { name: true } } } },
        },
      });
      const byId = new Map(variants.map((variant) => [variant.id, variant]));
      const resolved = input.items.map((item) => {
        const variant = byId.get(item.variantId);
        if (!variant || variant.productId !== item.productId) {
          throw new DomainError(
            "PRODUCT_CONFIGURATION_NOT_FOUND",
            "Selected product configuration was not found",
            404,
          );
        }
        return { item, variant };
      });
      const totals = calculateQuoteVersion({
        exchangeRateToUsd: input.exchangeRateToUsd,
        shipping: input.shipping,
        insurance: input.insurance,
        tax: input.tax,
        bankFees: input.bankFees,
        items: resolved.map(({ item, variant }) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          estimatedUnitCostUsd:
            variant.currencyCode === "USD" ? variant.cost?.toString() : "0",
        })),
      });
      const quoteNumber = await nextNumber(transaction, "quote");
      const quote = await transaction.quote.create({
        data: {
          quoteNumber,
          customerId: input.customerId,
          opportunityId: input.opportunityId,
          ownerId: context.userId,
          validUntil: input.validUntil,
          versions: {
            create: {
              number: 1,
              currencyCode: input.currencyCode,
              exchangeRateToUsd: input.exchangeRateToUsd,
              subtotal: totals.subtotal,
              shipping: input.shipping ?? "0",
              insurance: input.insurance ?? "0",
              tax: input.tax ?? "0",
              bankFees: input.bankFees ?? "0",
              total: totals.total,
              totalUsd: totals.totalUsd,
              estimatedCostUsd: totals.estimatedCostUsd,
              estimatedProfitUsd: totals.estimatedProfitUsd,
              estimatedMarginPercent: totals.estimatedMarginPercent,
              incoterm: input.incoterm,
              paymentTerms: input.paymentTerms,
              deliveryTerms: input.deliveryTerms,
              warrantyTerms: input.warrantyTerms,
              remarks: input.remarks,
              items: {
                create: resolved.map(({ item, variant }, index) => ({
                  productId: variant.productId,
                  description:
                    item.description ??
                    `${variant.product.name} / ${variant.name}`,
                  configuration: {
                    variantId: variant.id,
                    sku: variant.sku,
                    configurationVersion: variant.configurationVersion,
                    configuration: variant.configuration,
                    specifications: {
                      ...(variant.product.specifications as object | null),
                      ...(variant.specifications as object | null),
                    },
                    category: variant.product.category.name,
                    condition: variant.product.condition,
                    baseModel: variant.product.baseModel,
                    dimensions: variant.product.dimensions,
                    hsCode: variant.product.hsCode,
                    exportControlRisk: variant.product.exportControlRisk,
                    media: variant.product.media,
                    availability: variant.product.availability,
                  },
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discount: item.discount ?? "0",
                  lineTotal: totals.items[index].lineTotal,
                  estimatedCostUsd: totals.items[index].estimatedCostUsd,
                })),
              },
            },
          },
        },
        include: { versions: { include: { items: true } } },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "quote.create",
        entityType: "Quote",
        entityId: quote.id,
        after: { quoteNumber, currentVersion: 1 },
      });
      return redactFinancialFields(quote, context);
    });
  }

  listQuotes(context: AuthorizationContext) {
    return getPrisma().quote.findMany({
      where: { deletedAt: null, ...ownerWhere(context) },
      orderBy: { updatedAt: "desc" },
      include: {
        customer: { select: { id: true, companyName: true } },
        owner: { select: { id: true, name: true } },
        versions: {
          orderBy: { number: "desc" },
          take: 1,
        },
      },
    }).then((rows) => redactFinancialFields(rows, context));
  }

  async getQuote(context: AuthorizationContext, id: string) {
    const quote = await getPrisma().quote.findFirst({
      where: { id, deletedAt: null, ...ownerWhere(context) },
      include: {
        customer: true,
        owner: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
        versions: {
          orderBy: { number: "desc" },
          include: { items: true },
        },
        order: { select: { id: true, orderNumber: true, status: true } },
      },
    });
    return quote ? redactFinancialFields(quote, context) : null;
  }

  async findQuote(
    context: AuthorizationContext,
    quoteId: string,
  ): Promise<TransactionQuote | null> {
    const quote = await getPrisma().quote.findFirst({
      where: { id: quoteId, deletedAt: null, ...ownerWhere(context) },
      include: {
        order: { select: { id: true } },
      },
    });
    if (!quote) return null;
    const current = await getPrisma().quoteVersion.findUnique({
      where: {
        quoteId_number: { quoteId: quote.id, number: quote.currentVersion },
      },
      include: { items: true },
    });
    if (!current) {
      throw new DomainError(
        "QUOTE_VERSION_NOT_FOUND",
        "Current quotation version not found",
        409,
      );
    }
    return {
      id: quote.id,
      ownerId: quote.ownerId,
      status: quote.status,
      currentVersion: quote.currentVersion,
      orderId: quote.order?.id ?? null,
      current: {
        ...current,
        exchangeRateToUsd: current.exchangeRateToUsd.toString(),
        shipping: current.shipping.toString(),
        insurance: current.insurance.toString(),
        tax: current.tax.toString(),
        bankFees: current.bankFees.toString(),
        subtotal: current.subtotal.toString(),
        total: current.total.toString(),
        totalUsd: current.totalUsd.toString(),
        estimatedCostUsd: current.estimatedCostUsd.toString(),
        estimatedProfitUsd: current.estimatedProfitUsd.toString(),
        estimatedMarginPercent: current.estimatedMarginPercent.toString(),
        items: current.items.map((item) => ({
          ...item,
          unitPrice: item.unitPrice.toString(),
          discount: item.discount.toString(),
          lineTotal: item.lineTotal.toString(),
          estimatedCostUsd: item.estimatedCostUsd?.toString() ?? null,
        })),
      },
    };
  }

  transitionQuote(
    context: AuthorizationContext,
    quote: TransactionQuote,
    status: string,
    note?: string,
  ) {
    assertQuoteTransition(quote.status, status);
    return getPrisma().$transaction(async (transaction) => {
      const changed = await transaction.quote.updateMany({
        where: {
          id: quote.id,
          status:
            quote.status as Prisma.EnumQuoteStatusFieldUpdateOperationsInput["set"],
        },
        data: {
          status: status as Prisma.EnumQuoteStatusFieldUpdateOperationsInput["set"],
          version: { increment: 1 },
          ...(status === "APPROVED"
            ? {
                approvedById: context.userId,
                approvedAt: new Date(),
                approvalNote: note,
              }
            : {}),
        },
      });
      if (changed.count !== 1) {
        throw new DomainError(
          "QUOTE_TRANSITION_CONFLICT",
          "Quotation changed; refresh and retry",
          409,
        );
      }
      if (status === "SENT") {
        await transaction.quoteVersion.update({
          where: {
            quoteId_number: {
              quoteId: quote.id,
              number: quote.currentVersion,
            },
          },
          data: { immutableAt: new Date() },
        });
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action:
          status === "APPROVED" ? "quote.approve" : "quote.status_change",
        entityType: "Quote",
        entityId: quote.id,
        before: { status: quote.status },
        after: { status, note },
      });
      return transaction.quote.findUniqueOrThrow({ where: { id: quote.id } });
    });
  }

  createRevision(
    context: AuthorizationContext,
    quote: TransactionQuote,
    revision: ReturnType<typeof nextQuoteRevision>,
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const source = await transaction.quoteVersion.findUniqueOrThrow({
        where: { id: revision.sourceVersionId },
        include: { items: true },
      });
      const changed = await transaction.quote.updateMany({
        where: {
          id: quote.id,
          currentVersion: quote.currentVersion,
          status:
            quote.status as Prisma.EnumQuoteStatusFieldUpdateOperationsInput["set"],
        },
        data: {
          currentVersion: revision.number,
          status: "DRAFT",
          approvedById: null,
          approvedAt: null,
          approvalNote: null,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1) {
        throw new DomainError(
          "QUOTE_REVISION_CONFLICT",
          "Quotation changed; refresh and retry",
          409,
        );
      }
      const created = await transaction.quoteVersion.create({
        data: {
          quoteId: quote.id,
          sourceVersionId: source.id,
          number: revision.number,
          currencyCode: source.currencyCode,
          exchangeRateToUsd: source.exchangeRateToUsd,
          subtotal: source.subtotal,
          shipping: source.shipping,
          insurance: source.insurance,
          tax: source.tax,
          bankFees: source.bankFees,
          total: source.total,
          totalUsd: source.totalUsd,
          estimatedCostUsd: source.estimatedCostUsd,
          estimatedProfitUsd: source.estimatedProfitUsd,
          estimatedMarginPercent: source.estimatedMarginPercent,
          incoterm: source.incoterm,
          paymentTerms: source.paymentTerms,
          deliveryTerms: source.deliveryTerms,
          warrantyTerms: source.warrantyTerms,
          remarks: source.remarks,
          items: {
            create: source.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              configuration: item.configuration ?? undefined,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              lineTotal: item.lineTotal,
              estimatedCostUsd: item.estimatedCostUsd,
            })),
          },
        },
        include: { items: true },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "quote.revise",
        entityType: "Quote",
        entityId: quote.id,
        metadata: {
          sourceVersionId: source.id,
          revisionVersionId: created.id,
          number: created.number,
        },
      });
      return created;
    });
  }

  convertQuote(context: AuthorizationContext, quote: TransactionQuote) {
    return getPrisma().$transaction(async (transaction) => {
      const claimed = await transaction.quote.updateMany({
        where: {
          id: quote.id,
          status: "ACCEPTED",
          currentVersion: quote.currentVersion,
          order: null,
        },
        data: { status: "CONVERTED", version: { increment: 1 } },
      });
      if (claimed.count !== 1) {
        throw new DomainError(
          "QUOTE_ALREADY_CONVERTED",
          "Quotation has already been converted",
          409,
        );
      }
      const source = await transaction.quoteVersion.findUniqueOrThrow({
        where: { id: quote.current.id },
        include: { quote: true, items: true },
      });
      const orderNumber = await nextNumber(transaction, "sales_order");
      const order = await transaction.salesOrder.create({
        data: {
          orderNumber,
          customerId: source.quote.customerId,
          quoteId: quote.id,
          acceptedQuoteVersionId: source.id,
          ownerId: source.quote.ownerId,
          status: "CONFIRMED",
          currencyCode: source.currencyCode,
          exchangeRateToUsd: source.exchangeRateToUsd,
          total: source.total,
          totalUsd: source.totalUsd,
          paymentTerms: source.paymentTerms ?? "",
          revenueUsd: source.totalUsd,
          estimatedCostUsd: source.estimatedCostUsd,
          grossProfitUsd: source.estimatedProfitUsd,
          grossMarginPercent: source.estimatedMarginPercent,
          netProfitEstimateUsd: source.estimatedProfitUsd,
          items: {
            create: source.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              configuration: item.configuration ?? undefined,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: true },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "quote.convert",
        entityType: "Quote",
        entityId: quote.id,
        metadata: {
          quoteVersionId: source.id,
          salesOrderId: order.id,
        },
      });
      return presentOrderDetail(order, context);
    });
  }

  listOrders(context: AuthorizationContext) {
    return getPrisma().salesOrder.findMany({
      where: { deletedAt: null, ...transactionOrderWhere(context) },
      orderBy: { updatedAt: "desc" },
      include: {
        customer: { select: { id: true, companyName: true } },
        owner: { select: { id: true, name: true } },
        payments: { where: { deletedAt: null } },
        refunds: { where: { deletedAt: null } },
      },
    }).then((rows) => rows.map((order) => presentOrderDetail(order, context)));
  }

  async getOrder(context: AuthorizationContext, id: string) {
    const order = await getPrisma().salesOrder.findFirst({
      where: { id, deletedAt: null, ...transactionOrderWhere(context) },
      include: {
        customer: true,
        acceptedQuoteVersion: { include: { items: true } },
        items: true,
        payments: {
          where: { deletedAt: null },
          include: { refunds: { where: { deletedAt: null } } },
        },
        refunds: { where: { deletedAt: null } },
        costs: { where: { deletedAt: null } },
      },
    });
    if (!order) return null;
    const financials = calculateOrderFinancials({
      revenueUsd: order.totalUsd.toString(),
      estimatedCostUsd: order.estimatedCostUsd.toString(),
      actualCostsUsd: order.costs.map(({ amountUsd }) => amountUsd.toString()),
    });
    return presentOrderDetail({ ...order, ...financials }, context);
  }

  async transitionOrder(
    context: AuthorizationContext,
    id: string,
    status: string,
  ) {
    if (status === "PURCHASING") {
      throw new DomainError(
        "PURCHASE_GATE_REQUIRED",
        "Use the payment-gated purchase transition",
        409,
      );
    }
    return getPrisma().$transaction(async (transaction) => {
      const current = await transaction.salesOrder.findFirst({
        where: { id, deletedAt: null, ...transactionOrderWhere(context) },
      });
      if (!current) {
        throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
      }
      assertOrderTransition(current.status, status);
      const changed = await transaction.salesOrder.updateMany({
        where: { id, status: current.status },
        data: {
          status: status as Prisma.EnumOrderStatusFieldUpdateOperationsInput["set"],
          ...(status === "FULFILLING"
            ? {
                purchaseStatus: "COMPLETED",
                inspectionStatus: "PENDING",
                packingStatus: "PENDING",
              }
            : {}),
          ...(status === "SHIPPED"
            ? {
                inspectionStatus: "PASSED",
                packingStatus: "PACKED",
                shipmentStatus: "SHIPPED",
              }
            : {}),
          ...(status === "COMPLETED"
            ? { shipmentStatus: "DELIVERED" }
            : {}),
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1) {
        throw new DomainError(
          "ORDER_TRANSITION_CONFLICT",
          "Sales order changed; refresh and retry",
          409,
        );
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "sales_order.status_change",
        entityType: "SalesOrder",
        entityId: id,
        before: { status: current.status },
        after: { status },
      });
      return transaction.salesOrder.findUniqueOrThrow({ where: { id } });
    });
  }

  async createPayment(
    context: AuthorizationContext,
    input: {
      salesOrderId: string;
      reference?: string | null;
      amount: string;
      currencyCode: string;
      exchangeRateToUsd: string;
      receivedAt?: Date | null;
      proofMetadata?: Prisma.InputJsonValue;
    },
  ) {
    const order = await getPrisma().salesOrder.findFirst({
      where: {
        id: input.salesOrderId,
        deletedAt: null,
        ...transactionOrderWhere(context),
      },
      select: { id: true },
    });
    if (!order) {
      throw new DomainError("ORDER_NOT_FOUND", "Sales order not found", 404);
    }
    const rate = new Decimal(input.exchangeRateToUsd);
    const amount = new Decimal(input.amount);
    if (amount.lte(0) || rate.lte(0)) {
      throw new DomainError(
        "INVALID_PAYMENT_AMOUNT",
        "Payment amount and exchange rate must be greater than zero",
      );
    }
    return getPrisma().$transaction(async (transaction) => {
      const payment = await transaction.payment.create({
        data: {
          ...input,
          amountUsd: amount.times(rate).toFixed(4),
        },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "payment.create",
        entityType: "Payment",
        entityId: payment.id,
        after: {
          salesOrderId: payment.salesOrderId,
          amountUsd: payment.amountUsd.toString(),
          status: payment.status,
        },
      });
      return payment;
    });
  }

  verifyPayment(
    context: AuthorizationContext,
    id: string,
    approved: boolean,
    rejectionReason?: string,
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const payment = await transaction.payment.findFirst({
        where: { id, deletedAt: null },
        include: {
          salesOrder: {
            include: {
              payments: { where: { deletedAt: null } },
              refunds: { where: { deletedAt: null } },
            },
          },
        },
      });
      if (!payment) {
        throw new DomainError("PAYMENT_NOT_FOUND", "Payment not found", 404);
      }
      if (payment.status !== "PENDING") {
        throw new DomainError(
          "PAYMENT_ALREADY_REVIEWED",
          "Payment has already been reviewed",
          409,
        );
      }
      const reason = rejectionReason?.trim();
      if (!approved && !reason) {
        throw new DomainError(
          "PAYMENT_REJECTION_REASON_REQUIRED",
          "Payment rejection requires a reason",
        );
      }
      const updated = await transaction.payment.update({
        where: { id },
        data: {
          status: approved ? "CONFIRMED" : "FAILED",
          verifiedById: context.userId,
          verifiedAt: new Date(),
          rejectionReason: approved ? null : reason,
          version: { increment: 1 },
        },
      });
      const payments = payment.salesOrder.payments.map((item) => ({
        status: item.id === id && approved ? "CONFIRMED" : item.status,
        amountUsd: item.amountUsd.toString(),
      }));
      const coverage = calculatePaymentCoverage({
        payments,
        refunds: payment.salesOrder.refunds.map((refund) => ({
          refundedAt: refund.refundedAt,
          amountUsd: refund.amountUsd.toString(),
        })),
      });
      const netPaid = new Decimal(coverage.netPaidUsd);
      const fullyPaid = isFullPaymentCovered(
        coverage.netPaidUsd,
        payment.salesOrder.totalUsd.toString(),
      );
      const eligible =
        payment.salesOrder.paymentTerms !== "100% T/T Before Purchase" ||
        fullyPaid;
      await transaction.salesOrder.update({
        where: { id: payment.salesOrderId },
        data: {
          paymentStatus: fullyPaid
            ? "PAID"
            : netPaid.isZero()
              ? "UNPAID"
              : "PARTIALLY_PAID",
          purchaseEligibilityFlag: eligible,
          version: { increment: 1 },
        },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: approved ? "payment.verify" : "payment.reject",
        entityType: "Payment",
        entityId: id,
        before: { status: payment.status },
        after: { status: updated.status, rejectionReason: reason },
      });
      return updated;
    });
  }

  refundPayment(
    context: AuthorizationContext,
    paymentId: string,
    input: {
      amount: string;
      currencyCode: string;
      exchangeRateToUsd: string;
      reason: string;
    },
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const payment = await transaction.payment.findFirst({
        where: { id: paymentId, deletedAt: null },
        include: {
          refunds: { where: { refundedAt: { not: null }, deletedAt: null } },
          salesOrder: {
            include: {
              payments: { where: { deletedAt: null } },
              refunds: { where: { deletedAt: null } },
            },
          },
        },
      });
      if (!payment) {
        throw new DomainError("PAYMENT_NOT_FOUND", "Payment not found", 404);
      }
      const amountUsd = new Decimal(input.amount)
        .times(input.exchangeRateToUsd)
        .toFixed(4);
      validateRefund({
        paymentStatus: payment.status,
        paymentAmountUsd: payment.amountUsd.toString(),
        completedRefundsUsd: payment.refunds.map(({ amountUsd: value }) =>
          value.toString(),
        ),
        refundAmountUsd: amountUsd,
      });
      const refund = await transaction.refund.create({
        data: {
          salesOrderId: payment.salesOrderId,
          paymentId,
          amount: input.amount,
          currencyCode: input.currencyCode,
          exchangeRateToUsd: input.exchangeRateToUsd,
          amountUsd,
          reason: input.reason.trim(),
          refundedAt: new Date(),
        },
      });
      const coverage = calculatePaymentCoverage({
        payments: payment.salesOrder.payments.map((item) => ({
          status: item.status,
          amountUsd: item.amountUsd.toString(),
        })),
        refunds: [
          ...payment.salesOrder.refunds.map((item) => ({
            refundedAt: item.refundedAt,
            amountUsd: item.amountUsd.toString(),
          })),
          { refundedAt: refund.refundedAt, amountUsd },
        ],
      });
      const netPaid = new Decimal(coverage.netPaidUsd);
      const fullyPaid = isFullPaymentCovered(
        coverage.netPaidUsd,
        payment.salesOrder.totalUsd.toString(),
      );
      const eligible =
        payment.salesOrder.paymentTerms !== "100% T/T Before Purchase" ||
        fullyPaid;
      const atRisk =
        !eligible &&
        ["PURCHASING", "FULFILLING", "SHIPPED", "COMPLETED"].includes(
          payment.salesOrder.status,
        );
      await transaction.salesOrder.update({
        where: { id: payment.salesOrderId },
        data: {
          paymentStatus: fullyPaid
            ? "PAID"
            : netPaid.isZero()
              ? "REFUNDED"
              : "PARTIALLY_REFUNDED",
          purchaseEligibilityFlag: eligible,
          purchaseStatus: atRisk ? "PAYMENT_AT_RISK" : undefined,
          version: { increment: 1 },
        },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "payment.refund",
        entityType: "Refund",
        entityId: refund.id,
        metadata: {
          paymentId,
          orderId: payment.salesOrderId,
          amountUsd,
          purchaseEligibility: eligible,
          purchasingAtRisk: atRisk,
        },
      });
      return { ...refund, purchaseEligibility: eligible, purchasingAtRisk: atRisk };
    });
  }
}
