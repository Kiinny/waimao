import Decimal from "decimal.js";

import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors";
import { getPrisma } from "@/lib/prisma";
import { calculateQuoteVersion } from "@/modules/quotes/quote-domain";
import type {
  QuoteVersionChanges,
  QuoteVersionRepository,
} from "@/modules/quotes/quote-service";
import { assertQuoteVersionMutable } from "@/modules/quotes/quote-service";

export function createPrismaQuoteVersionRepository(): QuoteVersionRepository {
  return {
    async findVersionState(versionId) {
      const version = await getPrisma().quoteVersion.findUnique({
        where: { id: versionId },
        select: {
          id: true,
          immutableAt: true,
          quote: { select: { status: true, ownerId: true } },
        },
      });
      if (!version) return null;
      return {
        id: version.id,
        immutableAt: version.immutableAt,
        quoteStatus: version.quote.status,
        quoteOwnerId: version.quote.ownerId,
      };
    },
    updateVersion(versionId, changes: QuoteVersionChanges) {
      return getPrisma().$transaction(async (transaction) => {
        const current = await transaction.quoteVersion.findUnique({
          where: { id: versionId },
          include: {
            items: true,
            quote: { select: { status: true, ownerId: true } },
          },
        });
        if (!current) {
          throw new DomainError(
            "QUOTE_VERSION_NOT_FOUND",
            "Quote version not found",
            404,
          );
        }
        assertQuoteVersionMutable({
          id: current.id,
          immutableAt: current.immutableAt,
          quoteStatus: current.quote.status,
          quoteOwnerId: current.quote.ownerId,
        });

        const claimed = await transaction.quoteVersion.updateMany({
          where: {
            id: versionId,
            immutableAt: null,
            quote: {
              status: {
                notIn: [
                  "SENT",
                  "VIEWED",
                  "ACCEPTED",
                  "REJECTED",
                  "EXPIRED",
                  "CONVERTED",
                ],
              },
            },
          },
          data: { remarks: current.remarks },
        });
        if (claimed.count !== 1) {
          throw new DomainError(
            "QUOTE_IMMUTABLE",
            "Sent quotation versions cannot be changed",
            409,
          );
        }

        const changedItems = changes.items;
        const resolvedItems = changedItems
          ? await resolveChangedItems(transaction, changedItems)
          : current.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              configuration: item.configuration,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toString(),
              discount: item.discount.toString(),
              estimatedUnitCostUsd: item.estimatedCostUsd
                ? new Decimal(item.estimatedCostUsd.toString())
                    .div(item.quantity)
                    .toString()
                : "0",
            }));
        const totals = calculateQuoteVersion({
          exchangeRateToUsd:
            changes.exchangeRateToUsd ?? current.exchangeRateToUsd.toString(),
          shipping: changes.shipping ?? current.shipping.toString(),
          insurance: changes.insurance ?? current.insurance.toString(),
          tax: changes.tax ?? current.tax.toString(),
          bankFees: changes.bankFees ?? current.bankFees.toString(),
          items: resolvedItems.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            estimatedUnitCostUsd: item.estimatedUnitCostUsd,
          })),
        });

        return transaction.quoteVersion.update({
          where: { id: versionId },
          data: {
            currencyCode: changes.currencyCode,
            exchangeRateToUsd: changes.exchangeRateToUsd,
            shipping: changes.shipping,
            insurance: changes.insurance,
            tax: changes.tax,
            bankFees: changes.bankFees,
            incoterm: changes.incoterm,
            paymentTerms: changes.paymentTerms,
            deliveryTerms: changes.deliveryTerms,
            warrantyTerms: changes.warrantyTerms,
            remarks: changes.remarks,
            subtotal: totals.subtotal,
            total: totals.total,
            totalUsd: totals.totalUsd,
            estimatedCostUsd: totals.estimatedCostUsd,
            estimatedProfitUsd: totals.estimatedProfitUsd,
            estimatedMarginPercent: totals.estimatedMarginPercent,
            ...(changedItems
              ? {
                  items: {
                    deleteMany: {},
                    create: resolvedItems.map((item, index) => ({
                      productId: item.productId,
                      description: item.description,
                      configuration: item.configuration ?? undefined,
                      quantity: item.quantity,
                      unitPrice: item.unitPrice,
                      discount: item.discount,
                      lineTotal: totals.items[index].lineTotal,
                      estimatedCostUsd: totals.items[index].estimatedCostUsd,
                    })),
                  },
                }
              : {}),
          },
          include: { items: true },
        });
      });
    },
  };
}

async function resolveChangedItems(
  transaction: Prisma.TransactionClient,
  items: NonNullable<QuoteVersionChanges["items"]>,
) {
  const variants = await transaction.productVariant.findMany({
    where: {
      id: { in: items.map(({ variantId }) => variantId) },
      deletedAt: null,
      product: { deletedAt: null },
    },
    include: {
      product: { include: { category: { select: { name: true } } } },
    },
  });
  const byId = new Map(variants.map((variant) => [variant.id, variant]));
  return items.map((item) => {
    const variant = byId.get(item.variantId);
    if (!variant || variant.productId !== item.productId) {
      throw new DomainError(
        "PRODUCT_CONFIGURATION_NOT_FOUND",
        "Selected product configuration was not found",
        404,
      );
    }
    return {
      productId: variant.productId,
      description:
        item.description ?? `${variant.product.name} / ${variant.name}`,
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
      estimatedUnitCostUsd:
        variant.currencyCode === "USD" ? variant.cost?.toString() ?? "0" : "0",
    };
  });
}
