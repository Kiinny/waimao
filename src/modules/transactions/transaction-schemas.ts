import { z } from "zod";

const uuid = z.string().uuid();
const money = z
  .string()
  .regex(/^\d+(?:\.\d{1,4})?$/)
  .refine((value) => Number(value) >= 0, "Amount must be nonnegative");
const positiveMoney = money.refine(
  (value) => Number(value) > 0,
  "Amount must be greater than zero",
);
const currencyCode = z.string().trim().length(3).transform((value) => value.toUpperCase());
const jsonObject = z.record(z.string(), z.json());

const variantSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  configurationVersion: z.number().int().positive(),
  configuration: jsonObject,
  specifications: jsonObject.optional(),
  cost: money.nullable().optional(),
  currencyCode: currencyCode.nullable().optional(),
});

export const productSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  categoryId: uuid,
  brand: z.string().max(100).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  condition: z.enum(["NEW", "USED", "REFURBISHED", "OPEN_BOX"]),
  baseModel: z.string().max(200).nullable().optional(),
  specifications: jsonObject.optional(),
  referencePrice: money.nullable().optional(),
  referenceCurrencyCode: currencyCode.nullable().optional(),
  dimensions: jsonObject.optional(),
  hsCode: z.string().max(20).nullable().optional(),
  exportControlRisk: z.enum(["LOW", "REVIEW_REQUIRED", "RESTRICTED"]),
  media: z.array(jsonObject).optional(),
  availability: z.enum([
    "AVAILABLE",
    "IN_STOCK",
    "LIMITED",
    "ON_REQUEST",
    "UNAVAILABLE",
  ]),
  serialized: z.boolean().optional(),
  variants: z.array(variantSchema).min(1),
});

export const productUpdateSchema = productSchema.omit({ variants: true }).partial();

export const quoteSchema = z.object({
  customerId: uuid,
  opportunityId: uuid.nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  currencyCode,
  exchangeRateToUsd: positiveMoney,
  shipping: money.optional(),
  insurance: money.optional(),
  tax: money.optional(),
  bankFees: money.optional(),
  incoterm: z.string().max(20).nullable().optional(),
  paymentTerms: z.string().max(1000).nullable().optional(),
  deliveryTerms: z.string().max(1000).nullable().optional(),
  warrantyTerms: z.string().max(1000).nullable().optional(),
  remarks: z.string().max(5000).nullable().optional(),
  items: z
    .array(
      z.object({
        productId: uuid,
        variantId: uuid,
        description: z.string().max(1000).optional(),
        quantity: z.number().int().positive(),
        unitPrice: positiveMoney,
        discount: money.optional(),
      }),
    )
    .min(1),
});

export const quoteTransitionSchema = z.object({
  status: z.enum([
    "PENDING_APPROVAL",
    "APPROVED",
    "SENT",
    "VIEWED",
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
  ]),
  note: z.string().max(2000).optional(),
});

export const orderTransitionSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "FULFILLING",
    "SHIPPED",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const paymentSchema = z.object({
  salesOrderId: uuid,
  reference: z.string().max(200).nullable().optional(),
  amount: positiveMoney,
  currencyCode,
  exchangeRateToUsd: positiveMoney,
  receivedAt: z.coerce.date().nullable().optional(),
  proofMetadata: jsonObject,
});

export const paymentVerificationSchema = z.discriminatedUnion("approved", [
  z.object({ approved: z.literal(true) }),
  z.object({
    approved: z.literal(false),
    rejectionReason: z.string().trim().min(1).max(2000),
  }),
]);

export const refundSchema = z.object({
  amount: positiveMoney,
  currencyCode,
  exchangeRateToUsd: positiveMoney,
  reason: z.string().trim().min(1).max(2000),
});
