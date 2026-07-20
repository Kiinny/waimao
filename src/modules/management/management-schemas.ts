import { z } from "zod";

import { TICKET_STATUSES } from "@/modules/management/management-domain";
import { REPORT_TYPES } from "@/modules/management/reporting";

const uuid = z.string().uuid();
const optionalUuid = uuid.nullable().optional();
const currencyCode = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());
const money = z
  .string()
  .regex(/^\d+(?:\.\d{1,4})?$/)
  .refine((value) => Number(value) >= 0, "Amount must be nonnegative");

export const ticketSchema = z.object({
  customerId: uuid,
  salesOrderId: optionalUuid,
  productId: optionalUuid,
  inventorySerialId: optionalUuid,
  assignedToId: optionalUuid,
  subject: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(10000),
  issueType: z.enum([
    "QUALITY",
    "DAMAGE",
    "MISSING_ITEM",
    "WRONG_ITEM",
    "TECHNICAL",
    "WARRANTY",
    "RETURN",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  attachmentIds: z.array(uuid).max(20).optional(),
  solution: z.string().trim().max(10000).nullable().optional(),
  costAmount: money.nullable().optional(),
  costCurrencyCode: currencyCode.nullable().optional(),
});

export const ticketUpdateSchema = ticketSchema
  .partial()
  .extend({
    status: z.enum(TICKET_STATUSES).optional(),
    expectedVersion: z.number().int().positive(),
  })
  .refine(
    (input) =>
      !["RESOLVED", "CLOSED"].includes(input.status ?? "") ||
      Boolean(input.solution?.trim()),
    { message: "A solution is required to resolve or close a ticket", path: ["solution"] },
  );

export const taskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(10000).nullable().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  assigneeId: uuid,
  teamCode: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,99}$/).nullable().optional(),
  entityType: z.string().trim().max(100).nullable().optional(),
  entityId: z.string().trim().max(100).nullable().optional(),
  dueAt: z.coerce.date().nullable().optional(),
  reminderAt: z.coerce.date().nullable().optional(),
});

export const taskUpdateSchema = taskSchema
  .omit({ status: true })
  .partial()
  .extend({
    status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
    expectedVersion: z.number().int().positive(),
  });

const settingsValue = z.record(z.string(), z.json());

export const settingsUpdateSchema = z
  .object({
    namespace: z.enum([
      "company",
      "currency",
      "tax",
      "bank",
      "template",
      "catalog",
      "backup",
    ]),
    key: z.string().trim().min(1).max(100),
    value: settingsValue,
    expectedVersion: z.number().int().positive().optional(),
    isSecret: z.boolean().optional(),
  })
  .superRefine((input, context) => {
    if (input.namespace === "company" && input.key === "profile") {
      const profile = z.object({
        name: z.string().trim().min(1),
        baseCurrency: currencyCode,
        defaultLocale: z.enum(["en", "zh"]),
        logoUrl: z.string().url().nullable().optional(),
        legalName: z.string().nullable().optional(),
        registrationNumber: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
      });
      const result = profile.safeParse(input.value);
      if (!result.success) {
        for (const issue of result.error.issues) {
          context.addIssue({
            code: "custom",
            message: issue.message,
            path: issue.path,
          });
        }
      }
    }
    if (input.namespace === "currency") {
      const result = z
        .object({ rateToUsd: z.number().positive(), effectiveAt: z.string().datetime().optional() })
        .safeParse(input.value);
      if (!result.success) {
        for (const issue of result.error.issues) {
          context.addIssue({
            code: "custom",
            message: issue.message,
            path: issue.path,
          });
        }
      }
    }
    if (input.namespace === "backup") {
      const result = z
        .object({
          retentionDays: z.number().int().min(1).max(3650),
          schedule: z.string().trim().min(1),
        })
        .safeParse(input.value);
      if (!result.success) {
        for (const issue of result.error.issues) {
          context.addIssue({
            code: "custom",
            message: issue.message,
            path: issue.path,
          });
        }
      }
    }
  });

const reportToDate = z.preprocess((value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}, z.coerce.date());

export const reportQuerySchema = z.object({
  type: z.enum(REPORT_TYPES),
  format: z.enum(["json", "csv"]).default("json"),
  from: z.coerce.date().optional(),
  to: reportToDate.optional(),
  ownerId: uuid.optional(),
});
