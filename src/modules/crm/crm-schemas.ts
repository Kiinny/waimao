import { z } from "zod";

const nullableText = z.string().trim().max(500).nullable().optional();
const optionalDate = z
  .string()
  .datetime()
  .transform((value) => new Date(value))
  .nullable()
  .optional();

export const leadStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
]);

export const createLeadSchema = z.object({
  companyName: z.string().trim().min(2).max(180),
  contactName: z.string().trim().min(1).max(120),
  email: z.union([z.email(), z.literal(""), z.null()]).optional().transform((value) => value || null),
  phone: nullableText,
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  source: z.string().trim().min(1).max(80),
  status: leadStatusSchema.exclude(["CONVERTED"]).optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  ownerId: z.uuid().optional(),
});

export const updateLeadSchema = createLeadSchema
  .omit({ ownerId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const convertLeadSchema = z.object({
  opportunityName: z.string().trim().min(2).max(180),
  value: z.string().regex(/^\d+(\.\d{1,4})?$/),
  currencyCode: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  exchangeRateToUsd: z.string().regex(/^\d+(\.\d{1,12})?$/),
  probability: z.number().int().min(0).max(100),
});

export const batchLeadSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100),
  ownerId: z.uuid().optional(),
  status: leadStatusSchema.exclude(["CONVERTED"]).optional(),
  confirmed: z.literal(true),
}).refine((value) => value.ownerId || value.status, "An assignment or status is required");

export const customerStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);

export const createCustomerSchema = z.object({
  companyName: z.string().trim().min(2).max(180),
  legalName: nullableText,
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  website: z.union([z.url(), z.literal(""), z.null()]).optional().transform((value) => value || null),
  email: z.union([z.email(), z.literal(""), z.null()]).optional().transform((value) => value || null),
  phone: nullableText,
  taxId: nullableText,
  status: customerStatusSchema.optional(),
  level: z.enum(["STANDARD", "KEY", "STRATEGIC"]).optional(),
  riskRating: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  riskNotes: z.string().trim().max(2000).nullable().optional(),
  ownerId: z.uuid().optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .omit({ ownerId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80),
  title: nullableText,
  email: z.union([z.email(), z.literal(""), z.null()]).optional().transform((value) => value || null),
  phone: nullableText,
  whatsapp: nullableText,
  wechat: nullableText,
  preferredChannel: z.enum(["EMAIL", "PHONE", "WHATSAPP", "WECHAT", "VIDEO"]).nullable().optional(),
  isPrimary: z.boolean().optional(),
  language: z.string().trim().min(2).max(12).optional(),
  timezone: nullableText,
  decisionRole: z.enum(["DECISION_MAKER", "INFLUENCER", "TECHNICAL", "FINANCE", "USER"]).nullable().optional(),
});

export const updateContactSchema = contactSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

const followUpFields = z.object({
  customerId: z.uuid().nullable().optional(),
  contactId: z.uuid().nullable().optional(),
  leadId: z.uuid().nullable().optional(),
  opportunityId: z.uuid().nullable().optional(),
  type: z.enum(["NOTE", "CALL", "MEETING", "EMAIL", "MESSAGE"]),
  channel: z.enum(["EMAIL", "PHONE", "WHATSAPP", "WECHAT", "VIDEO", "IN_PERSON"]),
  summary: z.string().trim().min(2).max(4000),
  outcome: nullableText,
  nextAction: nullableText,
  occurredAt: z.string().datetime().transform((value) => new Date(value)),
  nextActionAt: optionalDate,
  completedAt: optionalDate,
  attachments: z.array(z.object({
    fileName: z.string().trim().min(1).max(255),
    objectKey: z.string().trim().min(1).max(500),
    contentType: z.string().trim().min(1).max(120),
    sizeBytes: z.number().int().nonnegative(),
  })).max(20).optional(),
});

export const followUpSchema = followUpFields.refine(
  (value) => value.customerId || value.contactId || value.leadId || value.opportunityId,
  "A related CRM record is required",
);

export const updateFollowUpSchema = followUpFields
  .omit({ customerId: true, contactId: true, leadId: true, opportunityId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const opportunityStageSchema = z.enum([
  "QUALIFICATION",
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

export const opportunitySchema = z.object({
  customerId: z.uuid(),
  name: z.string().trim().min(2).max(180),
  value: z.string().regex(/^\d+(\.\d{1,4})?$/),
  currencyCode: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  exchangeRateToUsd: z.string().regex(/^\d+(\.\d{1,12})?$/),
  probability: z.number().int().min(0).max(100),
  expectedCloseAt: optionalDate,
  ownerId: z.uuid().optional(),
});

export const opportunityStageChangeSchema = z.object({
  stage: opportunityStageSchema,
  lossReason: z.string().trim().min(2).max(1000).nullable().optional(),
});

export const paginatedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  query: z.string().trim().max(200).optional(),
  countryCode: z.string().trim().length(2).optional(),
  source: z.string().trim().max(80).optional(),
  status: z.string().trim().max(40).optional(),
  ownerId: z.uuid().optional(),
  createdFrom: z.string().datetime().transform((value) => new Date(value)).optional(),
  createdTo: z.string().datetime().transform((value) => new Date(value)).optional(),
  level: z.string().trim().max(40).optional(),
  riskRating: z.string().trim().max(40).optional(),
  stage: z.string().trim().max(40).optional(),
  customerId: z.uuid().optional(),
});

export const leadCsvImportSchema = z.object({
  csv: z.string().min(1).max(5_000_000),
  commit: z.boolean().default(false),
  ownerId: z.uuid().optional(),
});
